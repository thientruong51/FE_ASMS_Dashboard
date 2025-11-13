import React from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";

type Props = {
  open: boolean;
  title?: string;
  children?: React.ReactNode;
  onClose: () => void;
};

export default function CustomerDialog({ open, title, children, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
