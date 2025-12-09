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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";

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

function Clouds() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lookup data
  const [regions, setRegions] = useState([]);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [editFormTouched, setEditFormTouched] = useState({
    code: false,
    region_id: false,
    cpu_model: false,
    sockets: false,
    pcpu: false,
    pram: false,
    clockspeed: false,
    networkbw: false,
    description: false,
  });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    code: "",
    region_id: "",
    cpu_model: "",
    sockets: "",
    pcpu: "",
    pram: "",
    clockspeed: "",
    networkbw: "",
    description: "",
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({
    code: false,
    region_id: false,
    cpu_model: false,
    sockets: false,
    pcpu: false,
    pram: false,
    clockspeed: false,
    networkbw: false,
    description: false,
  });

  async function fetchLookupData() {
    try {
      const { data: regionsData, error: regionsError } = await supabase
        .from("region")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (regionsError) throw regionsError;

      setRegions(regionsData || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("cloud_family")
        .select(`
          *,
          region:region(id, name)
        `)
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
    fetchLookupData();
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
        .from("cloud_family")
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
      code: row.code || "",
      region_id: row.region_id || "",
      cpu_model: row.cpu_model || "",
      sockets: row.sockets?.toString() || "",
      pcpu: row.pcpu?.toString() || "",
      pram: row.pram?.toString() || "",
      clockspeed: row.clockspeed?.toString() || "",
      networkbw: row.networkbw?.toString() || "",
      description: row.description || "",
    });
    setEditFormTouched({
      code: false,
      region_id: false,
      cpu_model: false,
      sockets: false,
      pcpu: false,
      pram: false,
      clockspeed: false,
      networkbw: false,
      description: false,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({
      code: false,
      region_id: false,
      cpu_model: false,
      sockets: false,
      pcpu: false,
      pram: false,
      clockspeed: false,
      networkbw: false,
      description: false,
    });
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
        code: editFormData.code,
        region_id: editFormData.region_id,
        cpu_model: editFormData.cpu_model || null,
        sockets: parseInt(editFormData.sockets, 10),
        pcpu: parseInt(editFormData.pcpu, 10),
        pram: parseInt(editFormData.pram, 10),
        clockspeed: parseFloat(editFormData.clockspeed),
        networkbw: parseInt(editFormData.networkbw, 10),
        description: editFormData.description,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      };

      const { error: updateError } = await supabase
        .from("cloud_family")
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
      code: "",
      region_id: "",
      cpu_model: "",
      sockets: "",
      pcpu: "",
      pram: "",
      clockspeed: "",
      networkbw: "",
      description: "",
    });
    setAddFormTouched({
      code: false,
      region_id: false,
      cpu_model: false,
      sockets: false,
      pcpu: false,
      pram: false,
      clockspeed: false,
      networkbw: false,
      description: false,
    });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      code: "",
      region_id: "",
      cpu_model: "",
      sockets: "",
      pcpu: "",
      pram: "",
      clockspeed: "",
      networkbw: "",
      description: "",
    });
    setAddFormTouched({
      code: false,
      region_id: false,
      cpu_model: false,
      sockets: false,
      pcpu: false,
      pram: false,
      clockspeed: false,
      networkbw: false,
      description: false,
    });
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
        code: addFormData.code,
        region_id: addFormData.region_id,
        cpu_model: addFormData.cpu_model || null,
        sockets: parseInt(addFormData.sockets, 10),
        pcpu: parseInt(addFormData.pcpu, 10),
        pram: parseInt(addFormData.pram, 10),
        clockspeed: parseFloat(addFormData.clockspeed),
        networkbw: parseInt(addFormData.networkbw, 10),
        description: addFormData.description,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("cloud_family").insert(insertData);

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
  const validateCode = (code) => {
    if (!code || code.trim().length === 0) {
      return "Code is required";
    }
    if (code.trim().length < 2) {
      return "Code must be at least 2 characters long";
    }
    return "";
  };

  const validateRegionId = (regionId) => {
    if (!regionId) {
      return "Region is required";
    }
    return "";
  };

  const validateSockets = (sockets) => {
    if (!sockets || sockets.toString().trim().length === 0) {
      return "Sockets is required";
    }
    const num = parseInt(sockets, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "Sockets must be a positive integer";
    }
    return "";
  };

  const validatePcpu = (pcpu) => {
    if (!pcpu || pcpu.toString().trim().length === 0) {
      return "pCPU is required";
    }
    const num = parseInt(pcpu, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "pCPU must be a positive integer";
    }
    return "";
  };

  const validatePram = (pram) => {
    if (!pram || pram.toString().trim().length === 0) {
      return "pRAM is required";
    }
    const num = parseInt(pram, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "pRAM must be a positive integer";
    }
    return "";
  };

  const validateClockspeed = (clockspeed) => {
    if (!clockspeed || clockspeed.toString().trim().length === 0) {
      return "Clock Speed is required";
    }
    const num = parseFloat(clockspeed);
    if (Number.isNaN(num) || num <= 0) {
      return "Clock Speed must be a positive number";
    }
    // Check format: max 3 digits before decimal, max 2 after (e.g., 999.99)
    const regex = /^\d{1,3}(\.\d{1,2})?$/;
    if (!regex.test(clockspeed.toString().trim())) {
      return "Clock Speed format: up to 3 digits before decimal, up to 2 after (e.g., 3.50)";
    }
    return "";
  };

  const validateNetworkbw = (networkbw) => {
    if (!networkbw || networkbw.toString().trim().length === 0) {
      return "Network BW is required";
    }
    const num = parseInt(networkbw, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "Network BW must be a positive integer";
    }
    return "";
  };

  const validateDescription = (description) => {
    if (!description || description.trim().length === 0) {
      return "Description is required";
    }
    return "";
  };

  const isAddFormValid = () => {
    return (
      !validateCode(addFormData.code) &&
      !validateRegionId(addFormData.region_id) &&
      !validateSockets(addFormData.sockets) &&
      !validatePcpu(addFormData.pcpu) &&
      !validatePram(addFormData.pram) &&
      !validateClockspeed(addFormData.clockspeed) &&
      !validateNetworkbw(addFormData.networkbw) &&
      !validateDescription(addFormData.description)
    );
  };

  const isEditFormValid = () => {
    return (
      !validateCode(editFormData.code) &&
      !validateRegionId(editFormData.region_id) &&
      !validateSockets(editFormData.sockets) &&
      !validatePcpu(editFormData.pcpu) &&
      !validatePram(editFormData.pram) &&
      !validateClockspeed(editFormData.clockspeed) &&
      !validateNetworkbw(editFormData.networkbw) &&
      !validateDescription(editFormData.description)
    );
  };

  // Define columns for DataTable
  const columns = [
    { Header: "code", accessor: "code", width: "10%", align: "left" },
    { Header: "region", accessor: "region", width: "12%", align: "left" },
    { Header: "cpu model", accessor: "cpu_model", width: "12%", align: "left" },
    { Header: "sockets", accessor: "sockets", width: "6%", align: "center" },
    { Header: "pcpu", accessor: "pcpu", width: "6%", align: "center" },
    { Header: "pram", accessor: "pram", width: "6%", align: "center" },
    { Header: "clock (GHz)", accessor: "clockspeed", width: "8%", align: "center" },
    { Header: "network bw", accessor: "networkbw", width: "8%", align: "center" },
    { Header: "description", accessor: "description", width: "18%", align: "left" },
    { Header: "actions", accessor: "actions", width: "14%", align: "center" },
  ];

  // Transform data to rows format for DataTable
  const rows = data.map((row) => ({
    code: (
      <MDTypography variant="button" fontWeight="medium">
        {row.code || "-"}
      </MDTypography>
    ),
    region: (
      <MDTypography variant="caption" color="text">
        {row.region?.name || "-"}
      </MDTypography>
    ),
    cpu_model: (
      <MDTypography variant="caption" color="text">
        {row.cpu_model || "-"}
      </MDTypography>
    ),
    sockets: (
      <MDTypography variant="caption" color="text">
        {row.sockets || "-"}
      </MDTypography>
    ),
    pcpu: (
      <MDTypography variant="caption" color="text">
        {row.pcpu || "-"}
      </MDTypography>
    ),
    pram: (
      <MDTypography variant="caption" color="text">
        {row.pram || "-"}
      </MDTypography>
    ),
    clockspeed: (
      <MDTypography variant="caption" color="text">
        {row.clockspeed || "-"}
      </MDTypography>
    ),
    networkbw: (
      <MDTypography variant="caption" color="text">
        {row.networkbw || "-"}
      </MDTypography>
    ),
    description: (
      <MDTypography variant="caption" color="text">
        {row.description || "-"}
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
                  Cloud Families
                </MDTypography>
                <MDButton variant="gradient" color="light" size="small" onClick={handleAddClick}>
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Cloud Family
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
                      No cloud families found. Click &quot;Add Cloud Family&quot; to create one.
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
            Are you sure you want to delete cloud family &quot;{rowToDelete?.code}&quot;? This
            action cannot be undone.
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
        <DialogTitle id="edit-dialog-title">Edit Cloud Family</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Code *"
              value={editFormData.code || ""}
              onChange={(e) => handleEditFormChange("code", e.target.value)}
              onBlur={() => setEditFormTouched((prev) => ({ ...prev, code: true }))}
              margin="normal"
              variant="outlined"
              error={editFormTouched.code && !!validateCode(editFormData.code)}
              helperText={editFormTouched.code && validateCode(editFormData.code)}
            />
            <FormControl
              fullWidth
              margin="normal"
              error={editFormTouched.region_id && !!validateRegionId(editFormData.region_id)}
            >
              <InputLabel>Region *</InputLabel>
              <Select
                value={editFormData.region_id || ""}
                onChange={(e) => handleEditFormChange("region_id", e.target.value)}
                onBlur={() => setEditFormTouched((prev) => ({ ...prev, region_id: true }))}
                label="Region *"
                sx={{ minHeight: 44 }}
              >
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
              {editFormTouched.region_id && validateRegionId(editFormData.region_id) && (
                <FormHelperText>{validateRegionId(editFormData.region_id)}</FormHelperText>
              )}
            </FormControl>
            <TextField
              fullWidth
              label="CPU Model"
              value={editFormData.cpu_model || ""}
              onChange={(e) => handleEditFormChange("cpu_model", e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Sockets *"
                  type="number"
                  value={editFormData.sockets || ""}
                  onChange={(e) => handleEditFormChange("sockets", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, sockets: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.sockets && !!validateSockets(editFormData.sockets)}
                  helperText={editFormTouched.sockets && validateSockets(editFormData.sockets)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="pCPU *"
                  type="number"
                  value={editFormData.pcpu || ""}
                  onChange={(e) => handleEditFormChange("pcpu", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, pcpu: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.pcpu && !!validatePcpu(editFormData.pcpu)}
                  helperText={editFormTouched.pcpu && validatePcpu(editFormData.pcpu)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="pRAM (GB) *"
                  type="number"
                  value={editFormData.pram || ""}
                  onChange={(e) => handleEditFormChange("pram", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, pram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.pram && !!validatePram(editFormData.pram)}
                  helperText={editFormTouched.pram && validatePram(editFormData.pram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Clock Speed (GHz) *"
                  type="number"
                  value={editFormData.clockspeed || ""}
                  onChange={(e) => handleEditFormChange("clockspeed", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, clockspeed: true }))}
                  margin="normal"
                  variant="outlined"
                  error={
                    editFormTouched.clockspeed && !!validateClockspeed(editFormData.clockspeed)
                  }
                  helperText={
                    editFormTouched.clockspeed && validateClockspeed(editFormData.clockspeed)
                  }
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Network BW (Gbps) *"
                  type="number"
                  value={editFormData.networkbw || ""}
                  onChange={(e) => handleEditFormChange("networkbw", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, networkbw: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.networkbw && !!validateNetworkbw(editFormData.networkbw)}
                  helperText={
                    editFormTouched.networkbw && validateNetworkbw(editFormData.networkbw)
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
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
        <DialogTitle id="add-dialog-title">Add Cloud Family</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <TextField
              fullWidth
              label="Code *"
              value={addFormData.code}
              onChange={(e) => handleAddFormChange("code", e.target.value)}
              onBlur={() => setAddFormTouched((prev) => ({ ...prev, code: true }))}
              margin="normal"
              variant="outlined"
              error={addFormTouched.code && !!validateCode(addFormData.code)}
              helperText={addFormTouched.code && validateCode(addFormData.code)}
            />
            <FormControl
              fullWidth
              margin="normal"
              error={addFormTouched.region_id && !!validateRegionId(addFormData.region_id)}
            >
              <InputLabel>Region *</InputLabel>
              <Select
                value={addFormData.region_id || ""}
                onChange={(e) => handleAddFormChange("region_id", e.target.value)}
                onBlur={() => setAddFormTouched((prev) => ({ ...prev, region_id: true }))}
                label="Region *"
                sx={{ minHeight: 44 }}
              >
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
              {addFormTouched.region_id && validateRegionId(addFormData.region_id) && (
                <FormHelperText>{validateRegionId(addFormData.region_id)}</FormHelperText>
              )}
            </FormControl>
            <TextField
              fullWidth
              label="CPU Model"
              value={addFormData.cpu_model}
              onChange={(e) => handleAddFormChange("cpu_model", e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Sockets *"
                  type="number"
                  value={addFormData.sockets}
                  onChange={(e) => handleAddFormChange("sockets", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, sockets: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.sockets && !!validateSockets(addFormData.sockets)}
                  helperText={addFormTouched.sockets && validateSockets(addFormData.sockets)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="pCPU *"
                  type="number"
                  value={addFormData.pcpu}
                  onChange={(e) => handleAddFormChange("pcpu", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, pcpu: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.pcpu && !!validatePcpu(addFormData.pcpu)}
                  helperText={addFormTouched.pcpu && validatePcpu(addFormData.pcpu)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="pRAM (GB) *"
                  type="number"
                  value={addFormData.pram}
                  onChange={(e) => handleAddFormChange("pram", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, pram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.pram && !!validatePram(addFormData.pram)}
                  helperText={addFormTouched.pram && validatePram(addFormData.pram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Clock Speed (GHz) *"
                  type="number"
                  value={addFormData.clockspeed}
                  onChange={(e) => handleAddFormChange("clockspeed", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, clockspeed: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.clockspeed && !!validateClockspeed(addFormData.clockspeed)}
                  helperText={
                    addFormTouched.clockspeed && validateClockspeed(addFormData.clockspeed)
                  }
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Network BW (Gbps) *"
                  type="number"
                  value={addFormData.networkbw}
                  onChange={(e) => handleAddFormChange("networkbw", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, networkbw: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.networkbw && !!validateNetworkbw(addFormData.networkbw)}
                  helperText={addFormTouched.networkbw && validateNetworkbw(addFormData.networkbw)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
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

export default Clouds;
