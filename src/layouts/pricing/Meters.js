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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";

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

function Meters() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Lookup data
  const [periods, setPeriods] = useState([]);
  const [valueTypes, setValueTypes] = useState([]);
  const [meters, setMeters] = useState([]); // For predecessor

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editFormTouched, setEditFormTouched] = useState({});

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    period_id: "",
    value_type_id: "",
    value_format: "",
    predecessor_meter_id: "",
    is_required: false,
    description: "",
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({});

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Column order state
  const [columnOrder, setColumnOrder] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // localStorage keys
  const COLUMN_ORDER_KEY = "meters-column-order";
  const HIDDEN_COLUMNS_KEY = "meters-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch meters with related data (excluding self-reference)
      const { data: tableData, error: fetchError } = await supabase
        .from("meters")
        .select(`
          *,
          period:periods(id, name),
          value_type:meter_value_types(id, name)
        `)
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      // Create a map for predecessor lookup
      const metersMap = new Map((tableData || []).map((m) => [m.id, m]));

      // Add predecessor info manually
      const dataWithPredecessor = (tableData || []).map((m) => ({
        ...m,
        predecessor: m.predecessor_meter_id ? metersMap.get(m.predecessor_meter_id) : null,
      }));

      setData(dataWithPredecessor);
      setMeters(tableData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLookups() {
    try {
      const [periodsRes, valueTypesRes] = await Promise.all([
        supabase.from("periods").select("id, name").is("deleted_at", null).order("name"),
        supabase.from("meter_value_types").select("id, name").is("deleted_at", null).order("name"),
      ]);

      if (periodsRes.error) throw periodsRes.error;
      if (valueTypesRes.error) throw valueTypesRes.error;

      setPeriods(periodsRes.data || []);
      setValueTypes(valueTypesRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

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
        .from("meters")
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

  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      name: row.name || "",
      period_id: row.period_id || "",
      value_type_id: row.value_type_id || "",
      value_format: row.value_format || "",
      predecessor_meter_id: row.predecessor_meter_id || "",
      is_required: row.is_required || false,
      description: row.description || "",
    });
    setEditFormTouched({});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from("meters")
        .update({
          name: editFormData.name,
          period_id: editFormData.period_id || null,
          value_type_id: editFormData.value_type_id || null,
          value_format: editFormData.value_format ? parseFloat(editFormData.value_format) : null,
          predecessor_meter_id: editFormData.predecessor_meter_id || null,
          is_required: editFormData.is_required,
          description: editFormData.description || null,
          updated_at: new Date().toISOString(),
        })
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

  const handleAddClick = () => {
    setAddFormData({
      name: "",
      period_id: "",
      value_type_id: "",
      value_format: "",
      predecessor_meter_id: "",
      is_required: false,
      description: "",
    });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleDuplicateClick = (row) => {
    setAddFormData({
      name: `${row.name || ""} (Copy)`,
      period_id: row.period_id || "",
      value_type_id: row.value_type_id || "",
      value_format: row.value_format || "",
      predecessor_meter_id: row.predecessor_meter_id || "",
      is_required: row.is_required || false,
      description: row.description || "",
    });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      name: "",
      period_id: "",
      value_type_id: "",
      value_format: "",
      predecessor_meter_id: "",
      is_required: false,
      description: "",
    });
    setAddFormTouched({});
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);
      const { error: insertError } = await supabase.from("meters").insert({
        name: addFormData.name,
        period_id: addFormData.period_id || null,
        value_type_id: addFormData.value_type_id || null,
        value_format: addFormData.value_format ? parseFloat(addFormData.value_format) : null,
        predecessor_meter_id: addFormData.predecessor_meter_id || null,
        is_required: addFormData.is_required,
        description: addFormData.description || null,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await fetchData();
      handleAddClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const validateName = (name) => {
    if (!name || name.trim().length === 0) return "Name is required";
    return "";
  };

  const isAddFormValid = () => !validateName(addFormData.name);
  const isEditFormValid = () => !validateName(editFormData.name);

  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.name && row.name.toLowerCase().includes(search)) ||
      (row.description && row.description.toLowerCase().includes(search)) ||
      (row.period?.name && row.period.name.toLowerCase().includes(search)) ||
      (row.value_type?.name && row.value_type.name.toLowerCase().includes(search))
    );
  });

  const allColumns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      id: "name",
      width: "20%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.name_raw || "";
        const b = rowB.original.name_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Period",
      accessor: "period",
      id: "period",
      width: "12%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.period_raw || "";
        const b = rowB.original.period_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Value Type",
      accessor: "value_type",
      id: "value_type",
      width: "12%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.value_type_raw || "";
        const b = rowB.original.value_type_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Format",
      accessor: "value_format",
      id: "value_format",
      width: "10%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.value_format_raw || 0;
        const b = rowB.original.value_format_raw || 0;
        return a - b;
      },
    },
    {
      Header: "Required",
      accessor: "is_required",
      id: "is_required",
      width: "10%",
      align: "center",
    },
    {
      Header: "Predecessor",
      accessor: "predecessor",
      id: "predecessor",
      width: "15%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.predecessor_raw || "";
        const b = rowB.original.predecessor_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      id: "actions",
      width: "15%",
      align: "center",
      disableSortBy: true,
    },
  ], []);

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

  const columns = useMemo(() => {
    return orderedColumns.filter((col) => !hiddenColumns.includes(col.id));
  }, [orderedColumns, hiddenColumns]);

  const rows = filteredData.map((row) => ({
    id: row.id,
    name: (
      <MDTypography variant="button" fontWeight="medium">
        {row.name || "-"}
      </MDTypography>
    ),
    name_raw: row.name || "",
    period: (
      <MDTypography variant="caption" color="text">
        {row.period?.name || "-"}
      </MDTypography>
    ),
    period_raw: row.period?.name || "",
    value_type: (
      <Chip
        label={row.value_type?.name || "-"}
        size="small"
        color="info"
        variant="outlined"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    value_type_raw: row.value_type?.name || "",
    value_format: (
      <MDTypography variant="caption" color="text">
        {row.value_format != null ? row.value_format : "-"}
      </MDTypography>
    ),
    value_format_raw: row.value_format || 0,
    is_required: (
      <Icon sx={{ color: row.is_required ? "success.main" : "grey.400" }}>
        {row.is_required ? "check_circle" : "cancel"}
      </Icon>
    ),
    predecessor: (
      <MDTypography variant="caption" color="text">
        {row.predecessor?.name || "-"}
      </MDTypography>
    ),
    predecessor_raw: row.predecessor?.name || "",
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
        <Tooltip title="Duplicate" placement="top">
          <IconButton
            size="small"
            onClick={() => handleDuplicateClick(row)}
            sx={{
              color: "success.main",
              "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(76, 175, 80, 0.1)" },
            }}
          >
            <Icon fontSize="small">content_copy</Icon>
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete" placement="top">
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
  }));

  const renderFormFields = (formData, handleChange, setTouched, touched, isEdit = false) => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name *"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            margin="normal"
            error={touched.name && !!validateName(formData.name)}
            helperText={touched.name && validateName(formData.name)}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Period</InputLabel>
            <Select
              value={formData.period_id || ""}
              onChange={(e) => handleChange("period_id", e.target.value)}
              label="Period"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Value Type</InputLabel>
            <Select
              value={formData.value_type_id || ""}
              onChange={(e) => handleChange("value_type_id", e.target.value)}
              label="Value Type"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {valueTypes.map((vt) => (
                <MenuItem key={vt.id} value={vt.id}>{vt.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Value Format"
            type="number"
            value={formData.value_format || ""}
            onChange={(e) => handleChange("value_format", e.target.value)}
            margin="normal"
            placeholder="Decimal precision"
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Predecessor Meter</InputLabel>
            <Select
              value={formData.predecessor_meter_id || ""}
              onChange={(e) => handleChange("predecessor_meter_id", e.target.value)}
              label="Predecessor Meter"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {meters
                .filter((m) => !isEdit || m.id !== editingRow?.id)
                .map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_required || false}
                onChange={(e) => handleChange("is_required", e.target.checked)}
              />
            }
            label="Required"
            sx={{ mt: 1 }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </>
  );

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
                  Meters
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <TextField
                        placeholder="Search meters..."
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
                        Add Meter
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
                        No meters found. Click &quot;Add Meter&quot; to create one.
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
                      tableId="meters-table"
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
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{rowToDelete?.name}&quot;?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleDeleteCancel} color="secondary" disabled={deleting}>
            Cancel
          </MDButton>
          <MDButton onClick={handleDeleteConfirm} color="error" disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Meter</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {renderFormFields(editFormData, handleEditFormChange, setEditFormTouched, editFormTouched, true)}
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleEditClose} color="secondary" disabled={saving}>
            Cancel
          </MDButton>
          <MDButton onClick={handleEditSave} color="info" disabled={saving || !isEditFormValid()}>
            {saving ? "Saving..." : "Save"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Meter</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {renderFormFields(addFormData, handleAddFormChange, setAddFormTouched, addFormTouched)}
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleAddClose} color="secondary" disabled={adding}>
            Cancel
          </MDButton>
          <MDButton onClick={handleAddSave} color="info" disabled={adding || !isAddFormValid()}>
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

export default Meters;
