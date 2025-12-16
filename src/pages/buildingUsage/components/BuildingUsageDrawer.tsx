import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { BuildingUsageItem } from "@/api/dashboardApi";
import { useTranslation } from "react-i18next";
import { translateBuildingName } from "@/utils/buildingNames";
import { translateStorageTypeName } from "@/utils/storageTypeNames";

type Props = {
  open: boolean;
  building: BuildingUsageItem | null;
  onClose: () => void;
};

export default function BuildingUsageDrawer({ open, building, onClose }: Props) {
  const { t } = useTranslation("dashboard");

  if (!building) return null;

  const isSelfStorage = !!building.storageTypeSummary;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 640 } } }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* ---------- HEADER ---------- */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography fontWeight={700} fontSize={18}>
              {translateBuildingName(t, building.buildingName)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {building.buildingCode}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* ---------- CONTENT ---------- */}
        <Box sx={{ p: 2, overflow: "auto", flex: 1 }}>
          {/* SUMMARY */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack spacing={1}>
                <Row
                  label={t("drawer.type")}
                  value={t(`buildingTypeMap.${building.buildingType}`, {
                    defaultValue: building.buildingType,
                  })}
                />

                <Row
                  label={t("drawer.percentUsed")}
                  value={
                    building.percentUsed != null ? (
                      <Chip
                        size="small"
                        label={`${building.percentUsed}%`}
                        color={
                          building.percentUsed >= 80
                            ? "error"
                            : building.percentUsed >= 50
                            ? "warning"
                            : "success"
                        }
                      />
                    ) : (
                      "-"
                    )
                  }
                />

                {isSelfStorage ? (
                  <>
                    <Row
                      label={t("drawer.occupiedRooms")}
                      value={`${building.storageTypeSummary?.occupiedRooms} ${t(
                        "units.rooms"
                      )}`}
                    />
                    <Row
                      label={t("drawer.totalRooms")}
                      value={`${building.storageTypeSummary?.totalRooms} ${t(
                        "units.rooms"
                      )}`}
                    />
                  </>
                ) : (
                  <>
                    <Row
                      label={t("drawer.usedVolume")}
                      value={`${building.usedVolume} ${t("units.volume")}`}
                    />
                    <Row
                      label={t("drawer.totalVolume")}
                      value={`${building.totalVolume} ${t("units.volume")}`}
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* DETAILS */}
          {isSelfStorage && building.storageTypeDetails && (
            <>
              <Typography fontWeight={700} mb={1}>
                {t("drawer.storageTypeDetails")}
              </Typography>

              {building.storageTypeDetails.map((s) => (
                <Card key={s.storageTypeId} variant="outlined" sx={{ mb: 1 }}>
                  <CardContent>
                    <Typography fontWeight={600}>
                      {translateStorageTypeName(t, s.storageTypeName)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {s.occupiedRooms}/{s.totalRooms} {t("units.rooms")} (
                      {s.percentUsed}%)
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}

/* ---------- SMALL COMPONENT ---------- */
function Row({ label, value }: { label: string; value: any }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Box>
  );
}
