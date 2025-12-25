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

function PricingTypes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  const [addFormData, setAddFormData] = useState({ name: "" });
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
  const COLUMN_ORDER_KEY = "pricing-types-column-order";
  const HIDDEN_COLUMNS_KEY = "pricing-types-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("pricing_types")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
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
        .from("pricing_types")
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
    setEditFormData({ name: row.name || "" });
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
        .from("pricing_types")
        .update({
          name: editFormData.name,
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
    setAddFormData({ name: "" });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleDuplicateClick = (row) => {
    setAddFormData({ name: `${row.name || ""} (Copy)` });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({ name: "" });
    setAddFormTouched({});
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);
      const { error: insertError } = await supabase.from("pricing_types").insert({
        name: addFormData.name,
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
    return row.name && row.name.toLowerCase().includes(search);
  });

  const allColumns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      id: "name",
      width: "70%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.name_raw || "";
        const b = rowB.original.name_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Actions",
      accessor: "actions",
      id: "actions",
      width: "30%",
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
                  Pricing Types
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <TextField
                        placeholder="Search pricing types..."
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
                        Add Pricing Type
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
                        No pricing types found. Click &quot;Add Pricing Type&quot; to create one.
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
                      tableId="pricing-types-table"
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
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Pricing Type</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Name *"
              value={editFormData.name || ""}
              onChange={(e) => handleEditFormChange("name", e.target.value)}
              onBlur={() => setEditFormTouched((prev) => ({ ...prev, name: true }))}
              margin="normal"
              error={editFormTouched.name && !!validateName(editFormData.name)}
              helperText={editFormTouched.name && validateName(editFormData.name)}
              placeholder="e.g., List Price, 1Y Commit, 3Y Commit"
            />
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
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pricing Type</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Name *"
              value={addFormData.name}
              onChange={(e) => handleAddFormChange("name", e.target.value)}
              onBlur={() => setAddFormTouched((prev) => ({ ...prev, name: true }))}
              margin="normal"
              error={addFormTouched.name && !!validateName(addFormData.name)}
              helperText={addFormTouched.name && validateName(addFormData.name)}
              placeholder="e.g., List Price, 1Y Commit, 3Y Commit"
            />
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

export default PricingTypes;
