import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="60vh">
      <Typography variant="h4" gutterBottom>403 — Không có quyền</Typography>
      <Typography variant="body1" gutterBottom>Bạn không có quyền truy cập trang này.</Typography>
      <Button variant="contained" onClick={() => navigate("/")}>Về trang chính</Button>
    </Box>
  );
};

export default UnauthorizedPage;
