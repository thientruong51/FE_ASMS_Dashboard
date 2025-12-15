import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import authApi, { setAuthStorage } from "../../api/auth";

const BG_WAVE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762962577/wave-haikei_skn4to.svg";
const ILLUSTRATION =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762884106/download_btrzmx.png";
const LOGO = "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190185/LOGO-remove_1_o1wgk2.png";

export default function LoginPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = async () => {
    setErr("");
    if (!email || !password) {
      setErr(t("pleaseFill") ?? "Vui lòng nhập email và mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.employeeLogin({ email, password });
      const data = (response && (response.data ?? response)) as any;

      if (data?.success) {
        setAuthStorage(data.accessToken ?? null, data.refreshToken ?? null);
        navigate("/");
      } else {
        setErr(data?.errorMessage ?? (t("loginFailed") ?? "Đăng nhập thất bại"));
      }
    } catch (e: any) {
      setErr(e?.response?.data?.errorMessage ?? e?.message ?? (t("loginError") ?? "Lỗi kết nối"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${BG_WAVE})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: { xs: "center top", sm: "right center" },
        backgroundSize: { xs: "contain", sm: "cover" },
        p: { xs: 2, md: 6 },
        boxSizing: "border-box",
      }}
    >
      {/* CENTER CARD */}
      <Box
        sx={{
          width: { xs: "100%", sm: 880, md: 1100 },
          maxWidth: "100%",
          borderRadius: 3,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          boxShadow: 3,
        }}
      >
        {/* LEFT SIDE - illustration + logo (ẩn trên mobile nhỏ) */}
        <Box
          sx={{
            p: { xs: 3, md: 6 },
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            minHeight: { sm: 360, md: 440 },
            bgcolor: { sm: "transparent" },
          }}
        >
          <Box
            component="img"
            src={LOGO}
            alt="Logo"
            sx={{
              width: { sm: 160, md: 220 },
              mb: { sm: 2, md: 3 },
              mr: { md: 30 },
              alignSelf: "center",
            }}
          />

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {t("welcome") ?? "Welcome"}
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 360, mb: 3 }}>
            {t("subtitle") ?? "Welcome back!"}
          </Typography>

          <Box
            component="img"
            src={ILLUSTRATION}
            sx={{
              width: { sm: 280, md: 500 },
              mt: 2,
              userSelect: "none",
            }}
          />
        </Box>

        {/* RIGHT SIDE - login form */}
        <Box
          sx={{
            p: { xs: 4, sm: 6 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: "auto", sm: 360 },
            ml: { md: 7 },
            bgcolor: "background.paper",
          }}
        >
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            sx={{ width: "100%", maxWidth: 420 }}
          >
            <Stack spacing={2.5}>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {/* On mobile show small logo above form */}
                {isSm && (
                  <Box display="flex" justifyContent="center" mb={1}>
                    <Box
                      component="img"
                      src={LOGO}
                      alt="Logo"
                      sx={{ width: 120, height: "auto" }}
                    />
                  </Box>
                )}

                <Typography variant={isSm ? "h5" : "h4"} fontWeight={700} textAlign={isSm ? "center" : "left"}>
                  {t("login") ?? "Đăng nhập"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }} textAlign={isSm ? "center" : "left"}>
                  {t("subtitle") ?? "Welcome back!"}
                </Typography>
              </Box>

              <TextField
                size={isSm ? "small" : "medium"}
                fullWidth
                label={t("username") ?? "Username"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />

              <TextField
                size={isSm ? "small" : "medium"}
                fullWidth
                label={t("password") ?? "Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />

              {err && (
                <Typography sx={{ color: "error.main" }} variant="body2">
                  {err}
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.25,
                  borderRadius: 2,
                  fontSize: 15,
                  bgcolor: "#3CBD96",
                  ":hover": { bgcolor: "#2E9E7C" },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  t("loginButton") ?? "Login"
                )}
              </Button>

              <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Link component="button" variant="body2" onClick={() => navigate("/forgot")}>
                  {t("forgot") ?? "Forgot?"}
                </Link>

              </Box>

              <Typography variant="caption" textAlign="center" sx={{ color: "text.secondary", mt: 1 }}>
                © {new Date().getFullYear()} ASMS
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
