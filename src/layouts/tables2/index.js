import { useState, useEffect, useRef } from "react";

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

function Services() {
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
  const [editFormTouched, setEditFormTouched] = useState({ name: false, description: false });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    illustration: null,
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({ name: false, description: false });

  // Image upload refs
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Image preview state
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Image view modal state
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [imageViewUrl, setImageViewUrl] = useState(null);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("service")
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  // Convert base64 to bytea hex format for Supabase
  const base64ToBytea = (base64String) => {
    const base64Data = base64String.includes(",") ? base64String.split(",")[1] : base64String;
    const binaryString = atob(base64Data);
    let hex = "\\x";
    for (let i = 0; i < binaryString.length; i++) {
      const hexByte = binaryString.charCodeAt(i).toString(16).padStart(2, "0");
      hex += hexByte;
    }
    return hex;
  };

  // Convert bytea hex to base64 data URL for display
  const byteaToDataUrl = (byteaData) => {
    if (!byteaData) return null;
    try {
      let hexString = byteaData;
      if (typeof byteaData === "string" && byteaData.startsWith("\\x")) {
        hexString = byteaData.slice(2);
      }
      const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
      let binary = "";
      bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
      });
      const base64 = btoa(binary);
      let mimeType = "image/png";
      if (hexString.startsWith("ffd8ff")) {
        mimeType = "image/jpeg";
      } else if (hexString.startsWith("89504e47")) {
        mimeType = "image/png";
      } else if (hexString.startsWith("47494638")) {
        mimeType = "image/gif";
      }
      return `data:${mimeType};base64,${base64}`;
    } catch (err) {
      console.error("Error converting bytea to data URL:", err);
      return null;
    }
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
        .from("service")
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
      description: row.description || "",
      illustration: row.illustration,
    });
    setEditFormTouched({ name: false, description: false });
    if (row.illustration) {
      setEditImagePreview(byteaToDataUrl(row.illustration));
    } else {
      setEditImagePreview(null);
    }
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditImagePreview(null);
    setEditFormTouched({ name: false, description: false });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setEditImagePreview(base64);
      const bytea = base64ToBytea(base64);
      handleEditFormChange("illustration", bytea);
    }
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      const updateData = {
        name: editFormData.name,
        description: editFormData.description,
        illustration: editFormData.illustration,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      };

      const { error: updateError } = await supabase
        .from("service")
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
      description: "",
      illustration: null,
    });
    setAddFormTouched({ name: false, description: false });
    setAddImagePreview(null);
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      name: "",
      description: "",
      illustration: null,
    });
    setAddImagePreview(null);
    setAddFormTouched({ name: false, description: false });
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setAddImagePreview(base64);
      const bytea = base64ToBytea(base64);
      handleAddFormChange("illustration", bytea);
    }
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);
      const insertData = {
        name: addFormData.name,
        description: addFormData.description,
        illustration: addFormData.illustration,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("service").insert(insertData);

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

  // Image view handlers
  const handleImageClick = (illustration) => {
    const dataUrl = byteaToDataUrl(illustration);
    if (dataUrl) {
      setImageViewUrl(dataUrl);
      setImageViewOpen(true);
    }
  };

  const handleImageViewClose = () => {
    setImageViewOpen(false);
    setImageViewUrl(null);
  };

  // Validation helpers
  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Name is required";
    }
    if (name.trim().length < 5) {
      return "Name must be at least 5 characters long";
    }
    return "";
  };

  const validateDescription = (description) => {
    if (!description || description.trim().length === 0) {
      return "Description is required";
    }
    if (description.trim().length < 10) {
      return "Description must be at least 10 characters long";
    }
    return "";
  };

  const isAddFormValid = () => {
    return !validateName(addFormData.name) && !validateDescription(addFormData.description);
  };

  const isEditFormValid = () => {
    return !validateName(editFormData.name) && !validateDescription(editFormData.description);
  };

  // Define columns for DataTable
  const columns = [
    { Header: "name", accessor: "name", width: "20%", align: "left" },
    { Header: "description", accessor: "description", width: "45%", align: "left" },
    { Header: "illustration", accessor: "illustration", width: "15%", align: "center" },
    { Header: "actions", accessor: "actions", width: "20%", align: "center" },
  ];

  // Transform data to rows format for DataTable
  const rows = data.map((row) => ({
    name: (
      <MDTypography variant="button" fontWeight="medium">
        {row.name || "-"}
      </MDTypography>
    ),
    description: (
      <MDTypography variant="caption" color="text">
        {row.description || "-"}
      </MDTypography>
    ),
    illustration: row.illustration ? (
      <IconButton
        size="small"
        onClick={() => handleImageClick(row.illustration)}
        title="View image"
        sx={{
          color: "info.main",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.2)",
            backgroundColor: "rgba(26, 115, 232, 0.1)",
          },
        }}
      >
        <Icon>image</Icon>
      </IconButton>
    ) : (
      <MDTypography variant="caption" color="text">
        -
      </MDTypography>
    ),
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
                  Services
                </MDTypography>
                <MDButton variant="gradient" color="light" size="small" onClick={handleAddClick}>
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Service
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
                      No services found. Click &quot;Add Service&quot; to create one.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={false}
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
        <DialogTitle id="edit-dialog-title">Edit Service</DialogTitle>
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
              label="Description *"
              value={editFormData.description || ""}
              onChange={(e) => handleEditFormChange("description", e.target.value)}
              onBlur={() => setEditFormTouched((prev) => ({ ...prev, description: true }))}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              error={editFormTouched.description && !!validateDescription(editFormData.description)}
              helperText={
                editFormTouched.description && validateDescription(editFormData.description)
              }
            />
            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" fontWeight="medium">
                Illustration
              </MDTypography>
              <MDBox
                mt={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
                p={2}
                sx={{ border: "1px dashed #ccc", borderRadius: 2 }}
              >
                {editImagePreview && (
                  <MDBox
                    component="img"
                    src={editImagePreview}
                    alt="Preview"
                    sx={{ maxWidth: "100%", maxHeight: 150, objectFit: "contain", borderRadius: 1 }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={editFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleEditImageChange}
                />
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  onClick={() => editFileInputRef.current?.click()}
                >
                  <Icon sx={{ mr: 1 }}>upload</Icon>
                  {editImagePreview ? "Change Image" : "Upload Image"}
                </MDButton>
              </MDBox>
            </MDBox>
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
        <DialogTitle id="add-dialog-title">Add Service</DialogTitle>
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
              label="Description *"
              value={addFormData.description}
              onChange={(e) => handleAddFormChange("description", e.target.value)}
              onBlur={() => setAddFormTouched((prev) => ({ ...prev, description: true }))}
              margin="normal"
              variant="outlined"
              multiline
              rows={3}
              error={addFormTouched.description && !!validateDescription(addFormData.description)}
              helperText={
                addFormTouched.description && validateDescription(addFormData.description)
              }
            />
            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" fontWeight="medium">
                Illustration
              </MDTypography>
              <MDBox
                mt={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
                p={2}
                sx={{ border: "1px dashed #ccc", borderRadius: 2 }}
              >
                {addImagePreview && (
                  <MDBox
                    component="img"
                    src={addImagePreview}
                    alt="Preview"
                    sx={{ maxWidth: "100%", maxHeight: 150, objectFit: "contain", borderRadius: 1 }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={addFileInputRef}
                  style={{ display: "none" }}
                  onChange={handleAddImageChange}
                />
                <MDButton
                  variant="outlined"
                  color="info"
                  size="small"
                  onClick={() => addFileInputRef.current?.click()}
                >
                  <Icon sx={{ mr: 1 }}>upload</Icon>
                  {addImagePreview ? "Change Image" : "Upload Image"}
                </MDButton>
              </MDBox>
            </MDBox>
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

      {/* Image View Modal */}
      <Dialog
        open={imageViewOpen}
        onClose={handleImageViewClose}
        maxWidth="md"
        aria-labelledby="image-view-dialog"
      >
        <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center" }}>
          {imageViewUrl && (
            <MDBox
              component="img"
              src={imageViewUrl}
              alt="Illustration"
              sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default Services;
