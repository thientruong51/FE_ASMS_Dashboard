import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";

import { findSuitableContainers, placeContainer } from "@/api/clpApi";
import { getContainerType } from "@/api/containerTypeApi";

type Props = {
  data: any | null;
  onClose: () => void;
  onPlaced?: (resp: { success: boolean; data: any }) => void;
};

type Dims = { length: number; width: number; height: number };

const LOCAL_CONTAINER_TYPES_FILE = "/mnt/data/da999d8c-b4eb-43af-ace3-d202c3e7042e.png";

export default function OrderDetailDrawer({ data, onClose, onPlaced }: Props) {
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); // >=600
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >=900

  const [viewMode, setViewMode] = useState<"order" | "customer">("order");
  const [clpLoading, setClpLoading] = useState(false);
  const [clpSuggestions, setClpSuggestions] = useState<any[] | null>(null);
  const [_clpPayload, setClpPayload] = useState<any | null>(null);
  const [clpResponseRaw, setClpResponseRaw] = useState<any | null>(null);
  const [placing, setPlacing] = useState(false);
  const [lastPlaceResp, setLastPlaceResp] = useState<any | null>(null);

  const [containerTypeCache, setContainerTypeCache] = useState<Record<string | number, any>>({});
  const [localContainerTypesCache, setLocalContainerTypesCache] = useState<any[] | null>(null);

  const computeStorageDays = (deposit?: string | null, ret?: string | null) => {
    if (!deposit || !ret) return null;
    const d = new Date(deposit);
    const r = new Date(ret);
    if (isNaN(d.getTime()) || isNaN(r.getTime())) return null;
    const days = Math.ceil((r.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const loadLocalContainerTypesFile = async (): Promise<any[] | null> => {
    if (localContainerTypesCache) return localContainerTypesCache;
    try {
      const resp = await fetch(LOCAL_CONTAINER_TYPES_FILE, { method: "GET" });
      const text = await resp.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setLocalContainerTypesCache(parsed);
        return parsed;
      }
      return null;
    } catch (err) {
      console.error("Failed to load local container types file:", err);
      return null;
    }
  };

useEffect(() => {
  setClpSuggestions(null);
  setClpPayload(null);
  setClpResponseRaw(null);
  setClpLoading(false);

  if (!data) return;

  (async () => {
    setClpSuggestions(null);
    setClpPayload(null);
    setClpResponseRaw(null);
    setClpLoading(true);

    try {
      const explicitLength =
        data.packageLength ?? data.length ?? data.containerLength ?? data.dimensions?.length ?? null;
      const explicitWidth =
        data.packageWidth ?? data.width ?? data.containerWidth ?? data.dimensions?.width ?? null;
      const explicitHeight =
        data.packageHeight ?? data.height ?? data.containerHeight ?? data.dimensions?.height ?? null;

      let dims: Dims | null = null;

      if (explicitLength != null && explicitWidth != null && explicitHeight != null) {
        dims = {
          length: Number(explicitLength),
          width: Number(explicitWidth),
          height: Number(explicitHeight),
        };
      } else {
        const containerTypeId = data.containerType ?? data.containerTypeId ?? null;
        if (containerTypeId != null) {
          const cacheKey = String(containerTypeId);
          let ct = containerTypeCache[cacheKey];
          if (!ct) {
            try {
              ct = await getContainerType(Number(containerTypeId));
              setContainerTypeCache((prev) => ({ ...prev, [cacheKey]: ct }));
            } catch (err) {
              console.warn("getContainerType failed for id=", containerTypeId, err);
              ct = null;
            }
          }
          if (ct) {
            const l = ct.length ?? ct.packageLength ?? ct.dimensions?.length ?? ct.size?.length ?? null;
            const w = ct.width ?? ct.packageWidth ?? ct.dimensions?.width ?? ct.size?.width ?? null;
            const h = ct.height ?? ct.packageHeight ?? ct.dimensions?.height ?? ct.size?.height ?? null;
            if (l != null && w != null && h != null) {
              dims = { length: Number(l), width: Number(w), height: Number(h) };
            }
          }
        }

        if (!dims) {
          const localList = await loadLocalContainerTypesFile();
          if (Array.isArray(localList)) {
            const containerTypeId = data.containerType ?? data.containerTypeId ?? null;
            const found = localList.find((ct: any) => {
              if (ct.containerTypeId != null && String(ct.containerTypeId) === String(containerTypeId)) return true;
              if (ct.id != null && String(ct.id) === String(containerTypeId)) return true;
              if (ct.type != null && String(ct.type) === String(containerTypeId)) return true;
              if (ct.containerType != null && String(ct.containerType) === String(containerTypeId)) return true;
              return false;
            });
            if (found) {
              const l = found.length ?? found.packageLength ?? found.dimensions?.length ?? null;
              const w = found.width ?? found.packageWidth ?? found.dimensions?.width ?? null;
              const h = found.height ?? found.packageHeight ?? found.dimensions?.height ?? null;
              if (l != null && w != null && h != null) {
                dims = { length: Number(l), width: Number(w), height: Number(h) };
              }
            }
          }
        }
      }

      const rawWeight = data.packageWeight ?? data.weight ?? data.package_weight ?? null;
      const packageWeight = rawWeight == null ? 10 : Number(rawWeight);

      const productTypeIds =
        Array.isArray(data.productTypeIds) && data.productTypeIds.length > 0
          ? data.productTypeIds
          : data.productTypeId
          ? [data.productTypeId]
          : [];

      const deposit = data._orderDepositDate ?? data.depositDate ?? null;
      const ret = data._orderReturnDate ?? data.returnDate ?? null;
      const storageDays = computeStorageDays(deposit, ret);

      // Now productTypeIds is OPTIONAL — only require dims + storageDays to proceed
      const canCallClp = dims !== null && storageDays !== null;
      if (!canCallClp) {
        const missing: string[] = [];
        if (dims === null) missing.push("package dimensions (length/width/height) missing");
        if (storageDays === null) missing.push("depositDate/returnDate invalid or missing");
        setClpResponseRaw({ error: "Insufficient real data to call CLP", missing });
        setClpSuggestions([]);
        setClpLoading(false);
        return;
      }

      const dimsNonNull: Dims = dims as Dims;

      // Build payloads but only include product type fields when we actually have them
      const basePayload: any = {
        packageLength: dimsNonNull.length,
        packageWidth: dimsNonNull.width,
        packageHeight: dimsNonNull.height,
        packageWeight,
        storageDays,
      };

      // payload as array (when productTypeIds present include it)
      const payloadArray: any = { ...basePayload };
      if (productTypeIds.length > 0) payloadArray.productTypeIds = productTypeIds;

      // payload single (use first product type if available)
      const payloadSingle: any = { ...basePayload };
      if (productTypeIds.length > 0) payloadSingle.packageTypeID = productTypeIds[0];

      setClpPayload(payloadArray);

      // First try with array-style payload (may include productTypeIds or not)
      const res1 = await findSuitableContainers(payloadArray as any);
      setClpResponseRaw({ tryArray: res1 });

      const list1 = Array.isArray(res1) ? res1 : (res1?.data ?? []);
      if (Array.isArray(list1) && list1.length > 0) {
        setClpSuggestions(list1);
        setClpLoading(false);
        return;
      }

      // If no results, try single-style payload (may or may not include packageTypeID)
      setClpPayload(payloadSingle);
      const res2 = await findSuitableContainers(payloadSingle as any);
      setClpResponseRaw((prev: any) => ({ ...prev, trySingle: res2 }));
      const list2 = Array.isArray(res2) ? res2 : (res2?.data ?? []);
      if (Array.isArray(list2) && list2.length > 0) {
        setClpSuggestions(list2);
        setClpLoading(false);
        return;
      }

      // no suggestions
      setClpSuggestions([]);
    } catch (err) {
      console.error("[CLP] Error during CLP flow:", err);
      setClpResponseRaw({ error: (err as any)?.message ?? err });
      setClpSuggestions([]);
    } finally {
      setClpLoading(false);
    }
  })();
}, [data]); // eslint-disable-line react-hooks/exhaustive-deps



  const handlePlaceContainer = async (suggestion: any) => {
    if (!suggestion || !data) return;
    setPlacing(true);
    setLastPlaceResp(null);

    const orderDetailId = data.orderDetailId ?? data.id ?? data._id ?? null;

    const payload = {
      containerCode: suggestion.containerCode,
      floorCode: suggestion.floorCode ?? suggestion.shelfCode ?? null,
      layer: suggestion.layer ?? 0,
      serialNumber: suggestion.serialNumber ?? 0,
      productTypeId:
        Array.isArray(data.productTypeIds) && data.productTypeIds.length > 0
          ? data.productTypeIds[0]
          : data.productTypeId ?? 0,
      requiresRearrangement: suggestion.requiresRearrangement ?? false,
      rearrangeContainerCode: suggestion.rearrangeContainerCode ?? null,
      ...(orderDetailId != null ? { orderDetailId: Number(orderDetailId) } : {}),
    };

    try {
      const resp = await placeContainer(payload);
      setLastPlaceResp(resp);

      // notify parent
      onPlaced?.({ success: true, data: resp });
    } catch (err) {
      const errObj = { error: (err as any)?.message ?? err };
      setLastPlaceResp(errObj);

      // notify parent about failure
      onPlaced?.({ success: false, data: errObj });
    } finally {
      setPlacing(false);
    }
  };

  if (!data) return <Box sx={{ p: 3 }} />;

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1.5}
        flexDirection={isSmUp ? "row" : "column"}
        gap={1}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Box>
            <Typography fontWeight={600} fontSize={isSmUp ? 15 : 14}>
              Order Detail
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isSmUp ? 13 : 12 }}>
              {viewMode === "order" ? "Detail Info" : "Customer Info"}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="View Customer">
            <IconButton
              size="small"
              color={viewMode === "customer" ? "primary" : "default"}
              onClick={() => setViewMode("customer")}
            >
              <PersonOutlineRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="View Order">
            <IconButton
              size="small"
              color={viewMode === "order" ? "primary" : "default"}
              onClick={() => setViewMode("order")}
            >
              <ReceiptLongRoundedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* PARENT ORDER HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexDirection={isSmUp ? "row" : "column"}
        gap={1}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{
              width: isSmUp ? 46 : 40,
              height: isSmUp ? 46 : 40,
              bgcolor: "#e3f2fd",
              color: "#1976d2",
              fontWeight: 600,
              fontSize: isSmUp ? 18 : 14,
            }}
          >
            {String(data._orderCode ?? data.orderCode ?? "OD").slice(0, 2).toUpperCase()}
          </Avatar>

          <Box>
            <Typography fontWeight={600} sx={{ fontSize: isSmUp ? 16 : 14 }}>
              {data._orderCode ?? data.orderCode ?? "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: isSmUp ? 13 : 12 }}>
              Status: {data._orderStatus ?? data.status ?? "-"} • Payment:{" "}
              {data._orderPaymentStatus ?? data.paymentStatus ?? "-"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* date / meta */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: isSmUp ? 13 : 12, textAlign: "right", mb: 2 }}
      >
        Deposit: {data._orderDepositDate ?? data.depositDate ?? "-"} • Return:{" "}
        {data._orderReturnDate ?? data.returnDate ?? "-"}
      </Typography>

      {/* BODY */}
      {viewMode === "order" ? (
        <Box>
          <Typography fontWeight={600} mb={1}>
            Order Details Code: {data.orderDetailId ?? "-"}
          </Typography>

          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2, bgcolor: "#fff" }}>
            {/* BASIC FIELDS */}
            <Typography fontSize={14} fontWeight={600}>
              Pricing & Quantity
            </Typography>
            <Typography variant="body2" mb={1}>
              Price: {typeof data.price === "number" ? `${data.price.toLocaleString()} đ` : data.price ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600} mt={1.5}>
              Container
            </Typography>
            <Typography variant="body2" mb={1}>
              Container Type: {data.containerType ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600} mt={1.5}>
              Product Types
            </Typography>
            <Typography variant="body2" mb={1}>
              {Array.isArray(data.productTypeIds) ? data.productTypeIds.join(", ") : data.productTypeIds ?? data.productTypeId ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600} mt={1.5}>
              Services
            </Typography>
            <Typography variant="body2" mb={1}>
              {Array.isArray(data.serviceIds) ? data.serviceIds.join(", ") : data.serviceIds ?? "-"}
            </Typography>

            {/* CLP section */}
            <Box mt={2}>
              <Typography fontSize={14} fontWeight={600} mb={1.5}>
                CLP Suggestions:
              </Typography>

              {clpLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading suggestions...
                </Typography>
              ) : Array.isArray(clpSuggestions) && clpSuggestions.length > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "flex-start",
                  }}
                >
                  {clpSuggestions.map((s, idx) => (
                    <Card
                      key={s.containerCode ?? idx}
                      variant="outlined"
                      sx={{
                        flex: isSmUp ? "1 1 calc(50% - 8px)" : "1 1 100%",
                        minWidth: isSmUp ? "calc(50% - 8px)" : "100%",
                        p: 1.5,
                      }}
                    >
                      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                        <Typography fontWeight={600} fontSize={15} mb={0.5}>
                          Container: {s.containerCode}
                        </Typography>

                        <Typography variant="body2" color="text.secondary" mb={0.25}>
                          Floor: {s.floorCode ?? "-"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={0.25}>
                          Serial: {s.serialNumber ?? "-"}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Score: {s.score ?? s.fitScore ?? "-"}
                        </Typography>

                        <Box display="flex" justifyContent="flex-end" mt={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handlePlaceContainer(s)}
                            disabled={placing}
                            sx={{ textTransform: "none" }}
                          >
                            {placing ? "Placing..." : "Place"}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}

                  {lastPlaceResp && (
                    <Card variant="outlined" sx={{ flex: "1 1 100%", p: 1.5 }}>
                      <CardContent>
                        <Typography fontSize={13} fontWeight={600} mb={1}>
                          Last place response
                        </Typography>

                        <Box
                          component="pre"
                          sx={{
                            p: 1,
                            bgcolor: "#fafafa",
                            borderRadius: 1,
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                            maxHeight: { xs: 160, sm: 240 },
                            overflow: "auto",
                          }}
                        >
                          {JSON.stringify(lastPlaceResp, null, 2)}
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    No suggestion returned from CLP.
                  </Typography>

                  {clpResponseRaw && (
                    <Card variant="outlined" sx={{ mt: 1 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          CLP raw response / debug info:
                        </Typography>
                        <Box
                          component="pre"
                          sx={{
                            p: 1,
                            bgcolor: "#fff6f6",
                            borderRadius: 1,
                            fontSize: 12,
                            whiteSpace: "pre-wrap",
                            overflowX: "auto",
                            maxHeight: { xs: 160, sm: 280 },
                          }}
                        >
                          {JSON.stringify(clpResponseRaw, null, 2)}
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          <Typography fontWeight={600} mb={1}>
            Customer (Order) Info
          </Typography>

          <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2, bgcolor: "#fff" }}>
            <Typography fontSize={14} fontWeight={600}>
              Order Code
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data._orderCode ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Status / Payment
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data._orderStatus ?? "-"} / {data._orderPaymentStatus ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Deposit / Return
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {data._orderDepositDate ?? data.depositDate ?? "-"} / {data._orderReturnDate ?? data.returnDate ?? "-"}
            </Typography>

            <Typography fontSize={14} fontWeight={600}>
              Order Total Price
            </Typography>
            <Typography variant="body2" mb={1.5}>
              {typeof data._orderTotalPrice === "number"
                ? `${data._orderTotalPrice.toLocaleString()} đ`
                : data._orderTotalPrice ?? data.totalPrice ?? "-"}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
