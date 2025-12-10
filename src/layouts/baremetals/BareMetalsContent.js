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
import Collapse from "@mui/material/Collapse";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DataTable from "examples/Tables/DataTable";

// Supabase client
import { supabase } from "supabaseClient";

function BareMetalsContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [coresFilter, setCoresFilter] = useState("");
  const [ramFilter, setRamFilter] = useState("");

  // Lookup data
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [diskTypes, setDiskTypes] = useState([]);

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
    service_id: false,
    service_type_id: false,
    sockets: false,
    cores: false,
    ram: false,
    networkbw: false,
  });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    code: "",
    region_id: "",
    service_id: "",
    service_type_id: "",
    cpu_model: "",
    sockets: "",
    cores: "",
    ram: "",
    networkbw: "",
    os_disk_type: "",
    os_disk_size: "",
    data_disk1_type: "",
    data_disk1_size: "",
    data_disk2_type: "",
    data_disk2_size: "",
    data_disk3_type: "",
    data_disk3_size: "",
    data_disk4_type: "",
    data_disk4_size: "",
  });
  const [adding, setAdding] = useState(false);
  const [editStorageExpanded, setEditStorageExpanded] = useState(false);
  const [addStorageExpanded, setAddStorageExpanded] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({
    code: false,
    region_id: false,
    service_id: false,
    service_type_id: false,
    sockets: false,
    cores: false,
    ram: false,
    networkbw: false,
  });

  async function fetchLookupData() {
    try {
      const [servicesRes, serviceTypesRes, regionsRes] = await Promise.all([
        supabase.from("service").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service_type").select("id, name").eq("is_active", true).order("name"),
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (serviceTypesRes.error) throw serviceTypesRes.error;
      if (regionsRes.error) throw regionsRes.error;

      setServices(servicesRes.data || []);
      setServiceTypes(serviceTypesRes.data || []);
      setRegions(regionsRes.data || []);

      // Fetch DiskTypes enum values
      const { data: enumData, error: enumError } = await supabase.rpc("get_enum_values", {
        enum_type: "DiskTypes",
      });
      if (enumError) {
        console.error("Error fetching DiskTypes enum:", enumError);
      } else if (enumData) {
        let values = [];
        if (Array.isArray(enumData)) {
          values = enumData;
        } else if (typeof enumData === "string") {
          try {
            values = JSON.parse(enumData);
          } catch (e) {
            console.error("Failed to parse enum JSON:", e);
          }
        }
        setDiskTypes(values.filter((v) => typeof v === "string" && v));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("bare_metals")
        .select(
          `
          *,
          region:region(id, name),
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
        .from("bare_metals")
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
      region_id: row.region_id || "",
      service_id: row.service_id || "",
      service_type_id: row.service_type_id || "",
      cpu_model: row.cpu_model || "",
      sockets: row.sockets?.toString() || "",
      cores: row.cores?.toString() || "",
      ram: row.ram?.toString() || "",
      networkbw: row.networkbw?.toString() || "",
      os_disk_type: row.os_disk_type || "",
      os_disk_size: row.os_disk_size?.toString() || "",
      data_disk1_type: row.data_disk1_type || "",
      data_disk1_size: row.data_disk1_size?.toString() || "",
      data_disk2_type: row.data_disk2_type || "",
      data_disk2_size: row.data_disk2_size?.toString() || "",
      data_disk3_type: row.data_disk3_type || "",
      data_disk3_size: row.data_disk3_size?.toString() || "",
      data_disk4_type: row.data_disk4_type || "",
      data_disk4_size: row.data_disk4_size?.toString() || "",
    });
    setEditFormTouched({
      code: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      sockets: false,
      cores: false,
      ram: false,
      networkbw: false,
    });
    setEditStorageExpanded(false);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({
      code: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      sockets: false,
      cores: false,
      ram: false,
      networkbw: false,
    });
    setEditStorageExpanded(false);
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
        service_id: editFormData.service_id,
        service_type_id: editFormData.service_type_id,
        cpu_model: editFormData.cpu_model || null,
        sockets: editFormData.sockets ? parseInt(editFormData.sockets, 10) : null,
        cores: editFormData.cores ? parseInt(editFormData.cores, 10) : null,
        ram: editFormData.ram ? parseInt(editFormData.ram, 10) : null,
        networkbw: editFormData.networkbw ? parseInt(editFormData.networkbw, 10) : null,
        os_disk_type: editFormData.os_disk_type || null,
        os_disk_size: editFormData.os_disk_size ? parseInt(editFormData.os_disk_size, 10) : null,
        data_disk1_type: editFormData.data_disk1_type || null,
        data_disk1_size: editFormData.data_disk1_size ? parseInt(editFormData.data_disk1_size, 10) : null,
        data_disk2_type: editFormData.data_disk2_type || null,
        data_disk2_size: editFormData.data_disk2_size ? parseInt(editFormData.data_disk2_size, 10) : null,
        data_disk3_type: editFormData.data_disk3_type || null,
        data_disk3_size: editFormData.data_disk3_size ? parseInt(editFormData.data_disk3_size, 10) : null,
        data_disk4_type: editFormData.data_disk4_type || null,
        data_disk4_size: editFormData.data_disk4_size ? parseInt(editFormData.data_disk4_size, 10) : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("bare_metals")
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
      service_id: "",
      service_type_id: "",
      cpu_model: "",
      sockets: "",
      cores: "",
      ram: "",
      networkbw: "",
      os_disk_type: "",
      os_disk_size: "",
      data_disk1_type: "",
      data_disk1_size: "",
      data_disk2_type: "",
      data_disk2_size: "",
      data_disk3_type: "",
      data_disk3_size: "",
      data_disk4_type: "",
      data_disk4_size: "",
    });
    setAddFormTouched({
      code: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      sockets: false,
      cores: false,
      ram: false,
      networkbw: false,
    });
    setAddStorageExpanded(false);
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      code: "",
      region_id: "",
      service_id: "",
      service_type_id: "",
      cpu_model: "",
      sockets: "",
      cores: "",
      ram: "",
      networkbw: "",
      os_disk_type: "",
      os_disk_size: "",
      data_disk1_type: "",
      data_disk1_size: "",
      data_disk2_type: "",
      data_disk2_size: "",
      data_disk3_type: "",
      data_disk3_size: "",
      data_disk4_type: "",
      data_disk4_size: "",
    });
    setAddFormTouched({
      code: false,
      region_id: false,
      service_id: false,
      service_type_id: false,
      sockets: false,
      cores: false,
      ram: false,
      networkbw: false,
    });
    setAddStorageExpanded(false);
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
        service_id: addFormData.service_id,
        service_type_id: addFormData.service_type_id,
        cpu_model: addFormData.cpu_model || null,
        sockets: addFormData.sockets ? parseInt(addFormData.sockets, 10) : null,
        cores: addFormData.cores ? parseInt(addFormData.cores, 10) : null,
        ram: addFormData.ram ? parseInt(addFormData.ram, 10) : null,
        networkbw: addFormData.networkbw ? parseInt(addFormData.networkbw, 10) : null,
        os_disk_type: addFormData.os_disk_type || null,
        os_disk_size: addFormData.os_disk_size ? parseInt(addFormData.os_disk_size, 10) : null,
        data_disk1_type: addFormData.data_disk1_type || null,
        data_disk1_size: addFormData.data_disk1_size ? parseInt(addFormData.data_disk1_size, 10) : null,
        data_disk2_type: addFormData.data_disk2_type || null,
        data_disk2_size: addFormData.data_disk2_size ? parseInt(addFormData.data_disk2_size, 10) : null,
        data_disk3_type: addFormData.data_disk3_type || null,
        data_disk3_size: addFormData.data_disk3_size ? parseInt(addFormData.data_disk3_size, 10) : null,
        data_disk4_type: addFormData.data_disk4_type || null,
        data_disk4_size: addFormData.data_disk4_size ? parseInt(addFormData.data_disk4_size, 10) : null,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { error: insertError } = await supabase.from("bare_metals").insert(insertData);

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

  const validateCores = (cores) => {
    if (!cores || cores.toString().trim().length === 0) {
      return "Cores is required";
    }
    const num = parseInt(cores, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "Cores must be a positive integer";
    }
    return "";
  };

  const validateRam = (ram) => {
    if (!ram || ram.toString().trim().length === 0) {
      return "RAM is required";
    }
    const num = parseInt(ram, 10);
    if (Number.isNaN(num) || num <= 0) {
      return "RAM must be a positive integer";
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

  const isAddFormValid = () => {
    return (
      !validateCode(addFormData.code) &&
      !validateRegionId(addFormData.region_id) &&
      !validateServiceId(addFormData.service_id) &&
      !validateServiceTypeId(addFormData.service_type_id) &&
      !validateCores(addFormData.cores) &&
      !validateRam(addFormData.ram) &&
      !validateNetworkbw(addFormData.networkbw)
    );
  };

  const isEditFormValid = () => {
    return (
      !validateCode(editFormData.code) &&
      !validateRegionId(editFormData.region_id) &&
      !validateServiceId(editFormData.service_id) &&
      !validateServiceTypeId(editFormData.service_type_id) &&
      !validateCores(editFormData.cores) &&
      !validateRam(editFormData.ram) &&
      !validateNetworkbw(editFormData.networkbw)
    );
  };

  // Filter data based on search term, region filter, cores filter, and ram filter
  const filteredData = data.filter((row) => {
    // Apply region filter
    if (regionFilter && row.region?.id !== regionFilter) {
      return false;
    }

    // Apply cores filter
    if (coresFilter) {
      const coresValue = parseInt(coresFilter, 10);
      if (!Number.isNaN(coresValue) && row.cores !== coresValue) {
        return false;
      }
    }

    // Apply ram filter
    if (ramFilter) {
      const ramValue = parseInt(ramFilter, 10);
      if (!Number.isNaN(ramValue) && row.ram !== ramValue) {
        return false;
      }
    }

    // Then apply search filter
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.code && row.code.toLowerCase().includes(search)) ||
      (row.cpu_model && row.cpu_model.toLowerCase().includes(search)) ||
      (row.cores && row.cores.toString().includes(search)) ||
      (row.ram && row.ram.toString().includes(search)) ||
      (row.region?.name && row.region.name.toLowerCase().includes(search)) ||
      (row.service?.name && row.service.name.toLowerCase().includes(search)) ||
      (row.service_type?.name && row.service_type.name.toLowerCase().includes(search))
    );
  });

  // Define columns for DataTable
  const columns = [
    { Header: "code", accessor: "code", width: "10%", align: "left" },
    { Header: "region", accessor: "region_name", width: "10%", align: "left" },
    { Header: "cpu model", accessor: "cpu_model", width: "10%", align: "left" },
    {
      Header: "sockets",
      accessor: "sockets",
      width: "6%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.sockets_raw || 0;
        const b = rowB.original.sockets_raw || 0;
        return a - b;
      },
    },
    {
      Header: "cores",
      accessor: "cores",
      width: "6%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.cores_raw || 0;
        const b = rowB.original.cores_raw || 0;
        return a - b;
      },
    },
    {
      Header: "ram",
      accessor: "ram",
      width: "6%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.ram_raw || 0;
        const b = rowB.original.ram_raw || 0;
        return a - b;
      },
    },
    { Header: "network bw", accessor: "networkbw", width: "8%", align: "center" },
    { Header: "os disk", accessor: "os_disk", width: "10%", align: "left" },
    { Header: "service", accessor: "service_name", width: "10%", align: "left" },
    { Header: "service type", accessor: "service_type_name", width: "10%", align: "left" },
    { Header: "actions", accessor: "actions", width: "10%", align: "center" },
  ];

  // Transform data to rows format for DataTable
  const rows = filteredData.map((row) => ({
    code: (
      <MDTypography variant="button" fontWeight="medium">
        {row.code || "-"}
      </MDTypography>
    ),
    region_name: (
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
    sockets_raw: row.sockets || 0,
    cores: (
      <MDTypography variant="caption" color="text">
        {row.cores || "-"}
      </MDTypography>
    ),
    cores_raw: row.cores || 0,
    ram: (
      <MDTypography variant="caption" color="text">
        {row.ram || "-"}
      </MDTypography>
    ),
    ram_raw: row.ram || 0,
    networkbw: (
      <MDTypography variant="caption" color="text">
        {row.networkbw || "-"}
      </MDTypography>
    ),
    os_disk: (
      <MDTypography variant="caption" color="text">
        {row.os_disk_type && row.os_disk_size ? `${row.os_disk_type} ${row.os_disk_size}GB` : "-"}
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
            placeholder="Search bare metals..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <Icon sx={{ color: "text.secondary", mr: 1 }}>search</Icon>
              ),
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm("")}
                  sx={{ p: 0.5 }}
                >
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
            placeholder="Cores"
            size="small"
            type="number"
            value={coresFilter}
            onChange={(e) => setCoresFilter(e.target.value)}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: coresFilter && (
                <IconButton
                  size="small"
                  onClick={() => setCoresFilter("")}
                  sx={{ p: 0.5 }}
                >
                  <Icon sx={{ fontSize: "1rem !important" }}>close</Icon>
                </IconButton>
              ),
            }}
          />
          <TextField
            placeholder="RAM"
            size="small"
            type="number"
            value={ramFilter}
            onChange={(e) => setRamFilter(e.target.value)}
            sx={{ width: 100 }}
            InputProps={{
              inputProps: { min: 1 },
              endAdornment: ramFilter && (
                <IconButton
                  size="small"
                  onClick={() => setRamFilter("")}
                  sx={{ p: 0.5 }}
                >
                  <Icon sx={{ fontSize: "1rem !important" }}>close</Icon>
                </IconButton>
              ),
            }}
          />
        </MDBox>
        <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Add Bare Metal
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
                    No bare metals found. Click &quot;Add Bare Metal&quot; to create one.
                  </MDTypography>
                </MDBox>
              ) : (
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={false}
                  showTotalEntries={false}
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
            Are you sure you want to delete bare metal &quot;{rowToDelete?.code}&quot;? This action
            cannot be undone.
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
        <DialogTitle id="edit-dialog-title">Edit Bare Metal</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
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
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CPU Model"
                  value={editFormData.cpu_model || ""}
                  onChange={(e) => handleEditFormChange("cpu_model", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sockets"
                  type="number"
                  value={editFormData.sockets || ""}
                  onChange={(e) => handleEditFormChange("sockets", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Cores *"
                  type="number"
                  value={editFormData.cores || ""}
                  onChange={(e) => handleEditFormChange("cores", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, cores: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.cores && !!validateCores(editFormData.cores)}
                  helperText={editFormTouched.cores && validateCores(editFormData.cores)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="RAM (GB) *"
                  type="number"
                  value={editFormData.ram || ""}
                  onChange={(e) => handleEditFormChange("ram", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, ram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.ram && !!validateRam(editFormData.ram)}
                  helperText={editFormTouched.ram && validateRam(editFormData.ram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
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
                  helperText={editFormTouched.networkbw && validateNetworkbw(editFormData.networkbw)}
                  inputProps={{ min: 1 }}
                />
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
              </Grid>
            </Grid>
            <MDBox mt={2}>
              <MDButton
                variant="text"
                color="info"
                size="small"
                onClick={() => setEditStorageExpanded(!editStorageExpanded)}
                sx={{ textTransform: "none", p: 0 }}
              >
                <Icon sx={{ mr: 0.5 }}>{editStorageExpanded ? "expand_less" : "expand_more"}</Icon>
                {editStorageExpanded ? "Hide Storage Configuration" : "Show Storage Configuration"}
              </MDButton>
            </MDBox>
            <Collapse in={editStorageExpanded}>
              <MDTypography variant="subtitle2" fontWeight="medium" mt={1} mb={1}>
                Storage Configuration
              </MDTypography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>OS Disk Type</InputLabel>
                    <Select
                      value={editFormData.os_disk_type || ""}
                      onChange={(e) => handleEditFormChange("os_disk_type", e.target.value)}
                      label="OS Disk Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="OS Disk Size (GB)"
                    type="number"
                    value={editFormData.os_disk_size || ""}
                    onChange={(e) => handleEditFormChange("os_disk_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 1 Type</InputLabel>
                    <Select
                      value={editFormData.data_disk1_type || ""}
                      onChange={(e) => handleEditFormChange("data_disk1_type", e.target.value)}
                      label="Data Disk 1 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 1 Size (GB)"
                    type="number"
                    value={editFormData.data_disk1_size || ""}
                    onChange={(e) => handleEditFormChange("data_disk1_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 2 Type</InputLabel>
                    <Select
                      value={editFormData.data_disk2_type || ""}
                      onChange={(e) => handleEditFormChange("data_disk2_type", e.target.value)}
                      label="Data Disk 2 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 2 Size (GB)"
                    type="number"
                    value={editFormData.data_disk2_size || ""}
                    onChange={(e) => handleEditFormChange("data_disk2_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 3 Type</InputLabel>
                    <Select
                      value={editFormData.data_disk3_type || ""}
                      onChange={(e) => handleEditFormChange("data_disk3_type", e.target.value)}
                      label="Data Disk 3 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 3 Size (GB)"
                    type="number"
                    value={editFormData.data_disk3_size || ""}
                    onChange={(e) => handleEditFormChange("data_disk3_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 4 Type</InputLabel>
                    <Select
                      value={editFormData.data_disk4_type || ""}
                      onChange={(e) => handleEditFormChange("data_disk4_type", e.target.value)}
                      label="Data Disk 4 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 4 Size (GB)"
                    type="number"
                    value={editFormData.data_disk4_size || ""}
                    onChange={(e) => handleEditFormChange("data_disk4_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </Collapse>
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
        <DialogTitle id="add-dialog-title">Add Bare Metal</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
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
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="CPU Model"
                  value={addFormData.cpu_model}
                  onChange={(e) => handleAddFormChange("cpu_model", e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sockets"
                  type="number"
                  value={addFormData.sockets}
                  onChange={(e) => handleAddFormChange("sockets", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Cores *"
                  type="number"
                  value={addFormData.cores}
                  onChange={(e) => handleAddFormChange("cores", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, cores: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.cores && !!validateCores(addFormData.cores)}
                  helperText={addFormTouched.cores && validateCores(addFormData.cores)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="RAM (GB) *"
                  type="number"
                  value={addFormData.ram}
                  onChange={(e) => handleAddFormChange("ram", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, ram: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.ram && !!validateRam(addFormData.ram)}
                  helperText={addFormTouched.ram && validateRam(addFormData.ram)}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={4}>
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
              </Grid>
            </Grid>
            <MDBox mt={2}>
              <MDButton
                variant="text"
                color="info"
                size="small"
                onClick={() => setAddStorageExpanded(!addStorageExpanded)}
                sx={{ textTransform: "none", p: 0 }}
              >
                <Icon sx={{ mr: 0.5 }}>{addStorageExpanded ? "expand_less" : "expand_more"}</Icon>
                {addStorageExpanded ? "Hide Storage Configuration" : "Show Storage Configuration"}
              </MDButton>
            </MDBox>
            <Collapse in={addStorageExpanded}>
              <MDTypography variant="subtitle2" fontWeight="medium" mt={1} mb={1}>
                Storage Configuration
              </MDTypography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>OS Disk Type</InputLabel>
                    <Select
                      value={addFormData.os_disk_type || ""}
                      onChange={(e) => handleAddFormChange("os_disk_type", e.target.value)}
                      label="OS Disk Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="OS Disk Size (GB)"
                    type="number"
                    value={addFormData.os_disk_size}
                    onChange={(e) => handleAddFormChange("os_disk_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 1 Type</InputLabel>
                    <Select
                      value={addFormData.data_disk1_type || ""}
                      onChange={(e) => handleAddFormChange("data_disk1_type", e.target.value)}
                      label="Data Disk 1 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 1 Size (GB)"
                    type="number"
                    value={addFormData.data_disk1_size}
                    onChange={(e) => handleAddFormChange("data_disk1_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 2 Type</InputLabel>
                    <Select
                      value={addFormData.data_disk2_type || ""}
                      onChange={(e) => handleAddFormChange("data_disk2_type", e.target.value)}
                      label="Data Disk 2 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 2 Size (GB)"
                    type="number"
                    value={addFormData.data_disk2_size}
                    onChange={(e) => handleAddFormChange("data_disk2_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 3 Type</InputLabel>
                    <Select
                      value={addFormData.data_disk3_type || ""}
                      onChange={(e) => handleAddFormChange("data_disk3_type", e.target.value)}
                      label="Data Disk 3 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 3 Size (GB)"
                    type="number"
                    value={addFormData.data_disk3_size}
                    onChange={(e) => handleAddFormChange("data_disk3_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Data Disk 4 Type</InputLabel>
                    <Select
                      value={addFormData.data_disk4_type || ""}
                      onChange={(e) => handleAddFormChange("data_disk4_type", e.target.value)}
                      label="Data Disk 4 Type"
                      sx={{ minHeight: 44 }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {diskTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Data Disk 4 Size (GB)"
                    type="number"
                    value={addFormData.data_disk4_size}
                    onChange={(e) => handleAddFormChange("data_disk4_size", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </Collapse>
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

export default BareMetalsContent;
