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

function Bundles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lookup data
  const [regions, setRegions] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [cloudFamilies, setCloudFamilies] = useState([]);

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
    vcpu: false,
    vram: false,
    region_id: false,
    service_id: false,
    service_type_id: false,
    cloud_family_id: false,
  });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    code: "",
    vcpu: "",
    vram: "",
    region_id: "",
    service_id: "",
    service_type_id: "",
    cloud_family_id: "",
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({
    code: false,
    vcpu: false,
    vram: false,
    region_id: false,
    service_id: false,
    service_type_id: false,
    cloud_family_id: false,
  });

  async function fetchLookupData() {
    try {
      const [regionsRes, servicesRes, serviceTypesRes, cloudFamiliesRes] = await Promise.all([
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service_type").select("id, name").eq("is_active", true).order("name"),
        supabase.from("cloud_family").select("id, code").eq("is_active", true).order("code"),
      ]);

      if (regionsRes.error) throw regionsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (serviceTypesRes.error) throw serviceTypesRes.error;
      if (cloudFamiliesRes.error) throw cloudFamiliesRes.error;

      setRegions(regionsRes.data || []);
      setServices(servicesRes.data || []);
      setServiceTypes(serviceTypesRes.data || []);
      setCloudFamilies(cloudFamiliesRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("bundles")
        .select(
          `
          *,
          region:region!bundles_region-id_fkey(id, name),
          service:service(id, name),
          service_type:service_type(id, name),
          cloud_family:cloud_family(id, code)
        `
        )
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
        .from("bundles")
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
      vcpu: row.vcpu?.toString() || "",
      vram: row.vram?.toString() || "",
      region_id: row["region-id"] || "",
      service_id: row.service_id || "",
      service_type_id: row.service_type_id || "",
      cloud_family_id: row.cloud_family_id || "",
    });
    setEditFormTouched({
      code: false,
      vcpu: false,
      vram: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      cloud_family_id: false,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({
      code: false,
      vcpu: false,
      vram: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      cloud_family_id: false,
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
        vcpu: parseInt(editFormData.vcpu, 10),
        vram: parseInt(editFormData.vram, 10),
        "region-id": editFormData.region_id,
        service_id: editFormData.service_id,
        service_type_id: editFormData.service_type_id,
        cloud_family_id: editFormData.cloud_family_id,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      };

      const { error: updateError } = await supabase.from("bundles").update(updateData).eq("id", editingRow.id);

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
      vcpu: "",
      vram: "",
      region_id: "",
      service_id: "",
      service_type_id: "",
      cloud_family_id: "",
    });
    setAddFormTouched({
      code: false,
      vcpu: false,
      vram: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      cloud_family_id: false,
    });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      code: "",
      vcpu: "",
      vram: "",
      region_id: "",
      service_id: "",
      service_type_id: "",
      cloud_family_id: "",
    });
    setAddFormTouched({
      code: false,
      vcpu: false,
      vram: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      cloud_family_id: false,
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
        vcpu: parseInt(addFormData.vcpu, 10),
        vram: parseInt(addFormData.vram, 10),
        "region-id": addFormData.region_id,
        service_id: addFormData.service_id,
        service_type_id: addFormData.service_type_id,
        cloud_family_id: addFormData.cloud_family_id,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("bundles").insert(insertData);

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
    if (code.trim().length < 3) {
      return "Code must be at least 3 characters long";
    }
    return "";
  };

  const validateVcpu = (vcpu) => {
    if (!vcpu || vcpu.toString().trim().length === 0) {
      return "vCPU is required";
    }
    const num = parseInt(vcpu, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "vCPU must be a positive integer";
    }
    return "";
  };

  const validateVram = (vram) => {
    if (!vram || vram.toString().trim().length === 0) {
      return "vRAM is required";
    }
    const num = parseInt(vram, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "vRAM must be a positive integer";
    }
    return "";
  };

  const validateRegionId = (regionId) => {
    if (!regionId) {
      return "Region is required";
    }
    return "";
  };

  const validateServiceId = (serviceId) => {
    if (!serviceId) {
      return "Service is required";
    }
    return "";
  };

  const validateServiceTypeId = (serviceTypeId) => {
    if (!serviceTypeId) {
      return "Service Type is required";
    }
    return "";
  };

  const validateCloudFamilyId = (cloudFamilyId) => {
    if (!cloudFamilyId) {
      return "Cloud Family is required";
    }
    return "";
  };

  const isAddFormValid = () => {
    return (
      !validateCode(addFormData.code) &&
      !validateVcpu(addFormData.vcpu) &&
      !validateVram(addFormData.vram) &&
      !validateRegionId(addFormData.region_id) &&
      !validateServiceId(addFormData.service_id) &&
      !validateServiceTypeId(addFormData.service_type_id) &&
      !validateCloudFamilyId(addFormData.cloud_family_id)
    );
  };

  const isEditFormValid = () => {
    return (
      !validateCode(editFormData.code) &&
      !validateVcpu(editFormData.vcpu) &&
      !validateVram(editFormData.vram) &&
      !validateRegionId(editFormData.region_id) &&
      !validateServiceId(editFormData.service_id) &&
      !validateServiceTypeId(editFormData.service_type_id) &&
      !validateCloudFamilyId(editFormData.cloud_family_id)
    );
  };

  // Define columns for DataTable
  const columns = [
    { Header: "code", accessor: "code", width: "12%", align: "left" },
    { Header: "vcpu", accessor: "vcpu", width: "8%", align: "center" },
    { Header: "vram", accessor: "vram", width: "8%", align: "center" },
    { Header: "region", accessor: "region_name", width: "12%", align: "left" },
    { Header: "service", accessor: "service_name", width: "12%", align: "left" },
    { Header: "service type", accessor: "service_type_name", width: "14%", align: "left" },
    { Header: "cloud family", accessor: "cloud_family_name", width: "12%", align: "left" },
    { Header: "actions", accessor: "actions", width: "12%", align: "center" },
  ];

  // Transform data to rows format for DataTable
  const rows = data.map((row) => ({
    code: (
      <MDTypography variant="button" fontWeight="medium">
        {row.code || "-"}
      </MDTypography>
    ),
    vcpu: (
      <MDTypography variant="caption" color="text">
        {row.vcpu || "-"}
      </MDTypography>
    ),
    vram: (
      <MDTypography variant="caption" color="text">
        {row.vram || "-"}
      </MDTypography>
    ),
    region_name: (
      <MDTypography variant="caption" color="text">
        {row.region?.name || "-"}
      </MDTypography>
    ),
    service_name: (
      <MDTypography variant="caption" color="text">
        {row.service?.name || "-"}
      </MDTypography>
    ),
    service_type_name: (
      <MDTypography variant="caption" color="text">
        {row.service_type?.name || "-"}
      </MDTypography>
    ),
    cloud_family_name: (
      <MDTypography variant="caption" color="text">
        {row.cloud_family?.code || "-"}
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
                  Bundles
                </MDTypography>
                <MDButton variant="gradient" color="light" size="small" onClick={handleAddClick}>
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Bundle
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
                      No bundles found. Click &quot;Add Bundle&quot; to create one.
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
            Are you sure you want to delete bundle &quot;{rowToDelete?.code}&quot;? This action cannot be undone.
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
      <Dialog open={editDialogOpen} onClose={handleEditClose} aria-labelledby="edit-dialog-title" maxWidth="sm" fullWidth>
        <DialogTitle id="edit-dialog-title">Edit Bundle</DialogTitle>
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="vCPU *"
                  type="number"
                  value={editFormData.vcpu || ""}
                  onChange={(e) => handleEditFormChange("vcpu", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, vcpu: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.vcpu && !!validateVcpu(editFormData.vcpu)}
                  helperText={editFormTouched.vcpu && validateVcpu(editFormData.vcpu)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="vRAM (GB) *"
                  type="number"
                  value={editFormData.vram || ""}
                  onChange={(e) => handleEditFormChange("vram", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, vram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.vram && !!validateVram(editFormData.vram)}
                  helperText={editFormTouched.vram && validateVram(editFormData.vram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
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
            <FormControl
              fullWidth
              margin="normal"
              error={editFormTouched.service_id && !!validateServiceId(editFormData.service_id)}
            >
              <InputLabel>Service *</InputLabel>
              <Select
                value={editFormData.service_id || ""}
                onChange={(e) => handleEditFormChange("service_id", e.target.value)}
                onBlur={() => setEditFormTouched((prev) => ({ ...prev, service_id: true }))}
                label="Service *"
                sx={{ minHeight: 44 }}
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
              {editFormTouched.service_id && validateServiceId(editFormData.service_id) && (
                <FormHelperText>{validateServiceId(editFormData.service_id)}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              margin="normal"
              error={editFormTouched.service_type_id && !!validateServiceTypeId(editFormData.service_type_id)}
            >
              <InputLabel>Service Type *</InputLabel>
              <Select
                value={editFormData.service_type_id || ""}
                onChange={(e) => handleEditFormChange("service_type_id", e.target.value)}
                onBlur={() => setEditFormTouched((prev) => ({ ...prev, service_type_id: true }))}
                label="Service Type *"
                sx={{ minHeight: 44 }}
              >
                {serviceTypes.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))}
              </Select>
              {editFormTouched.service_type_id && validateServiceTypeId(editFormData.service_type_id) && (
                <FormHelperText>{validateServiceTypeId(editFormData.service_type_id)}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              margin="normal"
              error={editFormTouched.cloud_family_id && !!validateCloudFamilyId(editFormData.cloud_family_id)}
            >
              <InputLabel>Cloud Family *</InputLabel>
              <Select
                value={editFormData.cloud_family_id || ""}
                onChange={(e) => handleEditFormChange("cloud_family_id", e.target.value)}
                onBlur={() => setEditFormTouched((prev) => ({ ...prev, cloud_family_id: true }))}
                label="Cloud Family *"
                sx={{ minHeight: 44 }}
              >
                {cloudFamilies.map((cf) => (
                  <MenuItem key={cf.id} value={cf.id}>
                    {cf.code}
                  </MenuItem>
                ))}
              </Select>
              {editFormTouched.cloud_family_id && validateCloudFamilyId(editFormData.cloud_family_id) && (
                <FormHelperText>{validateCloudFamilyId(editFormData.cloud_family_id)}</FormHelperText>
              )}
            </FormControl>
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
      <Dialog open={addDialogOpen} onClose={handleAddClose} aria-labelledby="add-dialog-title" maxWidth="sm" fullWidth>
        <DialogTitle id="add-dialog-title">Add Bundle</DialogTitle>
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
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="vCPU *"
                  type="number"
                  value={addFormData.vcpu}
                  onChange={(e) => handleAddFormChange("vcpu", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, vcpu: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.vcpu && !!validateVcpu(addFormData.vcpu)}
                  helperText={addFormTouched.vcpu && validateVcpu(addFormData.vcpu)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="vRAM (GB) *"
                  type="number"
                  value={addFormData.vram}
                  onChange={(e) => handleAddFormChange("vram", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, vram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.vram && !!validateVram(addFormData.vram)}
                  helperText={addFormTouched.vram && validateVram(addFormData.vram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
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
            <FormControl
              fullWidth
              margin="normal"
              error={addFormTouched.service_id && !!validateServiceId(addFormData.service_id)}
            >
              <InputLabel>Service *</InputLabel>
              <Select
                value={addFormData.service_id || ""}
                onChange={(e) => handleAddFormChange("service_id", e.target.value)}
                onBlur={() => setAddFormTouched((prev) => ({ ...prev, service_id: true }))}
                label="Service *"
                sx={{ minHeight: 44 }}
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </Select>
              {addFormTouched.service_id && validateServiceId(addFormData.service_id) && (
                <FormHelperText>{validateServiceId(addFormData.service_id)}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              margin="normal"
              error={addFormTouched.service_type_id && !!validateServiceTypeId(addFormData.service_type_id)}
            >
              <InputLabel>Service Type *</InputLabel>
              <Select
                value={addFormData.service_type_id || ""}
                onChange={(e) => handleAddFormChange("service_type_id", e.target.value)}
                onBlur={() => setAddFormTouched((prev) => ({ ...prev, service_type_id: true }))}
                label="Service Type *"
                sx={{ minHeight: 44 }}
              >
                {serviceTypes.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))}
              </Select>
              {addFormTouched.service_type_id && validateServiceTypeId(addFormData.service_type_id) && (
                <FormHelperText>{validateServiceTypeId(addFormData.service_type_id)}</FormHelperText>
              )}
            </FormControl>
            <FormControl
              fullWidth
              margin="normal"
              error={addFormTouched.cloud_family_id && !!validateCloudFamilyId(addFormData.cloud_family_id)}
            >
              <InputLabel>Cloud Family *</InputLabel>
              <Select
                value={addFormData.cloud_family_id || ""}
                onChange={(e) => handleAddFormChange("cloud_family_id", e.target.value)}
                onBlur={() => setAddFormTouched((prev) => ({ ...prev, cloud_family_id: true }))}
                label="Cloud Family *"
                sx={{ minHeight: 44 }}
              >
                {cloudFamilies.map((cf) => (
                  <MenuItem key={cf.id} value={cf.id}>
                    {cf.code}
                  </MenuItem>
                ))}
              </Select>
              {addFormTouched.cloud_family_id && validateCloudFamilyId(addFormData.cloud_family_id) && (
                <FormHelperText>{validateCloudFamilyId(addFormData.cloud_family_id)}</FormHelperText>
              )}
            </FormControl>
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

export default Bundles;
