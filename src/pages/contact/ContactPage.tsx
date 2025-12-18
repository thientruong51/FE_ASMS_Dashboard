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
  Tabs,
  Tab,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import contactApi from "@/api/contactApi";
import ContactDetailDrawer from "./components/ContactDetailDrawer";
import { useDispatch } from "react-redux";
import { setContactCounters } from "@/features/contact/contactSlice";

/* ======================
   A11y
====================== */
function a11yProps(index: number) {
  return {
    id: `contact-tab-${index}`,
    "aria-controls": `contact-tabpanel-${index}`,
  };
}

/* ======================
   Toolbar
====================== */
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
  const dispatch = useDispatch();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tabIndex, setTabIndex] = useState(0);

  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ======================
     Fetch
  ====================== */
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const resp = await contactApi.getContacts({
        page: 1,
        pageSize: 1000,
        q: search,
      });

      let items: any[] = [];
      if (Array.isArray(resp)) items = resp;
      else if (Array.isArray((resp as any).data)) items = (resp as any).data;
      else if (Array.isArray((resp as any).data?.data)) items = (resp as any).data.data;

      setContacts(items);

      dispatch(
        setContactCounters({
          contact: items.filter((c) => c?.isActive === true && !c.orderCode).length,
          support: items.filter((c) => c?.isActive === true && !!c.orderCode).length,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  /* ======================
     Lists
  ====================== */
  const contactsProcessed = useMemo(
    () => contacts.filter((c) => c?.isActive === false),
    [contacts]
  );
  const contactsWithOrder = useMemo(
    () => contacts.filter((c) => c?.orderCode && c?.isActive !== false),
    [contacts]
  );
  const contactsWithoutOrder = useMemo(
    () => contacts.filter((c) => !c?.orderCode && c?.isActive !== false),
    [contacts]
  );

  const currentList =
    tabIndex === 0
      ? contactsWithoutOrder
      : tabIndex === 1
        ? contactsWithOrder
        : contactsProcessed;

  /* ======================
     Rows
  ====================== */
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return currentList
      .filter((c) => {
        if (!q) return true;
        return (
          String(c.customerCode ?? "").toLowerCase().includes(q) ||
          String(c.customerName ?? "").toLowerCase().includes(q) ||
          String(c.orderCode ?? "").toLowerCase().includes(q) ||
          String(c.phoneContact ?? "").toLowerCase().includes(q)
        );
      })
      .map((r) => ({
        id: r.contactId ?? r.id,
        __full: r,
        ...r,
      }));
  }, [currentList, search]);

  const openDrawerFor = (row: any) => {
    setSelectedContact(row.__full ?? row);
    setDrawerOpen(true);
  };

  /* ======================
     DESKTOP columns
  ====================== */
  const desktopColumns: GridColDef<any>[] = [
  { field: "contactId", headerName: t("table.id") ?? "ID", minWidth: 90, flex: 0.5 },

  { field: "customerCode", headerName: t("table.customerCode") ?? "Customer", minWidth: 140, flex: 1 },

  { field: "customerName", headerName: t("table.customerName") ?? "Name", minWidth: 160, flex: 1.2 },

  { field: "orderCode", headerName: t("table.orderCode") ?? "Order", minWidth: 150, flex: 1 },

  { field: "phoneContact", headerName: t("table.phone") ?? "Phone", minWidth: 140, flex: 1 },

  {
    field: "contactDate",
    headerName: t("table.contactDate") ?? "Contact date",
    minWidth: 140,
    flex: 1,
    valueGetter: (_value, row) => row?.contactDate ?? "—",
  },

  {
    field: "retrievedDate",
    headerName: t("table.retrievedDate") ?? "Retrieved date",
    minWidth: 140,
    flex: 1,
    valueGetter: (_value, row) => row?.retrievedDate ?? "—",
  },

  {
    field: "isActive",
    headerName: t("table.isActive") ?? "Active",
    minWidth: 120,
    flex: 0.6,
    renderCell: (params) =>
      params.row?.isActive === false ? (
        <Chip size="small" label={t("table.inactive") ?? "No"} />
      ) : (
        <Chip size="small" color="success" label={t("table.active") ?? "Yes"} />
      ),
  },

  {
    field: "actions",
    headerName: t("table.actions") ?? "Actions",
    width: 120,
    sortable: false,
    renderCell: (params) => (
      <IconButton size="small" onClick={() => openDrawerFor(params.row)}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
    ),
  },
];


  /* ======================
     MOBILE columns
  ====================== */
  const mobileColumns: GridColDef<any>[] = [
    {
      field: "customerName",
      headerName: t("table.customerName") ?? "Name",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "phoneContact",
      headerName: t("table.phone") ?? "Phone",
      minWidth: 130,
    },
    {
      field: "isActive",
      headerName: t("table.isActive") ?? "Status",
      width: 110,
      renderCell: (params) =>
        params.row?.isActive === false ? (
          <Chip size="small" label={t("table.inactive") ?? "No"} />
        ) : (
          <Chip size="small" color="success" label={t("table.active") ?? "Yes"} />
        ),
    },
  ];

  const columns = isMobile ? mobileColumns : desktopColumns;

  /* ======================
     Export CSV
  ====================== */
  const handleExportCsv = () => {
    if (!rows.length) return;
    const keys = [
      "contactId",
      "customerCode",
      "customerName",
      "orderCode",
      "phoneContact",
      "email",
      "contactDate",
      "retrievedDate",
      "message",
      "isActive",
    ];
    const csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ======================
     Render
  ====================== */
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700}>
        {t("page.title") ?? "Contacts"}
      </Typography>
      <Typography color="text.secondary" mb={2}>
        {t("page.subtitle")}
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Tabs
            value={tabIndex}
            onChange={(_, v) => setTabIndex(v)}
            variant={isMobile ? "scrollable" : "standard"}
          >
            <Tab label={`${t("tabs.contact")} (${contactsWithoutOrder.length})`} {...a11yProps(0)} />
            <Tab label={`${t("tabs.support")} (${contactsWithOrder.length})`} {...a11yProps(1)} />
            <Tab label={`${t("tabs.processed")} (${contactsProcessed.length})`} {...a11yProps(2)} />
          </Tabs>

          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              fullWidth={isMobile}
              placeholder={t("page.searchPlaceholder")}
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
              {t("actions.export")}
            </Button>
            <IconButton onClick={fetchContacts}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ToolbarExtras
            onExport={handleExportCsv}
            onRefresh={fetchContacts}
            exportLabel={t("actions.exportCsv")}
            refreshLabel={t("actions.refresh")}
          />

          <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            loading={loading}
            getRowId={(r) => r.id}
            disableRowSelectionOnClick
            hideFooter={isMobile}
            disableColumnMenu={isMobile}
            rowHeight={isMobile ? 64 : 52}
            onRowClick={(p: GridRowParams<any>) => isMobile && openDrawerFor(p.row)}
            onRowDoubleClick={(p) => !isMobile && openDrawerFor(p.row)}
            sx={{
              border: "none",
              width: "100%",
              ...(isMobile && {
                "& .MuiDataGrid-cell": {
                  whiteSpace: "normal",
                  lineHeight: 1.4,
                },
              }),
            }}
          />
        </CardContent>
      </Card>

      <ContactDetailDrawer
        contact={selectedContact}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedContact(null);
        }}
        onToggled={() => {
          fetchContacts();
          setDrawerOpen(false);
          setSelectedContact(null);
        }}
      />
    </Box>
  );
}
