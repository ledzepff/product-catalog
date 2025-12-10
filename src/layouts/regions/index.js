import { useState, useEffect } from "react";

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

function Regions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editFormTouched, setEditFormTouched] = useState({ name: false, address: false });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    address: "",
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({ name: false, address: false });

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("region")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

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
        .from("region")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
          updated_by: "admin",
        })
        .eq("id", rowToDelete.id);

      if (updateError) {
        throw updateError;
      }

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
      name: row.name || "",
      address: row.address || "",
    });
    setEditFormTouched({ name: false, address: false });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({ name: false, address: false });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      const updateData = {
        name: editFormData.name,
        address: editFormData.address,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      };

      const { error: updateError } = await supabase
        .from("region")
        .update(updateData)
        .eq("id", editingRow.id);

      if (updateError) {
        throw updateError;
      }

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
      name: "",
      address: "",
    });
    setAddFormTouched({ name: false, address: false });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      name: "",
      address: "",
    });
    setAddFormTouched({ name: false, address: false });
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);
      const insertData = {
        name: addFormData.name,
        address: addFormData.address,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("region").insert(insertData);

      if (insertError) {
        throw insertError;
      }

      await fetchData();
      handleAddClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Validation helpers
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Name is required";
    }
    if (name.trim().length < 3) {
      return "Name must be at least 3 characters long";
    }
    return "";
  };

  const validateAddress = (address) => {
    if (!address || address.trim().length === 0) {
      return "Address is required";
    }
    if (address.trim().length < 5) {
      return "Address must be at least 5 characters long";
    }
    return "";
  };

  const isAddFormValid = () => {
    return !validateName(addFormData.name) && !validateAddress(addFormData.address);
  };

  const isEditFormValid = () => {
    return !validateName(editFormData.name) && !validateAddress(editFormData.address);
  };

  // Define columns for DataTable
  const columns = [
    {
      Header: "name",
      accessor: "name",
      width: "35%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.name_raw || "";
        const b = rowB.original.name_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "address",
      accessor: "address",
      width: "45%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.address_raw || "";
        const b = rowB.original.address_raw || "";
        return a.localeCompare(b);
      },
    },
    { Header: "actions", accessor: "actions", width: "20%", align: "center" },
  ];

  // Transform data to rows format for DataTable
  const rows = data.map((row) => ({
    name: (
      <MDTypography variant="button" fontWeight="medium">
        {row.name || "-"}
      </MDTypography>
    ),
    name_raw: row.name || "",
    address: (
      <MDTypography variant="caption" color="text">
        {row.address || "-"}
      </MDTypography>
    ),
    address_raw: row.address || "",
    actions: (
      <MDBox display="flex" justifyContent="center" gap={1}>
        <IconButton
          size="small"
          onClick={() => handleEditClick(row)}
          sx={{
            color: "info.main",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.2)",
              backgroundColor: "rgba(26, 115, 232, 0.1)",
            },
          }}
        >
          <Icon>edit</Icon>
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteClick(row)}
          sx={{
            color: "error.main",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.2)",
              backgroundColor: "rgba(244, 67, 54, 0.1)",
            },
          }}
        >
          <Icon>delete</Icon>
        </IconButton>
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
                  Regions
                </MDTypography>
                <MDButton variant="gradient" color="light" size="small" onClick={handleAddClick}>
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Region
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
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
                      No regions found. Click &quot;Add Region&quot; to create one.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={true}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    noEndBorder
                  />
                )}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete &quot;{rowToDelete?.name}&quot;? This action cannot be
            undone.
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

      {/* Edit Modal Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        aria-labelledby="edit-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="edit-dialog-title">Edit Region</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Name *"
              value={editFormData.name || ""}
              onChange={(e) => handleEditFormChange("name", e.target.value)}
              onBlur={() => setEditFormTouched((prev) => ({ ...prev, name: true }))}
              margin="normal"
              variant="outlined"
              error={editFormTouched.name && !!validateName(editFormData.name)}
              helperText={editFormTouched.name && validateName(editFormData.name)}
            />
            <TextField
              fullWidth
              label="Address *"
              value={editFormData.address || ""}
              onChange={(e) => handleEditFormChange("address", e.target.value)}
              onBlur={() => setEditFormTouched((prev) => ({ ...prev, address: true }))}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              error={editFormTouched.address && !!validateAddress(editFormData.address)}
              helperText={editFormTouched.address && validateAddress(editFormData.address)}
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

      {/* Add Modal Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={handleAddClose}
        aria-labelledby="add-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="add-dialog-title">Add Region</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Name *"
              value={addFormData.name}
              onChange={(e) => handleAddFormChange("name", e.target.value)}
              onBlur={() => setAddFormTouched((prev) => ({ ...prev, name: true }))}
              margin="normal"
              variant="outlined"
              error={addFormTouched.name && !!validateName(addFormData.name)}
              helperText={addFormTouched.name && validateName(addFormData.name)}
            />
            <TextField
              fullWidth
              label="Address *"
              value={addFormData.address}
              onChange={(e) => handleAddFormChange("address", e.target.value)}
              onBlur={() => setAddFormTouched((prev) => ({ ...prev, address: true }))}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              error={addFormTouched.address && !!validateAddress(addFormData.address)}
              helperText={addFormTouched.address && validateAddress(addFormData.address)}
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
    </DashboardLayout>
  );
}

export default Regions;
