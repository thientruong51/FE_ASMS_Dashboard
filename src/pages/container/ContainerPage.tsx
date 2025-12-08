import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    Tooltip,
    Tabs,
    Tab,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import {
    DataGrid,
    type GridColDef,
    type GridRenderCellParams,
    type GridRowParams,
} from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import type { ContainerItem } from "@/api/containerApi";
import {
    getContainers,
} from "@/api/containerApi";
import ContainerDetailDrawer from "./components/ContainerDetailDrawer";
import ContainerFormDialog from "./components/ContainerFormDialog";

function a11yProps(index: number) {
    return {
        id: `container-tab-${index}`,
        "aria-controls": `container-tabpanel-${index}`,
    };
}

function ToolbarExtras({
    onExport,
    onRefresh,
    exportLabel,
    refreshLabel,
}: {
    onExport: () => void;
    onRefresh: () => void;
    exportLabel: string;
    refreshLabel: string;
}) {
    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1, flexWrap: "wrap" }}>
            <Button startIcon={<DownloadIcon />} size="small" onClick={onExport}>
                {exportLabel}
            </Button>
            <Button startIcon={<RefreshIcon />} size="small" onClick={onRefresh}>
                {refreshLabel}
            </Button>
        </Box>
    );
}

export default function ContainerPage() {
    const { t } = useTranslation("container");
    const [containers, setContainers] = useState<ContainerItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [tabIndex, setTabIndex] = useState<number>(0);

    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formInitial, setFormInitial] = useState<Partial<ContainerItem> | null>(null);

    const fetchContainers = async () => {
        setLoading(true);
        try {
            const resp = await getContainers({ page: 1, pageSize: 1000, q: search });
            const items = resp?.data ?? [];
            setContainers(items ?? []);
        } catch (err) {
            console.error("getContainers failed", err);
            setContainers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContainers();
    }, []);

    const containersInactive = useMemo(() => containers.filter((c) => c && c.isActive === false), [containers]);
    const containersOccupied = useMemo(() => containers.filter((c) => c && String(c.status).toLowerCase().includes("occup")), [containers]);
    const containersEmpty = useMemo(() => containers.filter((c) => c && (!c.status || String(c.status).toLowerCase().includes("empty")) && c.isActive !== false), [containers]);

    const currentList = tabIndex === 0 ? containers : tabIndex === 1 ? containersOccupied : tabIndex === 2 ? containersEmpty : containersInactive;

    const filteredWithMemo = (all: ContainerItem[], q: string) => {
        const qq = (q ?? "").trim().toLowerCase();
        return all
            .filter((c) => {
                if (!qq) return true;
                return (
                    String(c.containerCode ?? "").toLowerCase().includes(qq) ||
                    String(c.floorCode ?? "").toLowerCase().includes(qq) ||
                    String(c.status ?? "").toLowerCase().includes(qq) ||
                    String(c.type ?? "").toLowerCase().includes(qq)
                );
            })
            .map((r) => ({ id: r.containerCode ?? `${r.type}-${r.serialNumber}`, __containerFull: r, ...r }));
    };

    const rows = useMemo(() => filteredWithMemo(currentList, search), [currentList, search]);

    const handleExportCsv = () => {
        if (!currentList || currentList.length === 0) return;
        const keys = ["containerCode", "floorCode", "status", "type", "serialNumber", "layer", "maxWeight", "currentWeight", "isActive", "notes"];
        const header = keys.join(",");
        const csv = [header]
            .concat(
                rows.map((r: any) =>
                    keys
                        .map((k) => {
                            const v = r[k];
                            if (v == null) return "";
                            return `"${String(v).replace(/"/g, '""')}"`;
                        })
                        .join(",")
                )
            )
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const tabSuffix = tabIndex === 0 ? "all" : tabIndex === 1 ? "occupied" : tabIndex === 2 ? "empty" : "inactive";
        a.href = url;
        a.download = `${t("export.filenamePrefix") ?? "containers"}_${tabSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const openDrawerFor = (row: any) => {
        if (!row) return;
        const c = row.__containerFull ?? row;
        setSelectedContainer(c);
        setDrawerOpen(true);
    };

    const handleNew = () => {
        setFormMode("create");
        setFormInitial(null);
        setFormOpen(true);
    };

    const columns: GridColDef<any, any, any>[] = [
        { field: "containerCode", headerName: t("table.code") ?? "Code", minWidth: 120, flex: 1 },
        { field: "floorCode", headerName: t("table.floor") ?? "Floor", minWidth: 200, flex: 1.5 },
        { field: "type", headerName: t("table.type") ?? "Type", minWidth: 90, flex: 0.6 },
        { field: "serialNumber", headerName: t("table.serial") ?? "Serial", minWidth: 90, flex: 0.6 },
        { field: "maxWeight", headerName: t("table.maxWeight") ?? "Max weight", minWidth: 110, flex: 0.8 },
        { field: "currentWeight", headerName: t("table.currentWeight") ?? "Current", minWidth: 110, flex: 0.8 },
        {
            field: "status",
            headerName: t("table.status") ?? "Status",
            minWidth: 140,
            flex: 1,
            renderCell: (params: GridRenderCellParams<any>) => {
                const raw = String(params.row?.status ?? "").toLowerCase();

                const translated = t(`statusMap.${raw}`, {
                    defaultValue: params.row?.status ?? "-"
                });

                return translated;
            },
        },
        {
            field: "isActive",
            headerName: t("table.isActive") ?? "Active",
            minWidth: 110,
            flex: 0.6,
            sortable: true,
            renderCell: (params: GridRenderCellParams<any>) => {
                const active = params.row?.isActive;
                const activeLabel = active === false ? (t("table.inactive") ?? "No") : (t("table.active") ?? "Yes");
                return active === false ? <Chip label={activeLabel} size="small" /> : <Chip label={activeLabel} size="small" color="success" />;
            },
        },
        {
            field: "actions",
            headerName: t("table.actions") ?? "Actions",
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<any>) => {
                return (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <Tooltip title={t("actions.view") ?? "View"}>
                            <span>
                                <IconButton size="small" onClick={() => openDrawerFor(params.row)}>
                                    <VisibilityIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box mb={2}>
                <Typography variant="h4" fontWeight={700}>
                    {t("page.title") ?? "Containers"}
                </Typography>
                <Typography color="text.secondary">{t("page.subtitle") ?? "Manage storage containers"}</Typography>
            </Box>

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
                        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="container tabs" sx={{ flex: 1 }}>
                            <Tab label={`${t("tabs.all") ?? "All"} (${containers.length})`} {...a11yProps(0)} />
                            <Tab label={`${t("tabs.occupied") ?? "Occupied"} (${containersOccupied.length})`} {...a11yProps(1)} />
                            <Tab label={`${t("tabs.empty") ?? "Empty"} (${containersEmpty.length})`} {...a11yProps(2)} />
                            <Tab label={`${t("tabs.inactive") ?? "Inactive"} (${containersInactive.length})`} {...a11yProps(3)} />
                        </Tabs>

                        <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
                            <TextField
                                size="small"
                                placeholder={t("page.searchPlaceholder") ?? "Search containers"}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button startIcon={<DownloadIcon />} onClick={handleExportCsv}>
                                {t("actions.export") ?? "Export"}
                            </Button>

                            <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
                                {t("actions.new") ?? "New Container"}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <ToolbarExtras onExport={handleExportCsv} onRefresh={fetchContainers} exportLabel={t("actions.exportCsv") ?? "Export CSV"} refreshLabel={t("actions.refresh") ?? "Refresh"} />

                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                        <div style={{ width: "100%" }}>
                            <DataGrid
                                rows={rows as any[]}
                                columns={columns}
                                autoHeight
                                pageSizeOptions={[10, 25, 50]}
                                loading={loading}
                                getRowId={(r: any) => r.containerCode ?? `${r.type}-${r.serialNumber}`}
                                density="standard"
                                disableRowSelectionOnClick
                                onRowDoubleClick={(params: GridRowParams<any>) => openDrawerFor(params.row)}
                                sx={{ border: "none", minWidth: 800 }}
                            />
                        </div>
                    </Box>
                </CardContent>
            </Card>

            <ContainerDetailDrawer
                container={selectedContainer}
                open={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedContainer(null);
                }}
                onUpdated={() => {
                    fetchContainers();
                    setDrawerOpen(false);
                    setSelectedContainer(null);
                }}
            />

            <ContainerFormDialog
                open={formOpen}
                mode={formMode}
                initial={formInitial ?? undefined}
                onClose={() => setFormOpen(false)}
                onSaved={() => {
                    fetchContainers();
                    setFormOpen(false);
                }}
            />
        </Box>
    );
}
