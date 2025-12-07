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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi"; 
import ContactDetailDrawer from "./components/ContactDetailDrawer";

function a11yProps(index: number) {
  return {
    id: `contact-tab-${index}`,
    "aria-controls": `contact-tabpanel-${index}`,
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

export default function ContactPage() {
  const { t } = useTranslation("contact");
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // tab: 0 = Liên hệ (no order), 1 = Cần xử lí (has order)
  const [tabIndex, setTabIndex] = useState<number>(0);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const resp = await contactApi.getContacts({ page: 1, pageSize: 1000, q: search });

      let items: any[] = [];
      if (Array.isArray(resp)) {
        items = resp;
      } else if (Array.isArray((resp as any).data)) {
        items = (resp as any).data;
      } else if (Array.isArray((resp as any).data?.data)) {
        items = (resp as any).data.data;
      } else {
        const possible = (resp as any).data ?? resp;
        if (Array.isArray(possible)) items = possible;
      }

      setContacts(items ?? []);
    } catch (err) {
      console.error("getContacts failed", err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contactsWithOrder = useMemo(() => contacts.filter((c) => c && c.orderCode), [contacts]);
  const contactsWithoutOrder = useMemo(() => contacts.filter((c) => !(c && c.orderCode)), [contacts]);

  const currentList = tabIndex === 0 ? contactsWithoutOrder : contactsWithOrder;

  const filteredWithMemo = (all: any[], q: string) => {
    const qq = (q ?? "").trim().toLowerCase();
    return all
      .filter((c) => {
        if (!qq) return true;
        return (
          String(c.customerCode ?? "").toLowerCase().includes(qq) ||
          String(c.customerName ?? "").toLowerCase().includes(qq) ||
          String(c.orderCode ?? "").toLowerCase().includes(qq) ||
          String(c.phoneContact ?? "").toLowerCase().includes(qq) ||
          String(c.name ?? "").toLowerCase().includes(qq)
        );
      })
      .map((r) => ({ id: r.contactId ?? r.contactId, __contactFull: r, ...r }));
  };

  const rows = useMemo(() => filteredWithMemo(currentList, search), [currentList, search]);

  const handleExportCsv = () => {
    if (!currentList || currentList.length === 0) return;
    const keys = ["contactId", "customerCode", "customerName", "orderCode", "name", "phoneContact", "email", "message"];
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
    const tabSuffix = tabIndex === 0 ? "no_order" : "with_order";
    a.href = url;
    a.download = `${t("export.filenamePrefix") ?? "contacts"}_${tabSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDrawerFor = (row: any) => {
    if (!row) return;
    const c = row.__contactFull ?? row;
    setSelectedContact(c);
    setDrawerOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "contactId", headerName: t("table.id") ?? "ID", minWidth: 90, flex: 0.5 },
    { field: "customerCode", headerName: t("table.customerCode") ?? "Customer", minWidth: 140, flex: 1 },
    { field: "customerName", headerName: t("table.customerName") ?? "Name", minWidth: 160, flex: 1.2 },
    { field: "orderCode", headerName: t("table.orderCode") ?? "Order", minWidth: 150, flex: 1 },
    { field: "phoneContact", headerName: t("table.phone") ?? "Phone", minWidth: 140, flex: 1 },
    {
      field: "actions",
      headerName: t("table.actions") ?? "Actions",
      width: 120,
      sortable: false,
      renderCell: (params: any) => {
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
          {t("page.title") ?? "Contacts"}
        </Typography>
        <Typography color="text.secondary">{t("page.subtitle") ?? "Manage incoming contacts / support requests"}</Typography>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          {/* Tabs */}
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: "center" }}>
            <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="contact type tabs" sx={{ flex: 1 }}>
              <Tab
                label={`${t("tabs.contact") ?? "Liên hệ"} (${contactsWithoutOrder.length})`}
                {...a11yProps(0)}
              />
              <Tab
                label={`${t("tabs.support") ?? "Cần xử lí"} (${contactsWithOrder.length})`}
                {...a11yProps(1)}
              />
            </Tabs>

            {/* Search & actions */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
              <TextField
                size="small"
                placeholder={t("page.searchPlaceholder") ?? "Search contacts"}
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
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToolbarExtras
            onExport={handleExportCsv}
            onRefresh={fetchContacts}
            exportLabel={t("actions.exportCsv") ?? "Export CSV"}
            refreshLabel={t("actions.refresh") ?? "Refresh"}
          />

          <Box sx={{ width: "100%", overflowX: "auto" }}>
            <div style={{ width: "100%" }}>
              <DataGrid
                rows={rows as any[]}
                columns={columns}
                autoHeight
                pageSizeOptions={[10, 25, 50]}
                loading={loading}
                getRowId={(r: any) => r.contactId ?? r.id}
                density="standard"
                disableRowSelectionOnClick
                onRowDoubleClick={(params) => openDrawerFor(params.row)}
                sx={{ border: "none", minWidth: 700 }}
              />
            </div>
          </Box>
        </CardContent>
      </Card>

      <ContactDetailDrawer
        contact={selectedContact}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedContact(null);
        }}
      />
    </Box>
  );
}
