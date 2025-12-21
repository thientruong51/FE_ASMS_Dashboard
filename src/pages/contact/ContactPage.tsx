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
  MenuItem,
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


function a11yProps(index: number) {
  return {
    id: `contact-tab-${index}`,
    "aria-controls": `contact-tabpanel-${index}`,
  };
}

function normalizeContactType(type?: string | null): string | null {
  if (!type) return null;

  return type
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function getContactTypeLabel(
  t: (key: string, options?: any) => string,
  contactType?: string | null
) {
  const key = normalizeContactType(contactType);
  if (!key) return "—";

  return t(`contactType.${key}`, {
    defaultValue: contactType,
  });
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
  const dispatch = useDispatch();
  const [retrieveCounts, setRetrieveCounts] = useState<Record<string, number>>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
const [contactTypeFilter, setContactTypeFilter] = useState<string>("all");
const CONTACT_TYPES = [
  { value: "damage report" },
  { value: "refund" },
  { value: "request to retrieve" },
];
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


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


const rows = useMemo(() => {
  const q = search.trim().toLowerCase();

  return currentList
    .filter((c) => {
      // 🔎 Search
      if (q) {
        const matched =
          String(c.customerCode ?? "").toLowerCase().includes(q) ||
          String(c.customerName ?? "").toLowerCase().includes(q) ||
          String(c.orderCode ?? "").toLowerCase().includes(q) ||
          String(c.phoneContact ?? "").toLowerCase().includes(q);

        if (!matched) return false;
      }

      // 🏷 contactType filter
      if (
        contactTypeFilter !== "all" &&
        c.contactType !== contactTypeFilter
      ) {
        return false;
      }

      return true;
    })
    .map((r) => ({
      id: r.contactId ?? r.id,
      __full: r,
      ...r,
    }));
}, [currentList, search, contactTypeFilter]);


  const openDrawerFor = (row: any) => {
    setSelectedContact(row.__full ?? row);
    setDrawerOpen(true);
  };
  useEffect(() => {
    if (!contacts.length) return;

    const orderCodes = Array.from(
      new Set(
        contacts
          .map((c) => c?.orderCode)
          .filter((oc): oc is string => !!oc)
      )
    );

    if (!orderCodes.length) return;

    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          orderCodes.map(async (oc) => {
            try {
              const resp = await contactApi.getRetrieveRequestCount(oc);
              return [oc, resp?.requestToRetrieveCount ?? 0] as const;
            } catch {
              return [oc, 0] as const;
            }
          })
        );

        if (!cancelled) {
          setRetrieveCounts(Object.fromEntries(results));
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contacts]);

 
  const desktopColumns: GridColDef<any>[] = [
    { field: "contactId", headerName: t("table.id") ?? "ID", minWidth: 90, flex: 0.5 },

    { field: "customerCode", headerName: t("table.customerCode") ?? "Customer", minWidth: 140, flex: 1 },

    { field: "customerName", headerName: t("table.customerName") ?? "Name", minWidth: 160, flex: 1.2 },

    { field: "orderCode", headerName: t("table.orderCode") ?? "Order", minWidth: 150, flex: 1 },
    {
      field: "contactType",
      headerName: t("table.contactType") ?? "Type",
      minWidth: 160,
      renderCell: (params) => (
        <Chip
          size="small"
          label={getContactTypeLabel(t, params.row?.contactType)}
        />
      ),
    },


    {
      field: "orderDetailId",
      headerName: t("table.orderDetailId") ?? "Order detail ID",
      minWidth: 140,
      flex: 1,
    },

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
      field: "requestToRetrieveCount",
      headerName: t("table.retrieveCount") ?? "Retrieve requests",
      minWidth: 160,
      flex: 0.8,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const orderCode = params.row?.orderCode;
        if (!orderCode) return "—";

        const count = retrieveCounts[orderCode];

        if (count === undefined) return "…"; 

        return (
          <Chip
            size="small"
            color={count > 0 ? "warning" : "default"}
            label={count}
          />
        );
      },
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
      "requestToRetrieveCount",
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
        keys
          .map((k) => {
            if (k === "requestToRetrieveCount") {
              return `"${retrieveCounts[r.orderCode] ?? 0}"`;
            }
            return `"${String(r[k] ?? "").replace(/"/g, '""')}"`;
          })
          .join(",")
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
            <TextField
  size="small"
  select
  value={contactTypeFilter}
  onChange={(e) => setContactTypeFilter(e.target.value)}
  sx={{ minWidth: 200 }}
  label={t("filters.contactType")}
>
  <MenuItem value="all">
    {t("filters.all")}
  </MenuItem>

  {CONTACT_TYPES.map((ct) => (
    <MenuItem key={ct.value} value={ct.value}>
      {getContactTypeLabel(t, ct.value)}
    </MenuItem>
  ))}
</TextField>

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
