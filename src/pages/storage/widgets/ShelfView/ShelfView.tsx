import { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { EffectComposer, Outline } from "@react-three/postprocessing";

import ShelfModel from "./ShelfModel";
import ShelfFloorOrders from "../ShelfFloorOrders";
import DebugAndAssigned from "../DebugAndAssigned";
import ContainerDetailDialog from "../ContainerDetailDialog";

import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("storagePage");
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); // >=600
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >=900

  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const [modelCenter] = useState<THREE.Vector3 | null>(null);
  const [floorInfo, setFloorInfo] = useState<any | null>(null);

  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
  const [containerOpenKey, setContainerOpenKey] = useState(0);

  const orbitRef = useRef<any>(null);

  const [localContainersByFloor, setLocalContainersByFloor] = useState<Record<string, ContainerItem[]>>(
    () => ({ ...(containersByFloor ?? {}) })
  );

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

  const resolveFloorKeyForWrite = (floorNum: number) => {
    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(floorNum));
    if (floorObj && (floorObj as any).floorCode) {
      return (floorObj as any).floorCode as string;
    }
    return `F${floorNum}`;
  };

  const handleContainersUpdated = (updatedList: ContainerItem[]) => {
    if (!selectedFloor) return;
    const key = resolveFloorKeyForWrite(selectedFloor);
    setLocalContainersByFloor((prev) => ({ ...prev, [key]: updatedList }));
  };

  // NEW: handle container removed from ContainerDetailDialog
  const handleContainerRemoved = (containerCode: string) => {
    if (!selectedFloor) return;
    const key = resolveFloorKeyForWrite(selectedFloor);

    setLocalContainersByFloor((prev) => {
      const prevList = prev[key] ?? [];
      const nextList = prevList.filter((c) => c.containerCode !== containerCode);
      const copy = { ...prev, [key]: nextList };
      return copy;
    });

    // if the dialog is open for the same container, close it
    setSelectedContainer((prev) => (prev?.containerCode === containerCode ? null : prev));
  };

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

  const canvasWidth = isMdUp ? 520 : isSmUp ? 540 : "100%";
  const canvasHeight = isMdUp ? 500 : isSmUp ? 420 : 320;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMdUp ? "row" : "column",
        gap: 3,
        mt: 2,
        alignItems: "flex-start",
        width: "100%",
      }}
    >
      {/* Left / Top block: title + 3D viewer + floor selector */}
      <Box
        sx={{
          width: isMdUp ? canvasWidth : "100%",
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography fontWeight={600} mb={1}>
          {t("shelfTitle", { code: shelfCode })}
        </Typography>

        <Box
          sx={{
            width: isMdUp ? canvasWidth : "100%",
            height: canvasHeight,
            bgcolor: "#d8e2f0c0",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
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
            {selectedFloor ? t("selectedFloor", { floor: selectedFloor }) : t("clickFloorOnModel")}
          </Typography>
        </Box>

        {/* Floor buttons: scrollable on small screens */}
        <Box
          mt={1}
          sx={{
            width: "100%",
            overflowX: { xs: "auto", md: "visible" },
            px: { xs: 1, md: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              flexWrap: { xs: "nowrap", md: "wrap" },
              alignItems: "center",
              pb: { xs: 1, md: 0 },
            }}
          >
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
                  flex: { xs: "0 0 auto", md: "initial" },
                  whiteSpace: "nowrap",
                }}
              >
                {t("floorButton", { floor: fn })}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Divider: vertical on md+; horizontal separator is implied by column layout on small screens */}
      {isMdUp ? (
        <Divider orientation="vertical" flexItem />
      ) : (
        <Divider sx={{ width: "100%", my: 1 }} />
      )}

      {/* Right / Bottom: Orders & containers panel */}
      <Box
        flex={1}
        minWidth={{ md: 380 }}
        sx={{
          width: isMdUp ? "auto" : "100%",
        }}
      >
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
              height: isMdUp ? "100%" : 180,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 14,
              borderRadius: 1,
              bgcolor: "background.paper",
              p: 2,
            }}
          >
            {t("clickFloorToView")}
          </Box>
        )}
      </Box>

      <ContainerDetailDialog
        key={containerOpenKey}
        open={!!selectedContainer}
        container={selectedContainer}
        onClose={() => setSelectedContainer(null)}
        onRemoved={handleContainerRemoved} // <-- NEW: top-level dialog removal handler
      />
    </Box>
  );
}
