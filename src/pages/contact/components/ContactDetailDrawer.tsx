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
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi";

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

export default function ContactDetailDrawer({ contact: contactProp, open, onClose, onToggled }: Props) {
  const { t } = useTranslation("contact");
  const [tabIndex, setTabIndex] = useState(0);
  const [contact, setContact] = useState<any | null>(contactProp ?? null);
  const [loading, setLoading] = useState(false);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error" | "info">("info");

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
        console.debug("Fetching contact detail for", contact.contactId);
        const resp = await contactApi.getContact(contact.contactId);
        if (!mounted) return;
        const data = resp?.data ?? resp;
        if (data) setContact(data);
      } catch (err) {
        console.warn("Failed to fetch contact detail", err);
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

  const headerCustomer = useMemo(() => contact?.customerName ?? contact?.name ?? contact?.customerCode ?? null, [contact]);

  const handleToggleActive = async () => {
    if (!contact?.contactId) {
      console.warn("No contactId to toggle", contact);
      setSnackMsg(t("errors.noContactId") ?? "No contact id");
      setSnackSeverity("error");
      setSnackOpen(true);
      return;
    }

    try {
      setLoading(true);
      console.debug("Calling toggleActive for", contact.contactId);

      if (typeof contactApi.toggleActive !== "function") {
        console.error("contactApi.toggleActive is not defined");
        setSnackMsg(t("errors.apiMissing") ?? "Toggle API not available");
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }

      const resp = await contactApi.toggleActive(contact.contactId);
      console.debug("toggleActive response:", resp);

      if (resp?.data) {
        setContact(resp.data);
      } else {
        try {
          const fresh = await contactApi.getContact(contact.contactId);
          setContact(fresh?.data ?? contact);
        } catch (e) {
          console.warn("Failed to refresh contact after toggle", e);
        }
      }

      const message = resp?.message ?? (t("messages.toggleSuccess") ?? "Updated successfully");
      setSnackMsg(message);
      setSnackSeverity("success");
      setSnackOpen(true);

      try {
        onToggled?.(contact.contactId);
      } catch (e) {
        console.warn("onToggled callback threw", e);
      }
    } catch (err: any) {
      console.error("Toggle active failed", err);
      const msg = err?.response?.data?.message ?? err?.message ?? (t("errors.unknown") ?? "Operation failed");
      setSnackMsg(msg);
      setSnackSeverity("error");
      setSnackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const isActive = contact?.isActive !== false; 

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>
                {headerCustomer ? String(headerCustomer).slice(0, 2).toUpperCase() : (t("labels.initialsFallback") ?? "CT")}
              </Avatar>
              <Box>
                <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                  {headerCustomer ?? t("labels.contact")}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {t("page.clickToView") ?? "Click to view"}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton onClick={onClose} disabled={loading}>
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ px: 2 }}>
            {/* only "Liên hệ" tab */}
            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="contact tabs">
              <Tab label={t("tabs.contact") ?? "Liên hệ"} {...a11yProps(0)} icon={<PersonOutlineRoundedIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          <Divider />

          <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
            {/* Contact tab content */}
            {tabIndex === 0 && (
              <Box role="tabpanel" id="contact-tabpanel-0" aria-labelledby="contact-tab-0">
                <Typography fontWeight={700} sx={{ mb: 1 }}>
                  {t("labels.contactInformation") ?? "Thông tin liên hệ"}
                </Typography>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={1}>
                      {has(contact?.name) && (
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.name") ?? "Name"}</Box>
                          <Box sx={{ flex: 1, fontWeight: 700 }}>{contact.name}</Box>
                        </Box>
                      )}
                      {has(contact?.phoneContact) && (
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.phone") ?? "Phone"}</Box>
                          <Box sx={{ flex: 1 }}>{contact.phoneContact}</Box>
                        </Box>
                      )}
                      {has(contact?.email) && (
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.email") ?? "Email"}</Box>
                          <Box sx={{ flex: 1 }}>{contact.email}</Box>
                        </Box>
                      )}
                      {has(contact?.message) && (
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ width: 140, color: "text.secondary" }}>{t("labels.message") ?? "Message"}</Box>
                          <Box sx={{ flex: 1 }}>{contact.message}</Box>
                        </Box>
                      )}

                      {/* other fields (dynamic) */}
                      {contact &&
                        Object.keys(contact)
                          .filter((k) => !["contactId", "name", "phoneContact", "email", "message"].includes(k))
                          .map((k) => {
                            const v = contact[k];
                            if (!has(v)) return null;
                            const display = Array.isArray(v) ? v.join(", ") : String(v);

                            const label = t(`fields.${k}`, { defaultValue: fallbackLabelFromKey(k) });

                            return (
                              <Box key={k} sx={{ display: "flex", gap: 2 }}>
                                <Box sx={{ width: 140, color: "text.secondary", textTransform: "capitalize" }}>{label}</Box>
                                <Box sx={{ flex: 1 }}>{display}</Box>
                              </Box>
                            );
                          })}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={onClose} disabled={loading}>
              {t("actions.close") ?? "Đóng"}
            </Button>

            <Button variant="contained" onClick={handleToggleActive} disabled={loading || !contact?.contactId}>
              {isActive ? (t("actions.markProcessed") ?? "Đánh dấu đã xử lí") : (t("actions.reopen") ?? "Đặt lại active")}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackOpen(false)} severity={snackSeverity} sx={{ width: "100%" }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
