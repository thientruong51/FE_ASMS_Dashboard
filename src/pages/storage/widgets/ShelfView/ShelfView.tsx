import { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { EffectComposer, Outline } from "@react-three/postprocessing";

import ShelfModel from "./ShelfModel";
import ShelfFloorOrders from "../ShelfFloorOrders";
import DebugAndAssigned from "../DebugAndAssigned";
import ContainerDetailDialog from "../ContainerDetailDialog";

import type { ShelfItem } from "@/api/shelfApi";
import type { FloorItem } from "@/api/floorApi";
import type { ContainerItem } from "@/api/containerApi";
import type * as THREE from "three";

export type ShelfViewProps = {
  shelfCode: string;
  shelf?: ShelfItem | null;
  floors?: FloorItem[];
  containersByFloor?: Record<string, ContainerItem[]>;
  onClose?: () => void;
};

export default function ShelfView({
  shelfCode,
  floors = [],
  containersByFloor = {},
}: ShelfViewProps) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const [modelCenter] = useState<THREE.Vector3 | null>(null);
  const [floorInfo, setFloorInfo] = useState<any | null>(null);

  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);

  const [containerOpenKey, setContainerOpenKey] = useState(0);

  const orbitRef = useRef<any>(null);

  // Local copy so we can update UI when child reloads data
  const [localContainersByFloor, setLocalContainersByFloor] = useState<Record<string, ContainerItem[]>>(
    () => ({ ...(containersByFloor ?? {}) })
  );

  // keep local copy in sync when parent prop changes
  useEffect(() => {
    setLocalContainersByFloor({ ...(containersByFloor ?? {}) });
  }, [containersByFloor]);

  const floorNumbers = Array.from(
    new Set(floors.map((f) => Number(f.floorNumber)).filter((n) => !Number.isNaN(n) && n !== 0))
  ).sort((a, b) => a - b);

  const onSelectFloor = (floorNum: number) => {
    setSelectedFloor(floorNum);
  };

  const openContainer = (c: ContainerItem | null) => {
    if (!c) {
      setSelectedContainer(null);
      return;
    }

    setSelectedContainer({ ...(c as ContainerItem) });

    setContainerOpenKey((prev) => prev + 1);
  };

  // helper to resolve a floor key used in containers map
  const resolveFloorKeyForWrite = (floorNum: number) => {
    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(floorNum));
    if (floorObj && (floorObj as any).floorCode) {
      return (floorObj as any).floorCode as string;
    }
    // default fallback key
    return `F${floorNum}`;
  };

  // callback to be passed to ShelfFloorOrders — child calls this with updated array for that floor
  const handleContainersUpdated = (updatedList: ContainerItem[]) => {
    if (!selectedFloor) return;
    const key = resolveFloorKeyForWrite(selectedFloor);
    setLocalContainersByFloor((prev) => ({ ...prev, [key]: updatedList }));
  };

  // --- Use serialNumber (number) for sorting (ascending) ---
  const activeContainers: ContainerItem[] = (() => {
    if (!selectedFloor) return [];

    const sortBySerial = (arr: ContainerItem[]) => {
      return [...arr].sort((a, b) => {
        const sa = typeof a.serialNumber === "number" ? a.serialNumber : Number(a.serialNumber ?? 0);
        const sb = typeof b.serialNumber === "number" ? b.serialNumber : Number(b.serialNumber ?? 0);
        return (sa ?? 0) - (sb ?? 0);
      });
    };

    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));

    if (floorObj && (floorObj as any).floorCode) {
      const code = (floorObj as any).floorCode as string;
      if (localContainersByFloor[code]?.length) {
        return sortBySerial(localContainersByFloor[code]);
      }
    }

    const tryKeys = [`F${selectedFloor}`, String(selectedFloor), "unknown"];
    for (const k of tryKeys) {
      if (localContainersByFloor[k]?.length) {
        return sortBySerial(localContainersByFloor[k]);
      }
    }

    return [];
  })();

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 3, mt: 2 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography fontWeight={600} mb={1}>
          Shelf: {shelfCode}
        </Typography>

        <Box sx={{ width: 520, height: 500, bgcolor: "#d8e2f0c0", borderRadius: 2, overflow: "hidden" }}>
          <Canvas camera={{ fov: 45 }}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[5, 12, 5]} intensity={1.9} />

            <Suspense fallback={<group />}>
              <group>
                <ShelfModel
                  selectedFloor={selectedFloor}
                  onSelectFloor={onSelectFloor}
                  setSelectedMesh={setSelectedMesh}
                  onModelCenter={setFloorInfo}
                  orbitRef={orbitRef}
                />

                {selectedFloor && (
                  <DebugAndAssigned
                    floors={floors}
                    floorInfo={floorInfo}
                    modelCenter={modelCenter}
                    selectedFloor={selectedFloor}
                    activeContainers={activeContainers}
                    setSelectedContainer={openContainer}
                  />
                )}
              </group>
            </Suspense>

            <EffectComposer multisampling={8}>
              <Outline
                selection={selectedMesh ? [selectedMesh] : []}
                edgeStrength={5}
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
                floorInfo?.center
                  ? [floorInfo.center.x, floorInfo.center.y, floorInfo.center.z]
                  : modelCenter
                  ? [modelCenter.x, modelCenter.y, modelCenter.z]
                  : [0, 3, 0]
              }
            />
          </Canvas>
        </Box>

        <Box mt={1} display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Typography fontSize={13} fontWeight={600}>
            {selectedFloor ? `Selected: Floor ${selectedFloor}` : "Click a floor on the model"}
          </Typography>
        </Box>

        <Box mt={1} display="flex" gap={1} justifyContent="center" flexWrap="wrap">
          {floorNumbers.map((fn) => (
            <Box
              key={fn}
              onClick={() => onSelectFloor(fn)}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: selectedFloor === fn ? "primary.main" : "background.paper",
                color: selectedFloor === fn ? "white" : "text.primary",
                cursor: "pointer",
                fontSize: 13,
                boxShadow: selectedFloor === fn ? 2 : "none",
              }}
            >
              Floor {fn}
            </Box>
          ))}
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem />

      <Box flex={1} minWidth={380}>
        {selectedFloor ? (
          <ShelfFloorOrders
            shelfCode={shelfCode}
            floor={selectedFloor}
            containers={activeContainers}
            onContainersUpdated={handleContainersUpdated}
          />
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
            Click a floor to view containers & orders
          </Box>
        )}
      </Box>

      <ContainerDetailDialog
        key={containerOpenKey}
        open={!!selectedContainer}
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
      />
    </Box>
  );
}
