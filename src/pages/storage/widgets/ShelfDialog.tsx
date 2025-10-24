import {
  Box,
  Typography,
  IconButton,
  Divider,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ShelfView from "./ShelfView/ShelfView";

type Props = {
  shelfId: number;
  onClose: () => void;
};

export default function ShelfDialog({ shelfId, onClose }: Props) {
  return (
    <Box>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography fontWeight={700} fontSize={16}>
          Shelf #{shelfId + 1}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        <ShelfView shelfId={shelfId} />
      </DialogContent>
    </Box>
  );
}
