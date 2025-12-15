import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Avatar,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ImageIcon from "@mui/icons-material/Image";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi";
import ContactCustomerDialog from "@/pages/order/components/ContactCustomerDialog";

type Props = {
  contact?: any | null;
  open: boolean;
  onClose: () => void;
  onToggled?: (contactId: number | string) => void;
};

function a11yProps(index: number) {
  return {
    id: `contact-tab-${index}`,
    "aria-controls": `contact-tabpanel-${index}`,
  };
}

function fallbackLabelFromKey(k: string) {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

export default function ContactDetailDrawer({
  contact: contactProp,
  open,
  onClose,
  onToggled,
}: Props) {
  const { t } = useTranslation("contact");

  const [tabIndex, setTabIndex] = useState(0);
  const [contact, setContact] = useState<any | null>(contactProp ?? null);
  const [loading, setLoading] = useState(false);

  const [updateImgOpen, setUpdateImgOpen] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] =
    useState<"success" | "error" | "info">("info");


  useEffect(() => {
    setContact(contactProp ?? null);
  }, [contactProp]);

  useEffect(() => {
    if (open) setTabIndex(0);
  }, [open]);

  useEffect(() => {
    let mounted = true;
    if (!open || !contact?.contactId) return;

    (async () => {
      try {
        setLoading(true);
        const resp = await contactApi.getContact(contact.contactId);
        if (!mounted) return;
        setContact(resp?.data ?? resp);
      } catch (err) {
        setSnackMsg(t("errors.fetchDetail") ?? "Failed to fetch contact detail");
        setSnackSeverity("error");
        setSnackOpen(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, contact?.contactId]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  const headerCustomer = useMemo(
    () =>
      contact?.customerName ??
      contact?.name ??
      contact?.customerCode ??
      null,
    [contact]
  );

  const images: string[] = useMemo(() => {
    if (!contact) return [];
    if (Array.isArray(contact.image)) return contact.image.filter(Boolean);
    if (typeof contact.image === "string" && contact.image)
      return [contact.image];
    return [];
  }, [contact]);


  const handleToggleActive = async () => {
    if (!contact?.contactId) return;

    try {
      setLoading(true);
      const resp = await contactApi.toggleActive(contact.contactId);
      setContact(resp?.data ?? contact);

      setSnackMsg(
        resp?.message ?? (t("messages.toggleSuccess") ?? "Updated successfully")
      );
      setSnackSeverity("success");
      setSnackOpen(true);

      onToggled?.(contact.contactId);
    } catch (err: any) {
      setSnackMsg(
        err?.response?.data?.message ??
          err?.message ??
          t("errors.unknown") ??
          "Operation failed"
      );
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const isActive = contact?.isActive !== false;


  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}
      >
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>
                {headerCustomer
                  ? String(headerCustomer).slice(0, 2).toUpperCase()
                  : "CT"}
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                  {headerCustomer ?? t("labels.contact")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("page.clickToView") ?? "Click to view"}
                </Typography>
              </Box>
            </Box>

            <IconButton onClick={onClose} disabled={loading}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Divider />

          {/* Tabs */}
          <Box sx={{ px: 2 }}>
            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}>
              <Tab
                label={t("tabs.contact") ?? "Liên hệ"}
                {...a11yProps(0)}
                icon={<PersonOutlineRoundedIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <Divider />

          {/* Content */}
          <Box sx={{ overflow: "auto", p: 3, flex: "1 1 auto" }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  {has(contact?.name) && (
                    <Field label={t("labels.name")} value={contact.name} bold />
                  )}
                  {has(contact?.phoneContact) && (
                    <Field
                      label={t("labels.phone")}
                      value={contact.phoneContact}
                    />
                  )}
                  {has(contact?.email) && (
                    <Field label={t("labels.email")} value={contact.email} />
                  )}
                  {has(contact?.message) && (
                    <Field
                      label={t("labels.message")}
                      value={contact.message}
                    />
                  )}

                  {/* IMAGE GALLERY */}
                  <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                    <Box sx={{ width: 140, color: "text.secondary" }}>
                      {t("labels.images") ?? "Images"}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {images.length > 0 ? (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {images.map((src, i) => (
                            <Box
                              key={i}
                              sx={{
                                width: 96,
                                height: 96,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid #eee",
                                position: "relative",
                              }}
                            >
                              <img
                                src={src}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 4,
                                  right: 4,
                                  bgcolor: "rgba(0,0,0,0.5)",
                                  color: "#fff",
                                }}
                                onClick={() => window.open(src, "_blank")}
                              >
                                <OpenInFullIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography color="text.secondary">
                          {t("labels.noImage") ?? "No image"}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Other fields */}
                  {contact &&
                    Object.keys(contact)
                      .filter(
                        (k) =>
                          ![
                            "contactId",
                            "name",
                            "phoneContact",
                            "email",
                            "message",
                            "image",
                          ].includes(k)
                      )
                      .map((k) => {
                        const v = contact[k];
                        if (!has(v)) return null;
                        return (
                          <Field
                            key={k}
                            label={t(`fields.${k}`, {
                              defaultValue: fallbackLabelFromKey(k),
                            })}
                            value={Array.isArray(v) ? v.join(", ") : String(v)}
                          />
                        );
                      })}
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Footer */}
          <Box
            sx={{
              p: 2,
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              onClick={() => setUpdateImgOpen(true)}
              disabled={!contact?.contactId}
            >
              {t("actions.updateImages") ?? "Update images"}
            </Button>

            <Button
              variant="contained"
              onClick={handleToggleActive}
              disabled={loading || !contact?.contactId}
            >
              {isActive
                ? t("actions.markProcessed") ?? "Đánh dấu đã xử lí"
                : t("actions.reopen") ?? "Đặt lại active"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* UPDATE IMAGE DIALOG */}
      <ContactCustomerDialog
        open={updateImgOpen}
        onClose={() => setUpdateImgOpen(false)}
        mode="update-images"
        contactId={contact?.contactId}
        existingImages={images}
        onUpdated={async () => {
          if (!contact?.contactId) return;
          const refreshed = await contactApi.getContact(contact.contactId);
          setContact(refreshed?.data ?? contact);
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
      >
        <Alert severity={snackSeverity}>{snackMsg}</Alert>
      </Snackbar>
    </>
  );
}

/* ================= Helper ================= */

function Field({
  label,
  value,
  bold,
}: {
  label?: string;
  value?: string;
  bold?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Box sx={{ width: 140, color: "text.secondary" }}>{label}</Box>
      <Box sx={{ flex: 1, fontWeight: bold ? 700 : 400 }}>{value}</Box>
    </Box>
  );
}
