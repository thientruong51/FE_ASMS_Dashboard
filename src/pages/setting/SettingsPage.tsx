import React from "react";
import {
  Stack,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  InputAdornment,
  IconButton,
  useTheme,
  Snackbar,
  Alert,
  MenuItem,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { useTranslation } from "react-i18next";


function parseJwt(token: string | null): Record<string, any> | null {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1] ?? "";
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const binary = atob(padded);
    const jsonPayload = decodeURIComponent(
      binary
        .split("")
        .map((c) => {
          const hex = c.charCodeAt(0).toString(16).padStart(2, "0");
          return "%" + hex;
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "") as string;
const api = axios.create({
  baseURL: BASE,
});

const LANG_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation("settings");
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  const [account, setAccount] = React.useState({
    id: "", 
    employeeCode: "",
    username: "staff",
    name: "Dennis",
    phone: "254 555-0123",
    location: "Nairobi, Kenya",
    postal: "20033",
  });

  const [passwords, setPasswords] = React.useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [show, setShow] = React.useState({ current: false, newPass: false, confirm: false });

  const [avatarSrc, setAvatarSrc] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [snack, setSnack] = React.useState<{ open: boolean; severity: "success" | "error" | "info"; message: string }>(
    { open: false, severity: "info", message: "" }
  );
  const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

  const initialLang = (localStorage.getItem("locale") || i18n.language || "vi").slice(0, 2);
  const [language, setLanguage] = React.useState<string>(initialLang);
  const [notificationEmail, setNotificationEmail] = React.useState<string>("taosk@example.com");

  React.useEffect(() => {
    const target = (language || i18n.language || "vi").slice(0, 2);
    if (i18n.language !== target) i18n.changeLanguage(target).catch(() => {});
  }, []); 

  React.useEffect(() => {
    if (!language) return;
    const langNormalized = language.slice(0, 2);
    if (i18n.language !== langNormalized) {
      i18n.changeLanguage(langNormalized).catch((err) => {
        console.error("changeLanguage failed", err);
      });
    }
    try {
      localStorage.setItem("locale", langNormalized);
    } catch {
      // ignore storage errors
    }
  }, [language, i18n]);

  const handleAccountChange = (key: keyof typeof account) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAccount((s) => ({ ...s, [key]: e.target.value }));

  const handlePasswordChange =
    (key: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setPasswords((s) => ({ ...s, [key]: e.target.value }));

  const handleAvatarChoose = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarSrc(String(reader.result));
    reader.readAsDataURL(file);
  };

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) handleAvatarChoose(f);
  };
  const triggerFile = () => fileInputRef.current?.click();

  React.useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const payload = parseJwt(token);
    if (!payload) return;

    setAccount((prev) => ({
      id: payload.Id ?? prev.id,
      employeeCode: payload.EmployeeCode ?? payload.employeeCode ?? "",
      username: payload.Username ?? payload.username ?? prev.username,
      name: payload.Name ?? payload.name ?? prev.name,
      phone: payload.Phone ?? payload.phone ?? prev.phone,
      location: payload.Address ?? payload.address ?? prev.location,
      postal: prev.postal,
    }));

    const avatarClaim = payload.Avatar ?? payload.avatarUrl ?? payload.avatar ?? null;
    if (typeof avatarClaim === "string" && avatarClaim) setAvatarSrc(avatarClaim);

    if (payload.Locale) {
      const payloadLocale = String(payload.Locale).slice(0, 2);
      setLanguage(payloadLocale);
      try {
        i18n.changeLanguage(payloadLocale);
      } catch {
        /* ignore */
      }
    }
    if (payload.NotificationEmail) setNotificationEmail(String(payload.NotificationEmail));
  }, []);

  const buildAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSaveAccount = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!account.id) {
      setSnack({ open: true, severity: "error", message: t("errors.employeeIdMissing") });
      return;
    }

    const token = localStorage.getItem("accessToken");
    const tokenPayload = parseJwt(token);

    let isActiveVal: boolean | undefined = undefined;
    if (tokenPayload) {
      const raw = tokenPayload.IsActive ?? tokenPayload.isActive ?? tokenPayload.IsActiveString ?? null;
      if (raw !== null && raw !== undefined) {
        if (typeof raw === "boolean") isActiveVal = raw;
        else if (typeof raw === "string") isActiveVal = raw.toLowerCase() === "true";
      }
    }

    const payload: Record<string, any> = {
      employeeCode: account.employeeCode ?? "",
      username: account.username ?? "",
      name: account.name ?? "",
      address: account.location ?? "",
      phone: account.phone ?? "",
    };

    if (typeof isActiveVal === "boolean") payload.isActive = isActiveVal;

    try {
      const res = await api.put(`/api/Employee/${encodeURIComponent(String(account.id))}`, payload, {
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      });

      console.log("PUT /api/Employee success:", res.data);
      setSnack({ open: true, severity: "success", message: t("messages.updateSuccess") });
    } catch (err: any) {
      console.error("Update employee failed", err);
      const resp = err?.response?.data;
      let message = t("messages.updateFailedGeneric");

      if (resp) {
        if (resp.errors && typeof resp.errors === "object") {
          const msgs: string[] = [];
          for (const k of Object.keys(resp.errors)) {
            const v = resp.errors[k];
            if (Array.isArray(v)) msgs.push(`${k}: ${v.join(", ")}`);
            else msgs.push(`${k}: ${String(v)}`);
          }
          message = `${t("messages.updateFailedWithErrors")}: ${msgs.join(" ; ")}`;
        } else if (resp.title || resp.message) {
          message = resp.title ? `${resp.title} ${resp.message ?? ""}` : resp.message;
        } else {
          message = `Server trả: ${JSON.stringify(resp)}`;
        }
      } else if (err?.response) {
        message = `Server lỗi: ${err.response.status} ${err.response.statusText}`;
      } else if (err?.message) {
        message = err.message;
      }

      setSnack({ open: true, severity: "error", message });
    }
  };

  const handleChangePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!passwords.current || !passwords.newPass) {
      setSnack({ open: true, severity: "error", message: t("errors.passwordsRequired") });
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setSnack({ open: true, severity: "error", message: t("errors.passwordsMismatch") });
      return;
    }

    try {
      const body = {
        username: account.username,
        oldPassword: passwords.current,
        newPassword: passwords.newPass,
        isEmployee: true,
      };

      await api.post("/api/Password/change-password", body, {
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
      });

      setSnack({ open: true, severity: "success", message: t("messages.passwordChanged") });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: any) {
      console.error("Change password failed", err);
      const resp = err?.response?.data;
      let message = t("messages.passwordChangeFailed");
      if (resp?.message) message = `${t("messages.passwordChangeFailed")}: ${resp.message}`;
      setSnack({ open: true, severity: "error", message });
    }
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    e?.preventDefault();

    try {
      const langNormalized = (language || i18n.language || "vi").slice(0, 2);
      localStorage.setItem("locale", langNormalized);
      try {
        i18n.changeLanguage(langNormalized);
      } catch {}
      localStorage.setItem("notificationEmail", notificationEmail);
      setSnack({ open: true, severity: "success", message: t("messages.settingsSaved") });
    } catch (err) {
      setSnack({ open: true, severity: "error", message: t("errors.saveSettingsFailed") });
    }
  };

  const initials =
    avatarSrc
      ? undefined
      : `${(account.name?.split(/\s+/)[0]?.[0] ?? "U")}${(account.name?.split(/\s+/).slice(-1)[0]?.[0] ?? "")}`
          .toUpperCase()
          .slice(0, 2);

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h5" fontWeight={700}>
          {t("title")}
        </Typography>

        {/* Account Settings Card */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Box
            component="form"
            onSubmit={handleSaveAccount}
            sx={{
              display: "flex",
              gap: 3,
              flexDirection: { xs: "column", md: "row" },
              alignItems: "flex-start",
            }}
          >
            {/* left: inputs */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={2}>
                <TextField
                  label={t("fields.name")}
                  size="small"
                  value={account.name}
                  onChange={handleAccountChange("name")}
                  fullWidth
                />

                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                  <TextField label={t("fields.username")} size="small" value={account.username} disabled fullWidth />
                  <TextField label={t("fields.phone")} size="small" value={account.phone} onChange={handleAccountChange("phone")} fullWidth />
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                  <TextField label={t("fields.location")} size="small" value={account.location} onChange={handleAccountChange("location")} fullWidth />
                  <TextField label={t("fields.employeeCode")} size="small" value={account.employeeCode} disabled fullWidth />
                </Box>
              </Stack>

              <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: primary,
                    color: "#fff",
                    px: 4,
                    py: 1,
                    borderRadius: 3,
                    textTransform: "none",
                    boxShadow: "0 6px 18px rgba(60,189,150,0.14)",
                    "&:hover": { bgcolor: primary },
                  }}
                >
                  {t("actions.saveChanges")}
                </Button>
              </Box>
            </Box>

            {/* right: avatar */}
            <Box
              sx={{
                width: { xs: "100%", md: 260 },
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                mt: { xs: 2, md: 0 },
              }}
            >
              <Avatar src={avatarSrc ?? undefined} sx={{ width: 120, height: 120, bgcolor: primary, fontSize: 36, fontWeight: 700 }}>
                {initials}
              </Avatar>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: "none" }} />

              <Button
                variant="outlined"
                onClick={triggerFile}
                startIcon={<PhotoCameraIcon />}
                sx={{ borderColor: primary, color: primary, textTransform: "none", px: 2, borderRadius: 3 }}
              >
                {t("actions.chooseImage")}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Change Password */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            {t("sections.changePassword")}
          </Typography>

          <Box component="form" onSubmit={handleChangePassword} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label={t("fields.currentPassword")}
              size="small"
              type={show.current ? "text" : "password"}
              value={passwords.current}
              onChange={handlePasswordChange("current")}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShow((s) => ({ ...s, current: !s.current }))}>
                      {show.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
              <TextField
                label={t("fields.newPassword")}
                size="small"
                type={show.newPass ? "text" : "password"}
                value={passwords.newPass}
                onChange={handlePasswordChange("newPass")}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShow((s) => ({ ...s, newPass: !s.newPass }))}>
                        {show.newPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label={t("fields.confirmPassword")}
                size="small"
                type={show.confirm ? "text" : "password"}
                value={passwords.confirm}
                onChange={handlePasswordChange("confirm")}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}>
                        {show.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: primary,
                  color: "#fff",
                  px: 4,
                  py: 1,
                  borderRadius: 3,
                  textTransform: "none",
                  boxShadow: "0 6px 18px rgba(60,189,150,0.12)",
                  "&:hover": { bgcolor: primary },
                }}
              >
                {t("actions.changePassword")}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* General settings (language, notification) */}
        <Paper sx={{ p: 3, borderRadius: 2, maxWidth: 640, mt: 3 }}>
          <form onSubmit={handleSaveSettings}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {t("sections.general")}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                <TextField
                  select
                  label={t("fields.language")}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {LANG_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
                <TextField
                  label={t("fields.notificationEmail")}
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    bgcolor: primary,
                    color: "#fff",
                    px: 4,
                    py: 1,
                    borderRadius: 3,
                    textTransform: "none",
                    boxShadow: "0 6px 18px rgba(60,189,150,0.14)",
                    "&:hover": { bgcolor: primary },
                  }}
                >
                  {t("actions.save")}
                </Button>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Stack>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={6000} onClose={closeSnack}>
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsPage;
