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

const BG_WAVE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762962577/wave-haikei_skn4to.svg";
const ILLUSTRATION =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762884106/download_btrzmx.png";
const LOGO =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190185/LOGO-remove_1_o1wgk2.png";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setErr("");
    if (!email) {
      setErr(t("pleaseFill") ?? "Vui lòng nhập email");
      return;
    }

    try {
      setLoading(true);

 
      await new Promise((r) => setTimeout(r, 800));
      setSuccess(true);
    } catch (e: any) {
      setErr(
        e?.response?.data?.errorMessage ??
          e?.message ??
          (t("requestFailed") ?? "Gửi yêu cầu thất bại")
      );
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
      }}
    >
      {/* CENTER CARD */}
      <Box
        sx={{
          width: { xs: "100%", sm: 880, md: 1100 },
          borderRadius: 3,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          boxShadow: 3,
        }}
      >
        {/* LEFT SIDE */}
        <Box
          sx={{
            p: { xs: 3, md: 6 },
            display: { xs: "none", sm: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Box
            component="img"
            src={LOGO}
            alt="Logo"
            sx={{ width: { sm: 160, md: 220 }, mb: 3 }}
          />

          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            {t("forgotTitle") ?? "Forgot password?"}
          </Typography>

          <Typography
            variant="body1"
            sx={{ color: "text.secondary", maxWidth: 360, mb: 3 }}
          >
            {t("forgotSubtitle") ??
              "Enter your email and we will send you a reset link"}
          </Typography>

          <Box
            component="img"
            src={ILLUSTRATION}
            sx={{ width: { sm: 280, md: 500 }, userSelect: "none" }}
          />
        </Box>

        {/* RIGHT SIDE */}
        <Box
          sx={{
            p: { xs: 4, sm: 6 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 420 }}>
            <Stack spacing={2.5}>
              {isSm && (
                <Box display="flex" justifyContent="center">
                  <Box component="img" src={LOGO} sx={{ width: 120 }} />
                </Box>
              )}

              <Typography
                variant={isSm ? "h5" : "h4"}
                fontWeight={700}
                textAlign={isSm ? "center" : "left"}
              >
                {t("forgotTitle") ?? "Forgot password"}
              </Typography>

              <Typography
                variant="body2"
                sx={{ color: "text.secondary" }}
                textAlign={isSm ? "center" : "left"}
              >
                {t("forgotSubtitle") ??
                  "We will send a reset link to your email"}
              </Typography>

              {!success ? (
                <>
                  <TextField
                    size={isSm ? "small" : "medium"}
                    fullWidth
                    label={t("email") ?? "Email"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />

                  {err && (
                    <Typography color="error.main" variant="body2">
                      {err}
                    </Typography>
                  )}

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
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
                      t("sendReset") ?? "Send reset link"
                    )}
                  </Button>
                </>
              ) : (
                <Typography color="success.main" textAlign="center">
                  {t("resetSent") ??
                    "Reset password link has been sent to your email"}
                </Typography>
              )}

              <Box display="flex" justifyContent="center">
                <Link component="button" onClick={() => navigate("/login")}>
                  {t("backToLogin") ?? "Back to login"}
                </Link>
              </Box>

              <Typography
                variant="caption"
                textAlign="center"
                sx={{ color: "text.secondary", mt: 1 }}
              >
                © {new Date().getFullYear()} ASMS
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
