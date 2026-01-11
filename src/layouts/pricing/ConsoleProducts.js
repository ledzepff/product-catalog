/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useCallback } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// Supabase client
import { supabase } from "supabaseClient";

// Available channels
const CHANNELS = [
  { value: "cloud_console", label: "Cloud Console" },
  { value: "partner_portal", label: "Partner Portal" },
  { value: "reseller_api", label: "Reseller API" },
];

function ConsoleProducts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Channel filter
  const [selectedChannel, setSelectedChannel] = useState("cloud_console");

  // Available products (with rate plans)
  const [availableProducts, setAvailableProducts] = useState([]);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    product_id: null,
    channel: "cloud_console",
    is_available: true,
    available_from: "",
    available_until: "",
    sort_order: "",
    notes: "",
  });
  const [adding, setAdding] = useState(false);

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Column order state
  const [columnOrder, setColumnOrder] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // localStorage keys
  const COLUMN_ORDER_KEY = "console-products-column-order";
  const HIDDEN_COLUMNS_KEY = "console-products-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("product_availability")
        .select(`
          *,
          product:products(
            id,
            name,
            is_active,
            rate_plans(id)
          )
        `)
        .eq("channel", selectedChannel)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableProducts() {
    try {
      // Get products that have rate plans and are not already in the current channel
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          rate_plans!inner(id)
        `)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("rate_plans.deleted_at", null)
        .order("name");

      if (productsError) throw productsError;

      // Get unique products (since join may duplicate)
      const uniqueProducts = [];
      const seenIds = new Set();
      (products || []).forEach((p) => {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          uniqueProducts.push({ id: p.id, name: p.name });
        }
      });

      setAvailableProducts(uniqueProducts);
    } catch (err) {
      console.error("Error fetching available products:", err);
    }
  }

  useEffect(() => {
    fetchData();
  }, [selectedChannel]);

  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  // Load column order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(COLUMN_ORDER_KEY);
    if (savedOrder) {
      try {
        setColumnOrder(JSON.parse(savedOrder));
      } catch {
        setColumnOrder([]);
      }
    }
  }, []);

  // Load hidden columns from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem(HIDDEN_COLUMNS_KEY);
    if (savedHidden) {
      try {
        setHiddenColumns(JSON.parse(savedHidden));
      } catch {
        setHiddenColumns([]);
      }
    }
  }, []);

  const saveColumnOrder = useCallback((order) => {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  }, []);

  const saveHiddenColumns = useCallback((hidden) => {
    localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(hidden));
  }, []);

  const toggleColumnVisibility = (columnId) => {
    setHiddenColumns((prev) => {
      const newHidden = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];
      saveHiddenColumns(newHidden);
      return newHidden;
    });
  };

  const showAllColumns = () => {
    setHiddenColumns([]);
    saveHiddenColumns([]);
  };

  const handleColumnMenuOpen = (event) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const handleColumnOrderChange = (newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  };

  const resetColumnOrder = () => {
    setColumnOrder([]);
    localStorage.removeItem(COLUMN_ORDER_KEY);
    setHiddenColumns([]);
    localStorage.removeItem(HIDDEN_COLUMNS_KEY);
  };

  // Delete handlers (soft delete)
  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!rowToDelete) return;

    try {
      setDeleting(true);
      const { error: updateError } = await supabase
        .from("product_availability")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowToDelete.id);

      if (updateError) throw updateError;

      await fetchData();
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Edit handlers
  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      is_available: row.is_available !== false,
      available_from: row.available_from ? row.available_from.split("T")[0] : "",
      available_until: row.available_until ? row.available_until.split("T")[0] : "",
      sort_order: row.sort_order || "",
      notes: row.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);

      const updateData = {
        is_available: editFormData.is_available,
        available_from: editFormData.available_from || null,
        available_until: editFormData.available_until || null,
        sort_order: editFormData.sort_order ? parseInt(editFormData.sort_order) : null,
        notes: editFormData.notes || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("product_availability")
        .update(updateData)
        .eq("id", editingRow.id);

      if (updateError) throw updateError;

      await fetchData();
      handleEditClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Add handlers
  const handleAddClick = () => {
    setAddFormData({
      product_id: null,
      channel: selectedChannel,
      is_available: true,
      available_from: "",
      available_until: "",
      sort_order: "",
      notes: "",
    });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      product_id: null,
      channel: selectedChannel,
      is_available: true,
      available_from: "",
      available_until: "",
      sort_order: "",
      notes: "",
    });
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSave = async () => {
    if (!addFormData.product_id) return;

    try {
      setAdding(true);

      const insertData = {
        product_id: addFormData.product_id.id,
        channel: addFormData.channel,
        is_available: addFormData.is_available,
        available_from: addFormData.available_from || null,
        available_until: addFormData.available_until || null,
        sort_order: addFormData.sort_order ? parseInt(addFormData.sort_order) : null,
        notes: addFormData.notes || null,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("product_availability")
        .insert(insertData);

      if (insertError) throw insertError;

      await fetchData();
      await fetchAvailableProducts();
      handleAddClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Get products not yet added to current channel
  const productsNotInChannel = useMemo(() => {
    const existingProductIds = new Set(data.map((d) => d.product_id));
    return availableProducts.filter((p) => !existingProductIds.has(p.id));
  }, [availableProducts, data]);

  // Helper to format availability status
  const getAvailabilityStatus = (row) => {
    if (!row.is_available) {
      return { label: "Disabled", color: "default" };
    }

    const now = new Date();
    const from = row.available_from ? new Date(row.available_from) : null;
    const until = row.available_until ? new Date(row.available_until) : null;

    if (from && from > now) {
      return { label: "Scheduled", color: "warning" };
    }
    if (until && until < now) {
      return { label: "Expired", color: "error" };
    }
    return { label: "Available", color: "success" };
  };

  // Helper to format date range
  const formatDateRange = (row) => {
    const from = row.available_from ? new Date(row.available_from).toLocaleDateString() : null;
    const until = row.available_until ? new Date(row.available_until).toLocaleDateString() : null;

    if (!from && !until) return "Always";
    if (from && !until) return `From ${from}`;
    if (!from && until) return `Until ${until}`;
    return `${from} - ${until}`;
  };

  // Filter data
  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.product?.name && row.product.name.toLowerCase().includes(search)) ||
      (row.notes && row.notes.toLowerCase().includes(search))
    );
  });

  // Define columns
  const allColumns = useMemo(
    () => [
      {
        Header: "Product",
        accessor: "product_name",
        id: "product_name",
        width: "25%",
        sortType: (rowA, rowB) => {
          const a = rowA.original.product_name_raw || "";
          const b = rowB.original.product_name_raw || "";
          return a.localeCompare(b);
        },
      },
      {
        Header: "Rate Plans",
        accessor: "rate_plans_count",
        id: "rate_plans_count",
        width: "10%",
        align: "center",
      },
      {
        Header: "Status",
        accessor: "status",
        id: "status",
        width: "12%",
        align: "center",
      },
      {
        Header: "Availability",
        accessor: "availability",
        id: "availability",
        width: "18%",
      },
      {
        Header: "Sort Order",
        accessor: "sort_order",
        id: "sort_order",
        width: "10%",
        align: "center",
      },
      {
        Header: "Notes",
        accessor: "notes",
        id: "notes",
        width: "15%",
      },
      {
        Header: "Actions",
        accessor: "actions",
        id: "actions",
        width: "10%",
        align: "center",
        disableSortBy: true,
      },
    ],
    []
  );

  // Get ordered columns
  const orderedColumns = useMemo(() => {
    if (columnOrder.length === 0) return allColumns;

    const columnMap = new Map(allColumns.map((col) => [col.id, col]));
    const ordered = [];
    const usedIds = new Set();

    columnOrder.forEach((id) => {
      if (columnMap.has(id)) {
        ordered.push(columnMap.get(id));
        usedIds.add(id);
      }
    });

    allColumns.forEach((col) => {
      if (!usedIds.has(col.id)) ordered.push(col);
    });

    return ordered;
  }, [allColumns, columnOrder]);

  // Get visible columns
  const columns = useMemo(() => {
    return orderedColumns.filter((col) => !hiddenColumns.includes(col.id));
  }, [orderedColumns, hiddenColumns]);

  // Transform data to rows
  const rows = filteredData.map((row) => {
    const status = getAvailabilityStatus(row);
    return {
      id: row.id,
      product_name: (
        <MDBox>
          <MDTypography variant="button" fontWeight="medium">
            {row.product?.name || "-"}
          </MDTypography>
          {row.product && !row.product.is_active && (
            <Chip label="Inactive" size="small" color="default" sx={{ ml: 1, fontSize: "0.65rem" }} />
          )}
        </MDBox>
      ),
      product_name_raw: row.product?.name || "",
      rate_plans_count: (
        <Chip
          label={row.product?.rate_plans?.length || 0}
          size="small"
          color="info"
          variant="outlined"
        />
      ),
      status: (
        <Chip
          label={status.label}
          size="small"
          color={status.color}
          variant="outlined"
        />
      ),
      availability: (
        <MDTypography variant="caption" color="text">
          {formatDateRange(row)}
        </MDTypography>
      ),
      sort_order: (
        <MDTypography variant="caption" color="text">
          {row.sort_order || "-"}
        </MDTypography>
      ),
      notes: (
        <Tooltip title={row.notes || ""} placement="top">
          <MDTypography variant="caption" color="text" sx={{ display: "block", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {row.notes ? (row.notes.length > 30 ? `${row.notes.substring(0, 30)}...` : row.notes) : "-"}
          </MDTypography>
        </Tooltip>
      ),
      actions: (
        <MDBox display="flex" justifyContent="center" gap={0.5}>
          <Tooltip title="Edit" placement="top">
            <IconButton
              size="small"
              onClick={() => handleEditClick(row)}
              sx={{
                color: "info.main",
                "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(26, 115, 232, 0.1)" },
              }}
            >
              <Icon fontSize="small">edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove" placement="top">
            <IconButton
              size="small"
              onClick={() => handleDeleteClick(row)}
              sx={{
                color: "error.main",
                "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(244, 67, 54, 0.1)" },
              }}
            >
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </Tooltip>
        </MDBox>
      ),
    };
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={1}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Console Product Availability
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Channel</InputLabel>
                        <Select
                          value={selectedChannel}
                          label="Channel"
                          onChange={(e) => setSelectedChannel(e.target.value)}
                        >
                          {CHANNELS.map((ch) => (
                            <MenuItem key={ch.value} value={ch.value}>
                              {ch.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        placeholder="Search products..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 250 }}
                        InputProps={{
                          startAdornment: <Icon sx={{ color: "text.secondary", mr: 1 }}>search</Icon>,
                          endAdornment: searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm("")} sx={{ p: 0.5 }}>
                              <Icon sx={{ fontSize: "1rem !important" }}>close</Icon>
                            </IconButton>
                          ),
                        }}
                      />
                    </MDBox>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Show/Hide Columns">
                        <IconButton size="small" onClick={handleColumnMenuOpen} sx={{ color: "text.secondary" }}>
                          <Icon>view_column</Icon>
                        </IconButton>
                      </Tooltip>
                      <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
                        <Icon sx={{ mr: 1 }}>add</Icon>
                        Add Product
                      </MDButton>
                    </MDBox>
                  </MDBox>
                </MDBox>
                <MDBox pt={0}>
                  {loading ? (
                    <MDBox display="flex" justifyContent="center" py={3}>
                      <CircularProgress color="info" />
                    </MDBox>
                  ) : error ? (
                    <MDBox px={3} pb={3}>
                      <MDTypography variant="body2" color="error">
                        Error: {error}
                      </MDTypography>
                    </MDBox>
                  ) : data.length === 0 ? (
                    <MDBox px={3} pb={3}>
                      <MDTypography variant="body2" color="text">
                        No products configured for {CHANNELS.find((c) => c.value === selectedChannel)?.label || selectedChannel}. Click &quot;Add Product&quot; to add one.
                      </MDTypography>
                    </MDBox>
                  ) : (
                    <DataTable
                      table={{ columns, rows }}
                      isSorted={true}
                      entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
                      showTotalEntries={true}
                      noEndBorder
                      canSearch={false}
                      draggableColumns={true}
                      onColumnOrderChange={handleColumnOrderChange}
                      onResetColumnOrder={resetColumnOrder}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                      tableId="console-products-table"
                    />
                  )}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Remove</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove &quot;{rowToDelete?.product?.name}&quot; from {CHANNELS.find((c) => c.value === selectedChannel)?.label || selectedChannel}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleDeleteCancel} color="secondary" disabled={deleting}>
            Cancel
          </MDButton>
          <MDButton onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? "Removing..." : "Remove"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Product Availability</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDTypography variant="h6" mb={2}>
              {editingRow?.product?.name}
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.is_available}
                      onChange={(e) => handleEditFormChange("is_available", e.target.checked)}
                    />
                  }
                  label="Available"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Available From"
                  value={editFormData.available_from || ""}
                  onChange={(e) => handleEditFormChange("available_from", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for 'from beginning'"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Available Until"
                  value={editFormData.available_until || ""}
                  onChange={(e) => handleEditFormChange("available_until", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for 'forever'"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sort Order"
                  value={editFormData.sort_order || ""}
                  onChange={(e) => handleEditFormChange("sort_order", e.target.value)}
                  helperText="Lower numbers appear first"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={editFormData.notes || ""}
                  onChange={(e) => handleEditFormChange("notes", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleEditClose} color="secondary" disabled={saving}>
            Cancel
          </MDButton>
          <MDButton onClick={handleEditSave} color="info" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Product to {CHANNELS.find((c) => c.value === addFormData.channel)?.label || addFormData.channel}</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  options={productsNotInChannel}
                  getOptionLabel={(option) => option.name || ""}
                  value={addFormData.product_id}
                  onChange={(_, newValue) => handleAddFormChange("product_id", newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Product *" placeholder="Choose a product..." />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.name}
                    </li>
                  )}
                />
                {productsNotInChannel.length === 0 && (
                  <MDTypography variant="caption" color="warning" mt={1}>
                    All products with rate plans are already added to this channel.
                  </MDTypography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={addFormData.is_available}
                      onChange={(e) => handleAddFormChange("is_available", e.target.checked)}
                    />
                  }
                  label="Available"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Available From"
                  value={addFormData.available_from || ""}
                  onChange={(e) => handleAddFormChange("available_from", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for 'from beginning'"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Available Until"
                  value={addFormData.available_until || ""}
                  onChange={(e) => handleAddFormChange("available_until", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for 'forever'"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sort Order"
                  value={addFormData.sort_order || ""}
                  onChange={(e) => handleAddFormChange("sort_order", e.target.value)}
                  helperText="Lower numbers appear first"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={addFormData.notes || ""}
                  onChange={(e) => handleAddFormChange("notes", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleAddClose} color="secondary" disabled={adding}>
            Cancel
          </MDButton>
          <MDButton onClick={handleAddSave} color="info" disabled={adding || !addFormData.product_id}>
            {adding ? "Adding..." : "Add"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Column Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
        PaperProps={{ sx: { maxHeight: 400, minWidth: 220 } }}
      >
        <MDBox px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="caption" fontWeight="bold" color="text">
            Show/Hide Columns
          </MDTypography>
          {hiddenColumns.length > 0 && (
            <Button size="small" onClick={showAllColumns} sx={{ fontSize: "0.7rem", p: 0 }}>
              Show All
            </Button>
          )}
        </MDBox>
        {allColumns
          .filter((col) => col.id !== "actions")
          .map((col) => (
            <MenuItem key={col.id} onClick={() => toggleColumnVisibility(col.id)} dense sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox checked={!hiddenColumns.includes(col.id)} size="small" sx={{ p: 0 }} />
              </ListItemIcon>
              <ListItemText primary={col.Header} primaryTypographyProps={{ variant: "body2", fontSize: "0.875rem" }} />
            </MenuItem>
          ))}
      </Menu>
    </DashboardLayout>
  );
}

export default ConsoleProducts;
