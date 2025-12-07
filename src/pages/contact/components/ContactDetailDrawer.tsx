import  { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi";

type Props = {
  contact?: any | null;
  open: boolean;
  onClose: () => void;
};

function a11yProps(index: number) {
  return {
    id: `contact-tab-${index}`,
    "aria-controls": `contact-tabpanel-${index}`,
  };
}

export default function ContactDetailDrawer({ contact: contactProp, open, onClose }: Props) {
  const { t } = useTranslation("contact");
  const [tabIndex, setTabIndex] = useState(0);
  const [contact, setContact] = useState<any | null>(contactProp ?? null);
  const [, setLoading] = useState(false);

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
        const data = resp?.data ?? resp;
        if (data) setContact(data);
      } catch (err) {
        console.warn("Failed to fetch contact detail", err);
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

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 720, md: 760 } } }}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 56, height: 56, fontWeight: 700 }}>{headerCustomer ? String(headerCustomer).slice(0, 2).toUpperCase() : "CT"}</Avatar>
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
            <IconButton onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ px: 2 }}>
          {/* chỉ giữ tab "Liên hệ" */}
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="contact tabs">
            <Tab label={t("tabs.contact") ?? "Liên hệ"} {...a11yProps(0)} icon={<PersonOutlineRoundedIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        <Divider />

        <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
          {/* Nội dung tab Liên hệ */}
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

                    {/* other fields */}
                    {contact &&
                      Object.keys(contact)
                        .filter((k) => !["contactId", "name", "phoneContact", "email", "message"].includes(k))
                        .map((k) => {
                          const v = contact[k];
                          if (!has(v)) return null;
                          const display = Array.isArray(v) ? v.join(", ") : String(v);
                          return (
                            <Box key={k} sx={{ display: "flex", gap: 2 }}>
                              <Box sx={{ width: 140, color: "text.secondary", textTransform: "capitalize" }}>{k.replace(/([A-Z])/g, " $1")}</Box>
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
          <Button variant="outlined" onClick={onClose}>
            {t("actions.close") ?? "Đóng"}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
