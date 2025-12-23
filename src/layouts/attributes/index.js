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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
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

// Data type options
const DATA_TYPES = [
  { value: "string", label: "String" },
  { value: "text", label: "Text (Rich Text)" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "json", label: "JSON" },
  { value: "list", label: "List (Dropdown)" },
];

// Validation rule types
const VALIDATION_RULE_TYPES = [
  { value: "min", label: "Min", valueType: "integer" },
  { value: "max", label: "Max", valueType: "integer" },
  { value: "min_length", label: "Min Length", valueType: "integer" },
  { value: "max_length", label: "Max Length", valueType: "integer" },
  { value: "regex", label: "Regex", valueType: "string" },
  { value: "required", label: "Required", valueType: "boolean" },
];

function Attributes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("");

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
    attribute_key: false,
    display_name: false,
    data_type: false,
  });

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    attribute_key: "",
    display_name: "",
    data_type: "",
    unit: "",
    default_value: "",
    validation_rules: [{ type: "", value: "" }],
    tags: [],
    list_options: [],
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({
    attribute_key: false,
    display_name: false,
    data_type: false,
  });

  // List options modal state
  const [listOptionsDialogOpen, setListOptionsDialogOpen] = useState(false);
  const [listOptionsTarget, setListOptionsTarget] = useState(null); // "add" or "edit"
  const [newListItem, setNewListItem] = useState("");

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Column order state (for drag-and-drop reordering)
  const [columnOrder, setColumnOrder] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10; // Default entries per page

  // localStorage keys for column settings
  const COLUMN_ORDER_KEY = "attributes-column-order";
  const HIDDEN_COLUMNS_KEY = "attributes-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("attribute_definitions")
        .select("*")
        .eq("is_active", true)
        .order("display_name", { ascending: true });

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

  // Save column order to localStorage
  const saveColumnOrder = useCallback((order) => {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  }, []);

  // Save hidden columns to localStorage
  const saveHiddenColumns = useCallback((hidden) => {
    localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(hidden));
  }, []);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId) => {
    setHiddenColumns((prev) => {
      const newHidden = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];
      saveHiddenColumns(newHidden);
      return newHidden;
    });
  };

  // Show all columns
  const showAllColumns = () => {
    setHiddenColumns([]);
    saveHiddenColumns([]);
  };

  // Open column visibility menu
  const handleColumnMenuOpen = (event) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  // Close column visibility menu
  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  // Handle column order change (for drag-and-drop)
  const handleColumnOrderChange = (newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  };

  // Reset column order to default
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
        .from("attribute_definitions")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
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

  // Parse tags string to array for display
  const parseTags = (tagsString) => {
    if (!tagsString) return [];
    // Handle format like "{ 'tag1', 'tag2' }" or simple comma-separated
    const cleaned = tagsString.replace(/[{}'"]/g, "").trim();
    if (!cleaned) return [];
    return cleaned.split(",").map((tag) => tag.trim()).filter(Boolean);
  };

  // Convert tags array to storage format
  const tagsToString = (tagsArray) => {
    if (!tagsArray || tagsArray.length === 0) return null;
    return `{ '${tagsArray.join("', '")}' }`;
  };

  // Parse validation rules JSON to array format for form
  const parseValidationRules = (rulesJson) => {
    if (!rulesJson || typeof rulesJson !== "object") return [{ type: "", value: "" }];
    const rulesArray = Object.entries(rulesJson).map(([key, value]) => ({
      type: key,
      value: value,
    }));
    return rulesArray.length > 0 ? rulesArray : [{ type: "", value: "" }];
  };

  // Convert validation rules array to JSON for storage
  const validationRulesToJson = (rulesArray) => {
    if (!rulesArray || rulesArray.length === 0) return null;
    const validRules = rulesArray.filter((rule) => rule.type && rule.value !== "");
    if (validRules.length === 0) return null;
    const rulesObj = {};
    validRules.forEach((rule) => {
      const ruleType = VALIDATION_RULE_TYPES.find((rt) => rt.value === rule.type);
      if (ruleType) {
        if (ruleType.valueType === "integer") {
          rulesObj[rule.type] = parseInt(rule.value, 10);
        } else if (ruleType.valueType === "boolean") {
          rulesObj[rule.type] = rule.value === true || rule.value === "true";
        } else {
          rulesObj[rule.type] = rule.value;
        }
      }
    });
    return Object.keys(rulesObj).length > 0 ? rulesObj : null;
  };

  // Parse list_options from JSON
  const parseListOptions = (listOptionsJson) => {
    if (!listOptionsJson) return [];
    if (Array.isArray(listOptionsJson)) return listOptionsJson;
    try {
      const parsed = typeof listOptionsJson === "string" ? JSON.parse(listOptionsJson) : listOptionsJson;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Edit handlers
  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      attribute_key: row.attribute_key || "",
      display_name: row.display_name || "",
      data_type: row.data_type || "",
      unit: row.unit || "",
      default_value: row.default_value || "",
      validation_rules: parseValidationRules(row.validation_rules),
      tags: parseTags(row.tags),
      list_options: parseListOptions(row.list_options),
    });
    setEditFormTouched({
      attribute_key: false,
      display_name: false,
      data_type: false,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({
      attribute_key: false,
      display_name: false,
      data_type: false,
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
        attribute_key: editFormData.attribute_key,
        display_name: editFormData.display_name,
        data_type: editFormData.data_type,
        unit: editFormData.unit || null,
        default_value: editFormData.default_value || null,
        validation_rules: validationRulesToJson(editFormData.validation_rules),
        tags: tagsToString(editFormData.tags),
        list_options: editFormData.data_type === "list" && editFormData.list_options?.length > 0
          ? editFormData.list_options
          : null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("attribute_definitions")
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
      attribute_key: "",
      display_name: "",
      data_type: "",
      unit: "",
      default_value: "",
      validation_rules: [{ type: "", value: "" }],
      tags: [],
      list_options: [],
    });
    setAddFormTouched({
      attribute_key: false,
      display_name: false,
      data_type: false,
    });
    setAddDialogOpen(true);
  };

  // Duplicate handler - opens add dialog with pre-filled data
  const handleDuplicateClick = (row) => {
    // Generate unique suffix based on timestamp
    const suffix = `_copy_${Date.now().toString(36)}`;

    setAddFormData({
      attribute_key: `${row.attribute_key || ""}${suffix}`,
      display_name: `${row.display_name || ""} (Copy)`,
      data_type: row.data_type || "",
      unit: row.unit || "",
      default_value: row.default_value || "",
      validation_rules: parseValidationRules(row.validation_rules),
      tags: parseTags(row.tags),
      list_options: parseListOptions(row.list_options),
    });
    setAddFormTouched({
      attribute_key: false,
      display_name: false,
      data_type: false,
    });
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      attribute_key: "",
      display_name: "",
      data_type: "",
      unit: "",
      default_value: "",
      validation_rules: [{ type: "", value: "" }],
      tags: [],
      list_options: [],
    });
    setAddFormTouched({
      attribute_key: false,
      display_name: false,
      data_type: false,
    });
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // List Options Modal handlers
  const handleOpenListOptions = (target) => {
    setListOptionsTarget(target);
    setNewListItem("");
    setListOptionsDialogOpen(true);
  };

  const handleCloseListOptions = () => {
    setListOptionsDialogOpen(false);
    setListOptionsTarget(null);
    setNewListItem("");
  };

  const handleAddListItem = () => {
    if (!newListItem.trim()) return;

    if (listOptionsTarget === "add") {
      const currentOptions = addFormData.list_options || [];
      if (!currentOptions.includes(newListItem.trim())) {
        handleAddFormChange("list_options", [...currentOptions, newListItem.trim()]);
      }
    } else if (listOptionsTarget === "edit") {
      const currentOptions = editFormData.list_options || [];
      if (!currentOptions.includes(newListItem.trim())) {
        handleEditFormChange("list_options", [...currentOptions, newListItem.trim()]);
      }
    }
    setNewListItem("");
  };

  const handleRemoveListItem = (itemToRemove) => {
    if (listOptionsTarget === "add") {
      const currentOptions = addFormData.list_options || [];
      handleAddFormChange("list_options", currentOptions.filter((item) => item !== itemToRemove));
      // Clear default value if it was the removed item
      if (addFormData.default_value === itemToRemove) {
        handleAddFormChange("default_value", "");
      }
    } else if (listOptionsTarget === "edit") {
      const currentOptions = editFormData.list_options || [];
      handleEditFormChange("list_options", currentOptions.filter((item) => item !== itemToRemove));
      // Clear default value if it was the removed item
      if (editFormData.default_value === itemToRemove) {
        handleEditFormChange("default_value", "");
      }
    }
  };

  const getCurrentListOptions = () => {
    if (listOptionsTarget === "add") {
      return addFormData.list_options || [];
    } else if (listOptionsTarget === "edit") {
      return editFormData.list_options || [];
    }
    return [];
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);

      const insertData = {
        attribute_key: addFormData.attribute_key,
        display_name: addFormData.display_name,
        data_type: addFormData.data_type,
        unit: addFormData.unit || null,
        default_value: addFormData.default_value || null,
        validation_rules: validationRulesToJson(addFormData.validation_rules),
        tags: tagsToString(addFormData.tags),
        list_options: addFormData.data_type === "list" && addFormData.list_options?.length > 0
          ? addFormData.list_options
          : null,
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: "admin",
      };

      const { data: insertedData, error: insertError } = await supabase
        .from("attribute_definitions")
        .insert(insertData)
        .select();

      if (insertError) {
        throw insertError;
      }

      await fetchData();

      // Navigate to the page where the new attribute appears
      // The table is sorted by display_name ascending by default
      if (insertedData && insertedData.length > 0) {
        const newDisplayName = insertedData[0].display_name;
        // Get updated data after fetch to find correct page
        const { data: allData } = await supabase
          .from("attribute_definitions")
          .select("display_name")
          .eq("is_active", true)
          .order("display_name", { ascending: true });

        if (allData) {
          const newIndex = allData.findIndex((item) => item.display_name === newDisplayName);
          if (newIndex !== -1) {
            const newPage = Math.floor(newIndex / pageSize);
            setCurrentPage(newPage);
          }
        }
      }

      handleAddClose();
    } catch (err) {
      console.error("Error adding attribute:", err);
      setError(err.message || JSON.stringify(err));
    } finally {
      setAdding(false);
    }
  };

  // Validation helpers
  const validateAttributeKey = (key) => {
    if (!key || key.trim().length === 0) {
      return "Attribute key is required";
    }
    if (key.trim().length < 2) {
      return "Attribute key must be at least 2 characters long";
    }
    if (!/^[a-z_][a-z0-9_]*$/.test(key)) {
      return "Attribute key must be lowercase with underscores only";
    }
    return "";
  };

  const validateDisplayName = (name) => {
    if (!name || name.trim().length === 0) {
      return "Display name is required";
    }
    return "";
  };

  const validateDataType = (dataType) => {
    if (!dataType) {
      return "Data type is required";
    }
    return "";
  };

  const isAddFormValid = () => {
    return (
      !validateAttributeKey(addFormData.attribute_key) &&
      !validateDisplayName(addFormData.display_name) &&
      !validateDataType(addFormData.data_type)
    );
  };

  const isEditFormValid = () => {
    return (
      !validateAttributeKey(editFormData.attribute_key) &&
      !validateDisplayName(editFormData.display_name) &&
      !validateDataType(editFormData.data_type)
    );
  };

  // Filter data based on search term and filters
  const filteredData = data.filter((row) => {
    // Apply data type filter
    if (dataTypeFilter && row.data_type !== dataTypeFilter) {
      return false;
    }

    // Then apply search filter
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.attribute_key && row.attribute_key.toLowerCase().includes(search)) ||
      (row.display_name && row.display_name.toLowerCase().includes(search)) ||
      (row.data_type && row.data_type.toLowerCase().includes(search)) ||
      (row.unit && row.unit.toLowerCase().includes(search)) ||
      (row.tags && row.tags.toLowerCase().includes(search))
    );
  });

  // Define all available columns for DataTable
  const allColumns = useMemo(() => [
    {
      Header: "Attribute Key",
      accessor: "attribute_key",
      id: "attribute_key",
      width: "18%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.attribute_key_raw || "";
        const b = rowB.original.attribute_key_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Display Name",
      accessor: "display_name",
      id: "display_name",
      width: "15%",
      align: "left",
      sortType: (rowA, rowB) => {
        const a = rowA.original.display_name_raw || "";
        const b = rowB.original.display_name_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Data Type",
      accessor: "data_type",
      id: "data_type",
      width: "10%",
      align: "center",
      sortType: (rowA, rowB) => {
        const a = rowA.original.data_type_raw || "";
        const b = rowB.original.data_type_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Unit",
      accessor: "unit",
      id: "unit",
      width: "8%",
      align: "center",
    },
    {
      Header: "Default",
      accessor: "default_value",
      id: "default_value",
      width: "10%",
      align: "left",
    },
    {
      Header: "Tags",
      accessor: "tags",
      id: "tags",
      width: "15%",
      align: "left",
      disableSortBy: true,
    },
    { Header: "Actions", accessor: "actions", id: "actions", width: "12%", align: "center", disableSortBy: true },
  ], []);

  // Get ordered columns based on saved order
  const orderedColumns = useMemo(() => {
    if (columnOrder.length === 0) {
      return allColumns;
    }

    // Create a map of columns by id for quick lookup
    const columnMap = new Map(allColumns.map((col) => [col.id, col]));

    // Order columns based on saved order, then append any new columns not in saved order
    const ordered = [];
    const usedIds = new Set();

    columnOrder.forEach((id) => {
      if (columnMap.has(id)) {
        ordered.push(columnMap.get(id));
        usedIds.add(id);
      }
    });

    // Then append any new columns that weren't in the saved order
    allColumns.forEach((col) => {
      if (!usedIds.has(col.id)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [allColumns, columnOrder]);

  // Get visible columns (filter out hidden ones)
  const columns = useMemo(() => {
    return orderedColumns.filter((col) => !hiddenColumns.includes(col.id));
  }, [orderedColumns, hiddenColumns]);

  // Transform data to rows format for DataTable
  const rows = filteredData.map((row) => ({
    id: row.id,
    attribute_key: (
      <MDTypography variant="button" fontWeight="medium">
        {row.attribute_key || "-"}
      </MDTypography>
    ),
    attribute_key_raw: row.attribute_key || "",
    display_name: (
      <MDTypography variant="caption" color="text">
        {row.display_name || "-"}
      </MDTypography>
    ),
    display_name_raw: row.display_name || "",
    data_type: (
      <Chip
        label={row.data_type || "-"}
        size="small"
        color={
          row.data_type === "string"
            ? "info"
            : row.data_type === "integer"
              ? "primary"
              : row.data_type === "decimal"
                ? "secondary"
                : row.data_type === "boolean"
                  ? "warning"
                  : "default"
        }
        variant="outlined"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    data_type_raw: row.data_type || "",
    unit: (
      <MDTypography variant="caption" color="text">
        {row.unit || "-"}
      </MDTypography>
    ),
    default_value: (
      <MDTypography
        variant="caption"
        color="text"
        sx={{
          display: "block",
          maxWidth: 100,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={row.default_value || ""}
      >
        {row.default_value || "-"}
      </MDTypography>
    ),
    tags: (
      <MDBox display="flex" gap={0.5} flexWrap="wrap">
        {parseTags(row.tags).length > 0 ? (
          parseTags(row.tags).map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              sx={{ fontSize: "0.65rem", height: 20 }}
            />
          ))
        ) : (
          <MDTypography variant="caption" color="text">
            -
          </MDTypography>
        )}
      </MDBox>
    ),
    actions: (
      <MDBox display="flex" justifyContent="center" gap={0.5}>
        <Tooltip title="Edit" placement="top">
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
            <Icon fontSize="small">edit</Icon>
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate" placement="top">
          <IconButton
            size="small"
            onClick={() => handleDuplicateClick(row)}
            sx={{
              color: "success.main",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.2)",
                backgroundColor: "rgba(76, 175, 80, 0.1)",
              },
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
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.2)",
                backgroundColor: "rgba(244, 67, 54, 0.1)",
              },
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
                  Attribute Definitions
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <TextField
                        placeholder="Search attributes..."
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
                      <FormControl size="small" sx={{ minWidth: 130 }}>
                        <Select
                          value={dataTypeFilter}
                          onChange={(e) => setDataTypeFilter(e.target.value)}
                          displayEmpty
                          sx={{ minHeight: 40 }}
                        >
                          <MenuItem value="">Any Type</MenuItem>
                          {DATA_TYPES.map((dt) => (
                            <MenuItem key={dt.value} value={dt.value}>
                              {dt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </MDBox>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Show/Hide Columns">
                        <IconButton
                          size="small"
                          onClick={handleColumnMenuOpen}
                          sx={{ color: "text.secondary" }}
                        >
                          <Icon>view_column</Icon>
                        </IconButton>
                      </Tooltip>
                      <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
                        <Icon sx={{ mr: 1 }}>add</Icon>
                        Add Attribute
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
                        No attribute definitions found. Click &quot;Add Attribute&quot; to create one.
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
                      tableId="attributes-table"
                    />
                  )}
                </MDBox>
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
            Are you sure you want to delete attribute &quot;{rowToDelete?.display_name}&quot;? This
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="edit-dialog-title">Edit Attribute Definition</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Attribute Key *"
                  value={editFormData.attribute_key || ""}
                  onChange={(e) => handleEditFormChange("attribute_key", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, attribute_key: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.attribute_key && !!validateAttributeKey(editFormData.attribute_key)}
                  helperText={editFormTouched.attribute_key && validateAttributeKey(editFormData.attribute_key)}
                  placeholder="e.g., cpu_cores, memory_gb"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Display Name *"
                  value={editFormData.display_name || ""}
                  onChange={(e) => handleEditFormChange("display_name", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, display_name: true }))}
                  margin="normal"
                  variant="outlined"
                  error={editFormTouched.display_name && !!validateDisplayName(editFormData.display_name)}
                  helperText={editFormTouched.display_name && validateDisplayName(editFormData.display_name)}
                  placeholder="e.g., CPU Cores, Memory (GB)"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={editFormTouched.data_type && !!validateDataType(editFormData.data_type)}
                >
                  <InputLabel>Data Type *</InputLabel>
                  <Select
                    value={editFormData.data_type || ""}
                    onChange={(e) => {
                      handleEditFormChange("data_type", e.target.value);
                      // Clear default value if switching from list to another type
                      if (e.target.value !== "list" && editFormData.data_type === "list") {
                        handleEditFormChange("default_value", "");
                      }
                    }}
                    onBlur={() => setEditFormTouched((prev) => ({ ...prev, data_type: true }))}
                    label="Data Type *"
                    sx={{ minHeight: 44 }}
                    endAdornment={
                      editFormData.data_type === "list" ? (
                        <InputAdornment position="end" sx={{ mr: 2 }}>
                          <Tooltip title="Manage List Options">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenListOptions("edit");
                              }}
                              sx={{
                                color: "info.main",
                                "&:hover": {
                                  backgroundColor: "rgba(26, 115, 232, 0.1)",
                                },
                              }}
                            >
                              <Icon fontSize="small">edit</Icon>
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null
                    }
                  >
                    {DATA_TYPES.map((dt) => (
                      <MenuItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {editFormTouched.data_type && validateDataType(editFormData.data_type) && (
                    <FormHelperText>{validateDataType(editFormData.data_type)}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={editFormData.unit || ""}
                  onChange={(e) => handleEditFormChange("unit", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="e.g., GB, cores, %"
                />
              </Grid>
              <Grid item xs={4}>
                {editFormData.data_type === "list" ? (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Default Value</InputLabel>
                    <Select
                      value={editFormData.default_value || ""}
                      onChange={(e) => handleEditFormChange("default_value", e.target.value)}
                      label="Default Value"
                      sx={{ minHeight: 44 }}
                      disabled={(editFormData.list_options || []).length === 0}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {(editFormData.list_options || []).map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {(editFormData.list_options || []).length === 0 && (
                      <FormHelperText>Click the pencil icon in Data Type to add options</FormHelperText>
                    )}
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Default Value"
                    value={editFormData.default_value || ""}
                    onChange={(e) => handleEditFormChange("default_value", e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={editFormData.tags || []}
                  onChange={(event, newValue) => handleEditFormChange("tags", newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      margin="normal"
                      variant="outlined"
                      placeholder="Type and press Enter to add"
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MDTypography variant="caption" fontWeight="medium" color="text" sx={{ mb: 1, display: "block" }}>
                  Validation Rules
                </MDTypography>
                {(editFormData.validation_rules || [{ type: "", value: "" }]).map((rule, index) => (
                  <MDBox key={index} display="flex" alignItems="center" gap={1} mb={1}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={rule.type || ""}
                        onChange={(e) => {
                          const newRules = [...editFormData.validation_rules];
                          newRules[index] = { ...newRules[index], type: e.target.value, value: "" };
                          handleEditFormChange("validation_rules", newRules);
                        }}
                        displayEmpty
                        sx={{ minHeight: 40 }}
                      >
                        <MenuItem value="">Select Rule</MenuItem>
                        {VALIDATION_RULE_TYPES.map((rt) => (
                          <MenuItem key={rt.value} value={rt.value}>
                            {rt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {rule.type && VALIDATION_RULE_TYPES.find((rt) => rt.value === rule.type)?.valueType === "boolean" ? (
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={rule.value === true || rule.value === "true" ? "true" : "false"}
                          onChange={(e) => {
                            const newRules = [...editFormData.validation_rules];
                            newRules[index] = { ...newRules[index], value: e.target.value === "true" };
                            handleEditFormChange("validation_rules", newRules);
                          }}
                          sx={{ minHeight: 40 }}
                        >
                          <MenuItem value="true">True</MenuItem>
                          <MenuItem value="false">False</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        size="small"
                        type={VALIDATION_RULE_TYPES.find((rt) => rt.value === rule.type)?.valueType === "integer" ? "number" : "text"}
                        value={rule.value || ""}
                        onChange={(e) => {
                          const newRules = [...editFormData.validation_rules];
                          newRules[index] = { ...newRules[index], value: e.target.value };
                          handleEditFormChange("validation_rules", newRules);
                        }}
                        placeholder="Value"
                        sx={{ width: 150 }}
                        disabled={!rule.type}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newRules = [...editFormData.validation_rules, { type: "", value: "" }];
                        handleEditFormChange("validation_rules", newRules);
                      }}
                      sx={{ color: "success.main" }}
                    >
                      <Icon>add</Icon>
                    </IconButton>
                    {index > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newRules = editFormData.validation_rules.filter((_, i) => i !== index);
                          handleEditFormChange("validation_rules", newRules);
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <Icon>remove</Icon>
                      </IconButton>
                    )}
                  </MDBox>
                ))}
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
        <DialogTitle id="add-dialog-title">Add Attribute Definition</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Attribute Key *"
                  value={addFormData.attribute_key}
                  onChange={(e) => handleAddFormChange("attribute_key", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, attribute_key: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.attribute_key && !!validateAttributeKey(addFormData.attribute_key)}
                  helperText={addFormTouched.attribute_key && validateAttributeKey(addFormData.attribute_key)}
                  placeholder="e.g., cpu_cores, memory_gb"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Display Name *"
                  value={addFormData.display_name}
                  onChange={(e) => handleAddFormChange("display_name", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, display_name: true }))}
                  margin="normal"
                  variant="outlined"
                  error={addFormTouched.display_name && !!validateDisplayName(addFormData.display_name)}
                  helperText={addFormTouched.display_name && validateDisplayName(addFormData.display_name)}
                  placeholder="e.g., CPU Cores, Memory (GB)"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={addFormTouched.data_type && !!validateDataType(addFormData.data_type)}
                >
                  <InputLabel>Data Type *</InputLabel>
                  <Select
                    value={addFormData.data_type || ""}
                    onChange={(e) => {
                      handleAddFormChange("data_type", e.target.value);
                      // Clear default value if switching from list to another type
                      if (e.target.value !== "list" && addFormData.data_type === "list") {
                        handleAddFormChange("default_value", "");
                      }
                    }}
                    onBlur={() => setAddFormTouched((prev) => ({ ...prev, data_type: true }))}
                    label="Data Type *"
                    sx={{ minHeight: 44 }}
                    endAdornment={
                      addFormData.data_type === "list" ? (
                        <InputAdornment position="end" sx={{ mr: 2 }}>
                          <Tooltip title="Manage List Options">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenListOptions("add");
                              }}
                              sx={{
                                color: "info.main",
                                "&:hover": {
                                  backgroundColor: "rgba(26, 115, 232, 0.1)",
                                },
                              }}
                            >
                              <Icon fontSize="small">edit</Icon>
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null
                    }
                  >
                    {DATA_TYPES.map((dt) => (
                      <MenuItem key={dt.value} value={dt.value}>
                        {dt.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {addFormTouched.data_type && validateDataType(addFormData.data_type) && (
                    <FormHelperText>{validateDataType(addFormData.data_type)}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Unit"
                  value={addFormData.unit}
                  onChange={(e) => handleAddFormChange("unit", e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="e.g., GB, cores, %"
                />
              </Grid>
              <Grid item xs={4}>
                {addFormData.data_type === "list" ? (
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Default Value</InputLabel>
                    <Select
                      value={addFormData.default_value || ""}
                      onChange={(e) => handleAddFormChange("default_value", e.target.value)}
                      label="Default Value"
                      sx={{ minHeight: 44 }}
                      disabled={(addFormData.list_options || []).length === 0}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {(addFormData.list_options || []).map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    {(addFormData.list_options || []).length === 0 && (
                      <FormHelperText>Click the pencil icon in Data Type to add options</FormHelperText>
                    )}
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    label="Default Value"
                    value={addFormData.default_value}
                    onChange={(e) => handleAddFormChange("default_value", e.target.value)}
                    margin="normal"
                    variant="outlined"
                  />
                )}
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={addFormData.tags || []}
                  onChange={(event, newValue) => handleAddFormChange("tags", newValue)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        key={index}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      margin="normal"
                      variant="outlined"
                      placeholder="Type and press Enter to add"
                    />
                  )}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <MDTypography variant="caption" fontWeight="medium" color="text" sx={{ mb: 1, display: "block" }}>
                  Validation Rules
                </MDTypography>
                {(addFormData.validation_rules || [{ type: "", value: "" }]).map((rule, index) => (
                  <MDBox key={index} display="flex" alignItems="center" gap={1} mb={1}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={rule.type || ""}
                        onChange={(e) => {
                          const newRules = [...addFormData.validation_rules];
                          newRules[index] = { ...newRules[index], type: e.target.value, value: "" };
                          handleAddFormChange("validation_rules", newRules);
                        }}
                        displayEmpty
                        sx={{ minHeight: 40 }}
                      >
                        <MenuItem value="">Select Rule</MenuItem>
                        {VALIDATION_RULE_TYPES.map((rt) => (
                          <MenuItem key={rt.value} value={rt.value}>
                            {rt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {rule.type && VALIDATION_RULE_TYPES.find((rt) => rt.value === rule.type)?.valueType === "boolean" ? (
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={rule.value === true || rule.value === "true" ? "true" : "false"}
                          onChange={(e) => {
                            const newRules = [...addFormData.validation_rules];
                            newRules[index] = { ...newRules[index], value: e.target.value === "true" };
                            handleAddFormChange("validation_rules", newRules);
                          }}
                          sx={{ minHeight: 40 }}
                        >
                          <MenuItem value="true">True</MenuItem>
                          <MenuItem value="false">False</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        size="small"
                        type={VALIDATION_RULE_TYPES.find((rt) => rt.value === rule.type)?.valueType === "integer" ? "number" : "text"}
                        value={rule.value || ""}
                        onChange={(e) => {
                          const newRules = [...addFormData.validation_rules];
                          newRules[index] = { ...newRules[index], value: e.target.value };
                          handleAddFormChange("validation_rules", newRules);
                        }}
                        placeholder="Value"
                        sx={{ width: 150 }}
                        disabled={!rule.type}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        const newRules = [...addFormData.validation_rules, { type: "", value: "" }];
                        handleAddFormChange("validation_rules", newRules);
                      }}
                      sx={{ color: "success.main" }}
                    >
                      <Icon>add</Icon>
                    </IconButton>
                    {index > 0 && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newRules = addFormData.validation_rules.filter((_, i) => i !== index);
                          handleAddFormChange("validation_rules", newRules);
                        }}
                        sx={{ color: "error.main" }}
                      >
                        <Icon>remove</Icon>
                      </IconButton>
                    )}
                  </MDBox>
                ))}
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

      {/* List Options Modal Dialog */}
      <Dialog
        open={listOptionsDialogOpen}
        onClose={handleCloseListOptions}
        aria-labelledby="list-options-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="list-options-dialog-title">Manage List Options</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <MDBox display="flex" gap={1} mb={2}>
              <TextField
                fullWidth
                size="small"
                label="New Option"
                value={newListItem}
                onChange={(e) => setNewListItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddListItem();
                  }
                }}
                placeholder="Type an option and press Enter"
                InputLabelProps={{
                  sx: {
                    fontSize: "0.875rem",
                    fontWeight: 400,
                  },
                }}
                InputProps={{
                  sx: {
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    "& input::placeholder": {
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      opacity: 1,
                    },
                  },
                }}
              />
              <IconButton
                onClick={handleAddListItem}
                disabled={!newListItem.trim()}
                sx={{
                  color: "success.main",
                  border: "1px solid",
                  borderColor: "success.main",
                  "&:hover": {
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                  },
                  "&.Mui-disabled": {
                    borderColor: "grey.400",
                  },
                }}
              >
                <Icon>add</Icon>
              </IconButton>
            </MDBox>
            {getCurrentListOptions().length === 0 ? (
              <MDBox
                sx={{
                  py: 4,
                  textAlign: "center",
                  border: "1px dashed",
                  borderColor: "grey.400",
                  borderRadius: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                }}
              >
                <Icon sx={{ fontSize: 40, color: "grey.400", mb: 1 }}>list</Icon>
                <MDTypography variant="body2" color="text">
                  No options added yet. Add options above.
                </MDTypography>
              </MDBox>
            ) : (
              <MDBox
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  p: 2,
                  border: "1px solid",
                  borderColor: "grey.300",
                  borderRadius: 1,
                  backgroundColor: "rgba(0, 0, 0, 0.02)",
                  maxHeight: 250,
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {getCurrentListOptions().map((option, index) => (
                  <Chip
                    key={option}
                    label={option}
                    onDelete={() => handleRemoveListItem(option)}
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 400,
                      backgroundColor: "white",
                      border: "1px solid",
                      borderColor: "grey.300",
                      "& .MuiChip-deleteIcon": {
                        color: "grey.500",
                        "&:hover": {
                          color: "error.main",
                        },
                      },
                    }}
                  />
                ))}
              </MDBox>
            )}
            <MDTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
              {getCurrentListOptions().length} option{getCurrentListOptions().length !== 1 ? "s" : ""} added
            </MDTypography>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseListOptions} color="info">
            Done
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Column Visibility Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            minWidth: 220,
          },
        }}
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
            <MenuItem
              key={col.id}
              onClick={() => toggleColumnVisibility(col.id)}
              dense
              sx={{ py: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox
                  checked={!hiddenColumns.includes(col.id)}
                  size="small"
                  sx={{ p: 0 }}
                />
              </ListItemIcon>
              <ListItemText
                primary={col.Header}
                primaryTypographyProps={{ variant: "body2", fontSize: "0.875rem" }}
              />
            </MenuItem>
          ))}
      </Menu>
    </DashboardLayout>
  );
}

export default Attributes;
