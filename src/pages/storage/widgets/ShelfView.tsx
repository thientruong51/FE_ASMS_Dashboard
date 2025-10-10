import { Box, Typography, Divider } from "@mui/material";
import { useState } from "react";
import ShelfFloorDetail from "./ShelfFloorOrders"; 

type Props = {
  shelfId: number;
};

export default function ShelfView({ shelfId }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const floors = [1,2,3,4,5]; 

  const floorHeight = 50;
  const shelfWidth = 160;
  const shelfHeight = floors.length * floorHeight + 20;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 3,
        mt: 2,
      }}
    >
      {/* CỘT TRÁI: Hình kệ SVG */}
      <Box sx={{ textAlign: "center" }}>
        <Typography fontWeight={600} mb={1}>
          Shelf #{shelfId + 1}
        </Typography>

        <svg
          width={shelfWidth + 60}
          height={shelfHeight + 40}
          style={{ background: "#fafafa", borderRadius: 4 }}
        >
          <g transform="translate(30,10)">
            {/* Cột dọc trái + phải */}
            <line x1={0} y1={0} x2={0} y2={shelfHeight} stroke="#444" strokeWidth={2} />
            <line
              x1={shelfWidth}
              y1={0}
              x2={shelfWidth}
              y2={shelfHeight}
              stroke="#444"
              strokeWidth={2}
            />

            {/* Các tầng */}
            {floors.map((f, i) => {
              const y = shelfHeight - i * floorHeight;
              const active = selectedFloor === f;
              return (
                <g
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Thanh ngang tầng */}
                  <line
                    x1={0}
                    y1={y - floorHeight}
                    x2={shelfWidth}
                    y2={y - floorHeight}
                    stroke="#444"
                    strokeWidth={1.5}
                  />

                  {/* Nền tầng */}
                  <rect
                    x={0}
                    y={y - floorHeight}
                    width={shelfWidth}
                    height={floorHeight}
                    fill={active ? "#90caf9" : "#e0e0e0"}
                    opacity={0.6}
                  />

                  {/* Hai ô hàng */}
                  <rect
                    x={10}
                    y={y - floorHeight + 8}
                    width={60}
                    height={floorHeight - 16}
                    fill={active ? "#42a5f5" : "#b0bec5"}
                    stroke="#444"
                    strokeWidth={0.8}
                  />
                  <rect
                    x={90}
                    y={y - floorHeight + 8}
                    width={60}
                    height={floorHeight - 16}
                    fill={active ? "#42a5f5" : "#b0bec5"}
                    stroke="#444"
                    strokeWidth={0.8}
                  />

                  {/* Thanh chéo */}
                  <line
                    x1={10}
                    y1={y - floorHeight + 5}
                    x2={70}
                    y2={y - 8}
                    stroke="#757575"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                  <line
                    x1={90}
                    y1={y - floorHeight + 5}
                    x2={150}
                    y2={y - 8}
                    stroke="#757575"
                    strokeWidth={1}
                    opacity={0.7}
                  />

                  {/* Label tầng */}
                  <text
                    x={shelfWidth + 10}
                    y={y - floorHeight / 2 + 4}
                    fontSize="11"
                    fontWeight="600"
                    fill={active ? "#1976d2" : "#555"}
                  >
                    Floor {f}
                  </text>
                </g>
              );
            })}

            {/* Chân đế */}
            <rect
              x={-10}
              y={shelfHeight}
              width={shelfWidth + 20}
              height={8}
              fill="#555"
            />
          </g>

          {/* === Người thao tác === */}
          <g transform={`translate(${shelfWidth + 25}, ${shelfHeight - 70})`}>
            <rect x={0} y={30} width={18} height={30} rx={4} fill="#888" />
            <circle cx={9} cy={20} r={9} fill="#888" />
            <rect x={-6} y={55} width={30} height={8} fill="#999" rx={2} />
          </g>
        </svg>

        {/* Label dưới SVG */}
        <Typography fontSize={13} fontWeight={600} mt={1}>
          {selectedFloor ? `Selected: Floor ${selectedFloor}` : "Select a floor"}
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* CỘT PHẢI: Chi tiết tầng */}
      <Box flex={1} minWidth={350}>
        {selectedFloor ? (
          <ShelfFloorDetail shelfId={shelfId} floor={selectedFloor} />
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            Click a floor to view 2D layout & orders
          </Box>
        )}
      </Box>
    </Box>
  );
}
