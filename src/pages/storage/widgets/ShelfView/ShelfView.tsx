import {
  Box,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer, Outline } from "@react-three/postprocessing";

import ShelfModel from "./ShelfModel";
import BoxModel from "./BoxModel";
import { getAllFloorsMock } from "./useBoxLayout";
import type { BoxData } from "./types";
import ShelfFloorDetail from "../ShelfFloorOrders";

export default function ShelfView({ shelfId }: { shelfId: number }) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null);
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [mode, setMode] = useState<"static" | "random">("static"); // 👈 toggle mode
  const orbitRef = useRef<any>(null);

  // ✅ lấy data theo mode hiện tại
  const allFloors = useMemo(() => getAllFloorsMock(mode), [mode]);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 3, mt: 2 }}>
      {/* 🧱 BÊN TRÁI: KỆ 3D */}
      <Box sx={{ textAlign: "center" }}>
        <Typography fontWeight={600} mb={1}>
          Shelf #{shelfId + 1}
        </Typography>

        {/* 🔘 Switch chọn chế độ mock */}
        <FormControlLabel
          control={
            <Switch
              checked={mode === "random"}
              onChange={() => setMode(mode === "static" ? "random" : "static")}
            />
          }
          label={mode === "static" ? "Static Data" : "Random Data"}
          sx={{ mb: 1 }}
        />

        <Box
          sx={{
            width: 420,
            height: 450,
            bgcolor: "#f5f7fa",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Canvas camera={{ fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />
            <Suspense fallback={null}>
              <ShelfModel
                selectedFloor={selectedFloor}
                onSelectFloor={setSelectedFloor}
                setSelectedMesh={setSelectedMesh}
                onModelCenter={setModelCenter}
                orbitRef={orbitRef}
              />

              {/* 📦 Render box theo tầng */}
              {selectedFloor &&
                allFloors[selectedFloor]?.map((b) => (
                  <BoxModel
                    key={b.id}
                    type={b.type}
                    position={b.position}
                    onClick={() => setSelectedBox(b)}
                  />
                ))}
            </Suspense>

            <EffectComposer multisampling={8}>
              <Outline
                selection={selectedMesh ? [selectedMesh] : []}
                edgeStrength={3}
                pulseSpeed={0}
                visibleEdgeColor={0x42a5f5}
                hiddenEdgeColor={0x42a5f5}
              />
            </EffectComposer>

            <OrbitControls
              ref={orbitRef}
              enableZoom
              enableRotate
              enablePan
              makeDefault
              target={
                modelCenter
                  ? [modelCenter.x, modelCenter.y, modelCenter.z]
                  : [0, 3, 0]
              }
            />
          </Canvas>
        </Box>

        <Typography fontSize={13} fontWeight={600} mt={1}>
          {selectedFloor ? `Selected: Floor ${selectedFloor}` : "Select a floor"}
        </Typography>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* 🧾 BÊN PHẢI: PANEL DETAIL */}
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
            Click a floor to view layout & orders
          </Box>
        )}
      </Box>

      {/* 🧩 POPUP: BOX DETAIL */}
      <Dialog
        open={!!selectedBox}
        onClose={() => setSelectedBox(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>📦 Box Details</DialogTitle>
        <DialogContent>
          {selectedBox && (
            <>
              <Typography>ID: {selectedBox.id}</Typography>
              <Typography>Type: {selectedBox.type}</Typography>
              <Typography>Floor: {selectedBox.floor}</Typography>
              <Typography>Product: {selectedBox.productName}</Typography>
              <Typography>Quantity: {selectedBox.quantity}</Typography>
              <Typography>Status: {selectedBox.status}</Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
