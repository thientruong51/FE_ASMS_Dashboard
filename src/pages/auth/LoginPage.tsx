import React, { useState } from "react";
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

// Assets (keep same urls or replace with your own)
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
        maxHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url(${BG_WAVE})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right center",
        backgroundSize: "cover",
        p: { xs: 2, md: 10 },
      }}
    >
      {/* BIGGER CENTER CARD */}
      <Box
        sx={{
          width: { xs: "100%", sm: 880, md: 1580 },
          minWidth: "100vh",
          borderRadius: 4,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: isSm ? "1fr" : "1fr 1fr",
        }}
      >
        {/* LEFT SIDE - illustration + logo */}
        <Box
          sx={{
            p: { xs: 4, md: 8 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box component="img" src={LOGO} alt="Logo" sx={{ width: 200, mb: 2, mr:50 }} />
          <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
            {t("welcome") ?? "Welcome"}
          </Typography>

          <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 300, mb: 3 }}>
            {t("subtitle") ?? "Welcome back!"}
          </Typography>

          <Box
            component="img"
            src={ILLUSTRATION}
            sx={{
              width: { xs: 200, md: 490 },
            }}
          />
        </Box>

        {/* RIGHT SIDE - login form */}
        <Box
          sx={{
            p: { xs: 4, md: 8 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            <Stack spacing={3}>
              <Typography variant="h4" fontWeight={700}>
                {t("login") ?? "Đăng nhập"}
              </Typography>

              <TextField
                size="medium"
                fullWidth
                label={t("username") ?? "Username"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                size="medium"
                fullWidth
                label={t("password") ?? "Password"}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {err && (
                <Typography sx={{ color: "error.main" }} variant="body2">
                  {err}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleLogin}
                disabled={loading}
                sx={{
                  py: 1.4,
                  borderRadius: 3,
                  fontSize: 16,
                  bgcolor: "#3CBD96",
                  ":hover": { bgcolor: "#2E9E7C" },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : (t("loginButton") ?? "Login")}
              </Button>

              <Box display="flex" justifyContent="space-between">
                <Link component="button" variant="body2">
                  {t("forgot") ?? "Forgot?"}
                </Link>
                <Link component="button" variant="body2">
                  {t("register") ?? "Register"}
                </Link>
              </Box>

              <Typography variant="caption" textAlign="center" sx={{ color: "text.secondary" }}>
                © {new Date().getFullYear()} ASMS
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
