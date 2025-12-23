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
import DataTable from "examples/Tables/DataTable";

// Supabase client
import { supabase } from "supabaseClient";

function HpcContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [vcpuFilter, setVcpuFilter] = useState("");
  const [vramFilter, setVramFilter] = useState("");

  // Lookup data
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [regions, setRegions] = useState([]);
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
    service_id: false,
    service_type_id: false,
    vcpu: false,
    vram: false,
  });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    code: "",
    service_id: "",
    service_type_id: "",
    cloud_family_id: "",
    vcpu: "",
    vram: "",
    gpu_vendor: "",
    gpu_model: "",
    gpu_count: "",
    gpu_mempry_gb: "",
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({
    code: false,
    service_id: false,
    service_type_id: false,
    vcpu: false,
    vram: false,
  });

  async function fetchLookupData() {
    try {
      const [servicesRes, serviceTypesRes, regionsRes, cloudFamiliesRes] = await Promise.all([
        supabase.from("service").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service_type").select("id, name").eq("is_active", true).order("name"),
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
        supabase
          .from("cloud_family")
          .select("id, code, region:region(name)")
          .eq("is_active", true)
          .order("code"),
      ]);

      // Set data even if some queries fail - don't throw on individual errors
      if (!servicesRes.error) {
        setServices(servicesRes.data || []);
      }
      if (!serviceTypesRes.error) {
        setServiceTypes(serviceTypesRes.data || []);
      }
      if (!regionsRes.error) {
        setRegions(regionsRes.data || []);
      }
      if (!cloudFamiliesRes.error) {
        setCloudFamilies(cloudFamiliesRes.data || []);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("hpcs")
        .select(
          `
          *,
          cloud_family:cloud_family(id, code, region:region(id, name)),
          service:service(id, name),
          service_type:service_type(id, name)
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
        .from("hpcs")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: "admin",
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
      service_id: row.service_id || "",
      service_type_id: row.service_type_id || "",
      cloud_family_id: row.cloud_family_id || "",
      vcpu: row.vcpu?.toString() || "",
      vram: row.vram?.toString() || "",
      gpu_vendor: row.gpu_vendor || "",
      gpu_model: row.gpu_model || "",
      gpu_count: row.gpu_count?.toString() || "",
      gpu_mempry_gb: row.gpu_mempry_gb?.toString() || "",
    });
    setEditFormTouched({
      code: false,
      service_id: false,
      service_type_id: false,
      vcpu: false,
      vram: false,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({
      code: false,
      service_id: false,
      service_type_id: false,
      vcpu: false,
      vram: false,
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
        service_id: editFormData.service_id,
        service_type_id: editFormData.service_type_id,
        cloud_family_id: editFormData.cloud_family_id || null,
        vcpu: editFormData.vcpu ? parseInt(editFormData.vcpu, 10) : null,
        vram: editFormData.vram ? parseInt(editFormData.vram, 10) : null,
        gpu_vendor: editFormData.gpu_vendor || null,
        gpu_model: editFormData.gpu_model || null,
        gpu_count: editFormData.gpu_count ? parseInt(editFormData.gpu_count, 10) : null,
        gpu_mempry_gb: editFormData.gpu_mempry_gb ? parseInt(editFormData.gpu_mempry_gb, 10) : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("hpcs")
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
      service_id: "",
      service_type_id: "",
      cloud_family_id: "",
      vcpu: "",
      vram: "",
      gpu_vendor: "",
      gpu_model: "",
      gpu_count: "",
      gpu_mempry_gb: "",
    });
    setAddFormTouched({
      code: false,
      service_id: false,
      service_type_id: false,
      vcpu: false,
      vram: false,
    });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      code: "",
      service_id: "",
      service_type_id: "",
      cloud_family_id: "",
      vcpu: "",
      vram: "",
      gpu_vendor: "",
      gpu_model: "",
      gpu_count: "",
      gpu_mempry_gb: "",
    });
    setAddFormTouched({
      code: false,
      service_id: false,
      service_type_id: false,
      vcpu: false,
      vram: false,
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
        service_id: addFormData.service_id,
        service_type_id: addFormData.service_type_id,
        cloud_family_id: addFormData.cloud_family_id || null,
        vcpu: addFormData.vcpu ? parseInt(addFormData.vcpu, 10) : null,
        vram: addFormData.vram ? parseInt(addFormData.vram, 10) : null,
        gpu_vendor: addFormData.gpu_vendor || null,
        gpu_model: addFormData.gpu_model || null,
        gpu_count: addFormData.gpu_count ? parseInt(addFormData.gpu_count, 10) : null,
        gpu_mempry_gb: addFormData.gpu_mempry_gb ? parseInt(addFormData.gpu_mempry_gb, 10) : null,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("hpcs").insert(insertData);

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

  const isAddFormValid = () => {
    return (
      !validateCode(addFormData.code) &&
      !validateServiceId(addFormData.service_id) &&
      !validateServiceTypeId(addFormData.service_type_id) &&
      !validateVcpu(addFormData.vcpu) &&
      !validateVram(addFormData.vram)
    );
  };

  const isEditFormValid = () => {
    return (
      !validateCode(editFormData.code) &&
      !validateServiceId(editFormData.service_id) &&
      !validateServiceTypeId(editFormData.service_type_id) &&
      !validateVcpu(editFormData.vcpu) &&
      !validateVram(editFormData.vram)
    );
  };

  // Filter data based on search term, region filter, vcpu filter, and vram filter
  const filteredData = data.filter((row) => {
    // Apply region filter (region comes from cloud_family now)
    if (regionFilter && row.cloud_family?.region?.id !== regionFilter) {
      return false;
    }

    // Apply vcpu filter
    if (vcpuFilter) {
      const vcpuValue = parseInt(vcpuFilter, 10);
      if (!Number.isNaN(vcpuValue) && row.vcpu !== vcpuValue) {
        return false;
      }
    }

    // Apply vram filter
    if (vramFilter) {
      const vramValue = parseInt(vramFilter, 10);
      if (!Number.isNaN(vramValue) && row.vram !== vramValue) {
        return false;
      }
    }

    // Then apply search filter
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.code && row.code.toLowerCase().includes(search)) ||
      (row.gpu_model && row.gpu_model.toLowerCase().includes(search)) ||
      (row.gpu_vendor && row.gpu_vendor.toLowerCase().includes(search)) ||
      (row.vcpu && row.vcpu.toString().includes(search)) ||
      (row.vram && row.vram.toString().includes(search)) ||
      (row.cloud_family?.region?.name && row.cloud_family.region.name.toLowerCase().includes(search)) ||
      (row.service?.name && row.service.name.toLowerCase().includes(search)) ||
      (row.service_type?.name && row.service_type.name.toLowerCase().includes(search))
    );
  });

  // Define columns for DataTable
  const columns = [
    {
      Header: "code",
      accessor: "code",
      width: "15%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.code_raw || "";
        const b = rowB.original.code_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "region",
      accessor: "region_name",
      width: "10%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.region_raw || "";
        const b = rowB.original.region_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "vcpu",
      accessor: "vcpu",
      width: "8%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.vcpu_raw || 0;
        const b = rowB.original.vcpu_raw || 0;
        return a - b;
      },
    },
    {
      Header: "vram",
      accessor: "vram",
      width: "8%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.vram_raw || 0;
        const b = rowB.original.vram_raw || 0;
        return a - b;
      },
    },
    {
      Header: "gpu",
      accessor: "gpu_info",
      width: "15%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.gpu_model_raw || "";
        const b = rowB.original.gpu_model_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "service",
      accessor: "service_name",
      width: "12%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.service_raw || "";
        const b = rowB.original.service_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "service type",
      accessor: "service_type_name",
      width: "12%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.service_type_raw || "";
        const b = rowB.original.service_type_raw || "";
        return a.localeCompare(b);
      },
    },
    { Header: "actions", accessor: "actions", width: "10%", align: "center", disableSortBy: true },
  ];

  // Transform data to rows format for DataTable
  const rows = filteredData.map((row) => ({
    id: row.id,
    code: (
      <MDTypography variant="button" fontWeight="medium">
        {row.code || "-"}
      </MDTypography>
    ),
    code_raw: row.code || "",
    region_name: (
      <MDTypography variant="caption" color="text">
        {row.cloud_family?.region?.name || "-"}
      </MDTypography>
    ),
    region_raw: row.cloud_family?.region?.name || "",
    vcpu: (
      <MDTypography variant="caption" color="text">
        {row.vcpu || "-"}
      </MDTypography>
    ),
    vcpu_raw: row.vcpu || 0,
    vram: (
      <MDTypography variant="caption" color="text">
        {row.vram || "-"}
      </MDTypography>
    ),
    vram_raw: row.vram || 0,
    gpu_info: (
      <MDTypography variant="caption" color="text">
        {row.gpu_count && row.gpu_model
          ? `${row.gpu_count}x ${row.gpu_model}`
          : row.gpu_model || "-"}
      </MDTypography>
    ),
    gpu_model_raw: row.gpu_model || "",
    service_name: (
      <MDTypography variant="caption" color="text">
        {row.service?.name || "-"}
      </MDTypography>
    ),
    service_raw: row.service?.name || "",
    service_type_name: (
      <MDTypography variant="caption" color="text">
        {row.service_type?.name || "-"}
      </MDTypography>
    ),
    service_type_raw: row.service_type?.name || "",
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
    <>
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDBox display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search HPC..."
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              displayEmpty
              sx={{ minHeight: 40 }}
            >
              <MenuItem value="">Any Region</MenuItem>
              {regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>
                  {region.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            placeholder="vCPU"
            size="small"
            type="number"
            value={vcpuFilter}
            onChange={(e) => setVcpuFilter(e.target.value)}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: vcpuFilter && (
                <IconButton size="small" onClick={() => setVcpuFilter("")} sx={{ p: 0.5 }}>
                  <Icon sx={{ fontSize: "1rem !important" }}>close</Icon>
                </IconButton>
              ),
            }}
          />
          <TextField
            placeholder="vRAM"
            size="small"
            type="number"
            value={vramFilter}
            onChange={(e) => setVramFilter(e.target.value)}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: vramFilter && (
                <IconButton size="small" onClick={() => setVramFilter("")} sx={{ p: 0.5 }}>
                  <Icon sx={{ fontSize: "1rem !important" }}>close</Icon>
                </IconButton>
              ),
            }}
          />
        </MDBox>
        <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Add HPC
        </MDButton>
      </MDBox>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <MDBox pt={2}>
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
                    No HPC entries found. Click &quot;Add HPC&quot; to create one.
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
                />
              )}
            </MDBox>
          </Card>
        </Grid>
      </Grid>

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
            Are you sure you want to delete HPC &quot;{rowToDelete?.code}&quot;? This action cannot
            be undone.
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="edit-dialog-title">Edit HPC</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {/* Basic Info */}
            <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
              Basic Information
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Cloud Family</InputLabel>
                  <Select
                    value={editFormData.cloud_family_id || ""}
                    onChange={(e) => handleEditFormChange("cloud_family_id", e.target.value)}
                    label="Cloud Family"
                    sx={{ minHeight: 44 }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {cloudFamilies.map((cf) => (
                      <MenuItem key={cf.id} value={cf.id}>
                        {cf.code}
                        {cf.region?.name ? ` (${cf.region.name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={
                    editFormTouched.service_type_id &&
                    !!validateServiceTypeId(editFormData.service_type_id)
                  }
                >
                  <InputLabel>Service Type *</InputLabel>
                  <Select
                    value={editFormData.service_type_id || ""}
                    onChange={(e) => handleEditFormChange("service_type_id", e.target.value)}
                    onBlur={() =>
                      setEditFormTouched((prev) => ({ ...prev, service_type_id: true }))
                    }
                    label="Service Type *"
                    sx={{ minHeight: 44 }}
                  >
                    {serviceTypes.map((st) => (
                      <MenuItem key={st.id} value={st.id}>
                        {st.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {editFormTouched.service_type_id &&
                    validateServiceTypeId(editFormData.service_type_id) && (
                      <FormHelperText>
                        {validateServiceTypeId(editFormData.service_type_id)}
                      </FormHelperText>
                    )}
                </FormControl>
              </Grid>
            </Grid>

            {/* vCPU & vRAM */}
            <MDTypography variant="subtitle2" fontWeight="medium" mt={2} mb={1}>
              Resources
            </MDTypography>
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

            {/* GPU Info */}
            <MDTypography variant="subtitle2" fontWeight="medium" mt={2} mb={1}>
              GPU Configuration
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Vendor"
                  value={editFormData.gpu_vendor || ""}
                  onChange={(e) => handleEditFormChange("gpu_vendor", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Model"
                  value={editFormData.gpu_model || ""}
                  onChange={(e) => handleEditFormChange("gpu_model", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Count"
                  type="number"
                  value={editFormData.gpu_count || ""}
                  onChange={(e) => handleEditFormChange("gpu_count", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Memory (GB)"
                  type="number"
                  value={editFormData.gpu_mempry_gb || ""}
                  onChange={(e) => handleEditFormChange("gpu_mempry_gb", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="add-dialog-title">Add HPC</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {/* Basic Info */}
            <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
              Basic Information
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Cloud Family</InputLabel>
                  <Select
                    value={addFormData.cloud_family_id || ""}
                    onChange={(e) => handleAddFormChange("cloud_family_id", e.target.value)}
                    label="Cloud Family"
                    sx={{ minHeight: 44 }}
                  >
                    <MenuItem value="">None</MenuItem>
                    {cloudFamilies.map((cf) => (
                      <MenuItem key={cf.id} value={cf.id}>
                        {cf.code}
                        {cf.region?.name ? ` (${cf.region.name})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
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
              </Grid>
              <Grid item xs={6}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={
                    addFormTouched.service_type_id &&
                    !!validateServiceTypeId(addFormData.service_type_id)
                  }
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
                  {addFormTouched.service_type_id &&
                    validateServiceTypeId(addFormData.service_type_id) && (
                      <FormHelperText>
                        {validateServiceTypeId(addFormData.service_type_id)}
                      </FormHelperText>
                    )}
                </FormControl>
              </Grid>
            </Grid>

            {/* vCPU & vRAM */}
            <MDTypography variant="subtitle2" fontWeight="medium" mt={2} mb={1}>
              Resources
            </MDTypography>
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

            {/* GPU Info */}
            <MDTypography variant="subtitle2" fontWeight="medium" mt={2} mb={1}>
              GPU Configuration
            </MDTypography>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Vendor"
                  value={addFormData.gpu_vendor}
                  onChange={(e) => handleAddFormChange("gpu_vendor", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Model"
                  value={addFormData.gpu_model}
                  onChange={(e) => handleAddFormChange("gpu_model", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Count"
                  type="number"
                  value={addFormData.gpu_count}
                  onChange={(e) => handleAddFormChange("gpu_count", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="GPU Memory (GB)"
                  type="number"
                  value={addFormData.gpu_mempry_gb}
                  onChange={(e) => handleAddFormChange("gpu_mempry_gb", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
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
    </>
  );
}

export default HpcContent;
