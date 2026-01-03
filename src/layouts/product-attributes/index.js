/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, useMemo } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FilterListIcon from "@mui/icons-material/FilterList";
import Tooltip from "@mui/material/Tooltip";

// Drag and drop
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Supabase client
import { supabase } from "supabaseClient";

// Sortable Item Component for drag and drop
function SortableAttributeItem({ attr, index, totalCount, onRequiredToggle, onOverviewDisplayToggle, onRemove, renderValueInput }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attr.id || `new-${attr.attribute_id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 4 : 1}
      sx={{ mb: 1, p: 1, borderRadius: 2, cursor: isDragging ? "grabbing" : "default" }}
    >
      <MDBox display="flex" alignItems="center">
        {/* Drag handle */}
        <MDBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          width={40}
          sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon sx={{ color: "grey.500" }} />
        </MDBox>

        {/* Attribute info */}
        <MDBox flex={2} minWidth={0}>
          <MDBox display="flex" alignItems="center" gap={1}>
            <MDTypography variant="button" fontWeight="medium">
              {attr.display_name}
            </MDTypography>
            <Chip
              label={attr.data_type}
              size="small"
              sx={{ fontSize: "0.65rem", height: 18 }}
            />
          </MDBox>
          <MDTypography variant="caption" color="text">
            {attr.attribute_key}
          </MDTypography>
        </MDBox>

        {/* Required toggle */}
        <MDBox width={80} display="flex" flexDirection="column" alignItems="center">
          <Switch
            checked={attr.is_required}
            onChange={() => onRequiredToggle(index)}
            color="info"
            size="small"
          />
          <MDTypography variant="caption" color="text" sx={{ fontSize: "0.6rem" }}>
            Required
          </MDTypography>
        </MDBox>

        {/* Overview display toggle */}
        <MDBox width={80} display="flex" flexDirection="column" alignItems="center">
          <Switch
            checked={attr.is_overview_display || false}
            onChange={() => onOverviewDisplayToggle(index)}
            color="success"
            size="small"
          />
          <MDTypography variant="caption" color="text" sx={{ fontSize: "0.6rem" }}>
            Overview
          </MDTypography>
        </MDBox>

        {/* Value input */}
        <MDBox flex={1} minWidth={150}>
          {renderValueInput(attr, index)}
        </MDBox>

        {/* Remove button */}
        <MDBox width={40} display="flex" justifyContent="center">
          <IconButton
            size="small"
            onClick={() => onRemove(index)}
            sx={{ color: "error.main" }}
          >
            <Icon>close</Icon>
          </IconButton>
        </MDBox>
      </MDBox>
    </Paper>
  );
}

function ProductAttributes() {
  // Products state
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Attributes state
  const [allAttributes, setAllAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(true);
  const [attributeSearchTerm, setAttributeSearchTerm] = useState("");

  // Product attributes (linked attributes with values)
  const [productAttributes, setProductAttributes] = useState([]);
  const [loadingProductAttributes, setLoadingProductAttributes] = useState(false);

  // Modified state for tracking changes
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Error state
  const [error, setError] = useState(null);

  // Template dialog state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateDialogMode, setTemplateDialogMode] = useState("add"); // "add" or "edit"
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    group_id: null,
    filter_attributes: [],
    filter_properties: [], // Which default properties to show as filters
    default_properties: ["scope", "service", "region"], // Default enabled properties
  });
  const [templateLinkedAttributes, setTemplateLinkedAttributes] = useState([]);
  const [loadingTemplateAttributes, setLoadingTemplateAttributes] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Template groups state
  const [templateGroups, setTemplateGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Groups management dialog state
  const [groupsDialogOpen, setGroupsDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", icon: "folder" });
  const [editingGroup, setEditingGroup] = useState(null);
  const [savingGroup, setSavingGroup] = useState(false);

  // Common Material Icons for groups
  const GROUP_ICONS = [
    "folder", "computer", "storage", "memory", "dns", "cloud", "hub",
    "developer_board", "inventory_2", "settings", "category", "layers",
  ];

  // Available default properties that can be toggled per template
  const DEFAULT_PROPERTIES = [
    { key: "scope", label: "Scope", icon: "category" },
    { key: "service", label: "Service", icon: "miscellaneous_services" },
    { key: "service_type", label: "Service Type", icon: "type_specimen" },
    { key: "region", label: "Region", icon: "public" },
  ];

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);

  // Fetch products with related data
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const { data, error: fetchError } = await supabase
        .from("product_templates")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch all attribute definitions
  const fetchAttributes = useCallback(async () => {
    try {
      setLoadingAttributes(true);
      const { data, error: fetchError } = await supabase
        .from("attribute_definitions")
        .select("*")
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (fetchError) throw fetchError;
      setAllAttributes(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAttributes(false);
    }
  }, []);

  // Fetch template groups
  const fetchTemplateGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const { data, error: fetchError } = await supabase
        .from("template_groups")
        .select("id, name, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;
      setTemplateGroups(data || []);
    } catch (err) {
      console.error("Error fetching template groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Fetch product attributes for selected product
  const fetchProductAttributes = useCallback(async (productId) => {
    if (!productId) {
      setProductAttributes([]);
      return;
    }

    try {
      setLoadingProductAttributes(true);
      const { data, error: fetchError } = await supabase
        .from("product_template_attributes")
        .select(`
          *,
          attribute:attribute_definitions(*)
        `)
        .eq("product_template_id", productId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;

      // Helper to get value from the correct typed column based on data_type
      const getTypedValue = (pa) => {
        const dataType = pa.attribute?.data_type?.toLowerCase();
        switch (dataType) {
          case "integer":
            return pa.value_integer?.toString() ?? "";
          case "decimal":
            return pa.value_decimal?.toString() ?? "";
          case "boolean":
            return pa.value_boolean?.toString() ?? "";
          case "json":
            return pa.value_json ? JSON.stringify(pa.value_json) : "";
          case "text":
            return pa.value_text ?? "";
          case "list":
            return pa.value_string ?? "";
          case "string":
          default:
            return pa.value_string ?? "";
        }
      };

      // Transform data to include attribute details
      const transformed = (data || []).map((pa) => ({
        id: pa.id,
        attribute_id: pa.attribute?.id,
        attribute_key: pa.attribute?.attribute_key,
        display_name: pa.attribute?.display_name,
        data_type: pa.attribute?.data_type,
        unit: pa.attribute?.unit,
        is_required: pa.is_required,
        is_overview_display: pa.is_overview_display || false,
        attribute_value: getTypedValue(pa),
        sort_order: pa.sort_order,
        tags: pa.attribute?.tags,
        list_options: pa.attribute?.list_options,
      }));

      setProductAttributes(transformed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProductAttributes(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchAttributes();
    fetchTemplateGroups();
  }, [fetchProducts, fetchAttributes, fetchTemplateGroups]);

  // Fetch product attributes when product changes
  useEffect(() => {
    if (selectedProduct) {
      fetchProductAttributes(selectedProduct.id);
      setHasChanges(false);
    } else {
      setProductAttributes([]);
    }
  }, [selectedProduct, fetchProductAttributes]);

  // Handle product selection
  const handleProductSelect = (product) => {
    // Skip if same product is already selected
    if (selectedProduct?.id === product.id) {
      return;
    }
    if (hasChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to switch products?")) {
        return;
      }
    }
    setSelectedProduct(product);
  };

  // Template CRUD handlers
  const handleOpenAddTemplate = () => {
    setTemplateDialogMode("add");
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      group_id: null,
      filter_attributes: [],
      filter_properties: [], // No property filters by default for new templates
      default_properties: ["scope", "service", "region"], // Default enabled properties for new templates
    });
    setTemplateLinkedAttributes([]);
    setTemplateDialogOpen(true);
  };

  const handleOpenEditTemplate = async (template, e) => {
    e.stopPropagation();
    setTemplateDialogMode("edit");
    setEditingTemplate(template);
    // Parse default_properties - if null/undefined, use all properties for backward compatibility
    const defaultProps = template.default_properties;
    const parsedDefaultProperties = Array.isArray(defaultProps)
      ? defaultProps
      : ["scope", "service", "region"]; // Default for existing templates without this field
    // Parse filter_properties
    const filterProps = template.filter_properties;
    const parsedFilterProperties = Array.isArray(filterProps) ? filterProps : [];
    setTemplateForm({
      name: template.name,
      group_id: template.group_id || null,
      filter_attributes: Array.isArray(template.filter_attributes) ? template.filter_attributes : [],
      filter_properties: parsedFilterProperties,
      default_properties: parsedDefaultProperties,
    });
    setTemplateDialogOpen(true);

    // Fetch linked attributes for this template
    try {
      setLoadingTemplateAttributes(true);
      const { data, error: fetchError } = await supabase
        .from("product_template_attributes")
        .select(`
          attribute_definition_id,
          attribute:attribute_definitions(id, display_name, attribute_key, data_type)
        `)
        .eq("product_template_id", template.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;

      const attrs = (data || [])
        .filter((pa) => pa.attribute?.id)
        .map((pa) => ({
          id: pa.attribute.id,
          display_name: pa.attribute.display_name,
          attribute_key: pa.attribute.attribute_key,
          data_type: pa.attribute.data_type,
        }));
      setTemplateLinkedAttributes(attrs);
    } catch (err) {
      console.error("Error fetching template attributes:", err);
      setTemplateLinkedAttributes([]);
    } finally {
      setLoadingTemplateAttributes(false);
    }
  };

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      group_id: null,
      filter_attributes: [],
      filter_properties: [],
      default_properties: ["scope", "service", "region"],
    });
    setTemplateLinkedAttributes([]);
  };

  // Toggle filter attribute
  const handleToggleFilterAttribute = (attributeId) => {
    setTemplateForm((prev) => {
      const currentFilters = prev.filter_attributes || [];
      if (currentFilters.includes(attributeId)) {
        return { ...prev, filter_attributes: currentFilters.filter((id) => id !== attributeId) };
      } else {
        return { ...prev, filter_attributes: [...currentFilters, attributeId] };
      }
    });
  };

  // Toggle filter property (for default properties like scope, service, etc.)
  const handleToggleFilterProperty = (propertyKey) => {
    setTemplateForm((prev) => {
      const currentFilters = prev.filter_properties || [];
      if (currentFilters.includes(propertyKey)) {
        return { ...prev, filter_properties: currentFilters.filter((key) => key !== propertyKey) };
      } else {
        return { ...prev, filter_properties: [...currentFilters, propertyKey] };
      }
    });
  };

  // Toggle default property
  const handleToggleDefaultProperty = (propertyKey) => {
    setTemplateForm((prev) => {
      const currentProps = prev.default_properties || [];
      if (currentProps.includes(propertyKey)) {
        return { ...prev, default_properties: currentProps.filter((key) => key !== propertyKey) };
      } else {
        return { ...prev, default_properties: [...currentProps, propertyKey] };
      }
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      setSnackbar({ open: true, message: "Template name is required", severity: "error" });
      return;
    }

    try {
      setSavingTemplate(true);

      if (templateDialogMode === "add") {
        const { error: insertError } = await supabase.from("product_templates").insert({
          name: templateForm.name.trim(),
          group_id: templateForm.group_id || null,
          default_properties: templateForm.default_properties.length > 0 ? templateForm.default_properties : null,
          filter_properties: templateForm.filter_properties.length > 0 ? templateForm.filter_properties : null,
          is_active: true,
        });
        if (insertError) throw insertError;
        setSnackbar({ open: true, message: "Template created successfully!", severity: "success" });
      } else {
        const { error: updateError } = await supabase
          .from("product_templates")
          .update({
            name: templateForm.name.trim(),
            group_id: templateForm.group_id || null,
            filter_attributes: templateForm.filter_attributes.length > 0 ? templateForm.filter_attributes : null,
            filter_properties: templateForm.filter_properties.length > 0 ? templateForm.filter_properties : null,
            default_properties: templateForm.default_properties.length > 0 ? templateForm.default_properties : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTemplate.id);
        if (updateError) throw updateError;
        setSnackbar({ open: true, message: "Template updated successfully!", severity: "success" });

        // Update selected product if it was the one being edited
        if (selectedProduct?.id === editingTemplate.id) {
          setSelectedProduct({
            ...selectedProduct,
            name: templateForm.name.trim(),
            group_id: templateForm.group_id,
            filter_attributes: templateForm.filter_attributes,
            filter_properties: templateForm.filter_properties,
            default_properties: templateForm.default_properties,
          });
        }
      }

      handleCloseTemplateDialog();
      fetchProducts();
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleOpenDeleteTemplate = (template, e) => {
    e.stopPropagation();
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;

    try {
      setSavingTemplate(true);

      // Soft delete the template
      const { error: deleteError } = await supabase
        .from("product_templates")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", deletingTemplate.id);

      if (deleteError) throw deleteError;

      // Clear selection if deleted template was selected
      if (selectedProduct?.id === deletingTemplate.id) {
        setSelectedProduct(null);
        setProductAttributes([]);
      }

      setSnackbar({ open: true, message: "Template deleted successfully!", severity: "success" });
      handleCloseDeleteDialog();
      fetchProducts();
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    } finally {
      setSavingTemplate(false);
    }
  };

  // Groups management handlers
  const handleOpenGroupsDialog = () => {
    setGroupsDialogOpen(true);
    setEditingGroup(null);
    setGroupForm({ name: "", icon: "folder" });
  };

  const handleCloseGroupsDialog = () => {
    setGroupsDialogOpen(false);
    setEditingGroup(null);
    setGroupForm({ name: "", icon: "folder" });
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, icon: group.icon || "folder" });
  };

  const handleCancelEditGroup = () => {
    setEditingGroup(null);
    setGroupForm({ name: "", icon: "folder" });
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      setSnackbar({ open: true, message: "Group name is required", severity: "error" });
      return;
    }

    try {
      setSavingGroup(true);

      if (editingGroup) {
        // Update existing group
        const { error: updateError } = await supabase
          .from("template_groups")
          .update({
            name: groupForm.name.trim(),
            icon: groupForm.icon,
          })
          .eq("id", editingGroup.id);

        if (updateError) throw updateError;
        setSnackbar({ open: true, message: "Group updated successfully!", severity: "success" });
      } else {
        // Create new group
        const maxSortOrder = templateGroups.length > 0
          ? Math.max(...templateGroups.map((g) => g.sort_order || 0)) + 1
          : 0;

        const { error: insertError } = await supabase.from("template_groups").insert({
          name: groupForm.name.trim(),
          icon: groupForm.icon,
          sort_order: maxSortOrder,
          is_active: true,
        });

        if (insertError) throw insertError;
        setSnackbar({ open: true, message: "Group created successfully!", severity: "success" });
      }

      setEditingGroup(null);
      setGroupForm({ name: "", icon: "folder" });
      fetchTemplateGroups();
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    // Check if any templates are using this group
    const templatesUsingGroup = products.filter((t) => t.group_id === group.id);
    if (templatesUsingGroup.length > 0) {
      setSnackbar({
        open: true,
        message: `Cannot delete: ${templatesUsingGroup.length} template(s) are using this group`,
        severity: "error",
      });
      return;
    }

    try {
      setSavingGroup(true);
      const { error: deleteError } = await supabase
        .from("template_groups")
        .update({ is_active: false })
        .eq("id", group.id);

      if (deleteError) throw deleteError;
      setSnackbar({ open: true, message: "Group deleted successfully!", severity: "success" });
      fetchTemplateGroups();
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    } finally {
      setSavingGroup(false);
    }
  };

  // Parse tags string to array
  const parseTags = (tagsString) => {
    if (!tagsString) return [];
    const cleaned = tagsString.replace(/[{}'"]/g, "").trim();
    if (!cleaned) return [];
    return cleaned.split(",").map((tag) => tag.trim()).filter(Boolean);
  };

  // Get set of linked attribute IDs for quick lookup (memoized for performance)
  // Convert to strings to ensure consistent comparison
  const linkedAttributeIds = useMemo(() => {
    return new Set(productAttributes.map((pa) => String(pa.attribute_id)));
  }, [productAttributes]);

  // Filter attributes based on search (show all, both linked and unlinked)
  const filteredAttributes = useMemo(() => {
    return allAttributes.filter((attr) => {
      if (!attributeSearchTerm.trim()) return true;
      const search = attributeSearchTerm.toLowerCase();
      const tags = parseTags(attr.tags);
      return (
        (attr.attribute_key && attr.attribute_key.toLowerCase().includes(search)) ||
        (attr.display_name && attr.display_name.toLowerCase().includes(search)) ||
        tags.some((tag) => tag.toLowerCase().includes(search))
      );
    });
  }, [allAttributes, attributeSearchTerm]);

  // Check if an attribute is linked to the product
  const isAttributeLinked = useCallback((attributeId) => {
    return linkedAttributeIds.has(String(attributeId));
  }, [linkedAttributeIds]);

  // Handle attribute link/unlink
  const handleAttributeToggle = (attribute) => {
    if (isAttributeLinked(attribute.id)) {
      // Unlink attribute - use String comparison for consistency
      setProductAttributes((prev) =>
        prev.filter((pa) => String(pa.attribute_id) !== String(attribute.id))
      );
    } else {
      // Link attribute
      const newAttribute = {
        id: null, // Will be assigned on save
        attribute_id: attribute.id,
        attribute_key: attribute.attribute_key,
        display_name: attribute.display_name,
        data_type: attribute.data_type,
        unit: attribute.unit,
        is_required: false, // Default to false, user can toggle in the linked attributes panel
        is_overview_display: false, // Default to false, user can toggle in the linked attributes panel
        attribute_value: attribute.default_value || "",
        sort_order: productAttributes.length + 1,
        tags: attribute.tags,
        list_options: attribute.list_options,
      };
      setProductAttributes((prev) => [...prev, newAttribute]);
    }
    setHasChanges(true);
  };

  // Handle required toggle - use index for precise targeting
  const handleRequiredToggle = (index) => {
    setProductAttributes((prev) =>
      prev.map((pa, idx) => (idx === index ? { ...pa, is_required: !pa.is_required } : pa))
    );
    setHasChanges(true);
  };

  // Handle overview display toggle - use index for precise targeting
  const handleOverviewDisplayToggle = (index) => {
    setProductAttributes((prev) =>
      prev.map((pa, idx) => (idx === index ? { ...pa, is_overview_display: !pa.is_overview_display } : pa))
    );
    setHasChanges(true);
  };

  // Handle attribute value change - use index for precise targeting
  const handleValueChange = (index, value) => {
    setProductAttributes((prev) =>
      prev.map((pa, idx) => (idx === index ? { ...pa, attribute_value: value } : pa))
    );
    setHasChanges(true);
  };

  // Handle remove attribute by index (for linked attributes panel)
  const handleRemoveAttribute = (index) => {
    setProductAttributes((prev) => prev.filter((_, idx) => idx !== index));
    setHasChanges(true);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = productAttributes.findIndex(
        (attr) => (attr.id || `new-${attr.attribute_id}`) === active.id
      );
      const newIndex = productAttributes.findIndex(
        (attr) => (attr.id || `new-${attr.attribute_id}`) === over.id
      );

      const newAttributes = arrayMove(productAttributes, oldIndex, newIndex);
      // Update sort_order based on new positions
      const updatedAttributes = newAttributes.map((attr, idx) => ({
        ...attr,
        sort_order: idx + 1,
      }));
      setProductAttributes(updatedAttributes);
      setHasChanges(true);
    }
  };

  // Render value input based on data type
  const renderValueInput = (attr, index) => {
    const value = attr.attribute_value || "";

    switch (attr.data_type?.toLowerCase()) {
      case "boolean":
        return (
          <Switch
            checked={value === "true" || value === true}
            onChange={(e) => handleValueChange(index, e.target.checked.toString())}
            color="info"
            size="small"
          />
        );
      case "integer":
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            value={value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            InputProps={{
              endAdornment: attr.unit ? (
                <InputAdornment position="end">{attr.unit}</InputAdornment>
              ) : null,
            }}
            inputProps={{ step: 1 }}
          />
        );
      case "decimal":
        return (
          <TextField
            fullWidth
            size="small"
            type="number"
            value={value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            InputProps={{
              endAdornment: attr.unit ? (
                <InputAdornment position="end">{attr.unit}</InputAdornment>
              ) : null,
            }}
            inputProps={{ step: "0.01" }}
          />
        );
      case "json":
        return (
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={3}
            value={value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder='{"key": "value"}'
          />
        );
      case "text":
        return (
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            maxRows={6}
            value={value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            placeholder="Enter rich text content..."
          />
        );
      case "list": {
        const listOptions = Array.isArray(attr.list_options) ? attr.list_options : [];
        return (
          <FormControl fullWidth size="small">
            <Select
              value={value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              displayEmpty
              sx={{ minHeight: 40 }}
            >
              <MenuItem value="">
                <em>Select an option</em>
              </MenuItem>
              {listOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      }
      default: // string
        return (
          <TextField
            fullWidth
            size="small"
            value={value}
            onChange={(e) => handleValueChange(index, e.target.value)}
            InputProps={{
              endAdornment: attr.unit ? (
                <InputAdornment position="end">{attr.unit}</InputAdornment>
              ) : null,
            }}
          />
        );
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);

      // Get existing product attributes from DB - select all columns to find FK name
      const { data: existingData, error: fetchError } = await supabase
        .from("product_template_attributes")
        .select("*, attribute:attribute_definitions(id)")
        .eq("product_template_id", selectedProduct.id)
        .eq("is_active", true);

      if (fetchError) throw fetchError;

      // Map existing data to include attribute_id from the joined table
      const existingMapped = (existingData || []).map((e) => ({
        id: e.id,
        attribute_id: e.attribute?.id,
      }));

      const existingIds = new Set(existingMapped.map((e) => e.attribute_id));
      const currentIds = new Set(productAttributes.map((pa) => pa.attribute_id));

      // Re-assign sort_order based on current array position (1-indexed, zero-padded for proper text sorting)
      const productAttributesWithOrder = productAttributes.map((pa, index) => ({
        ...pa,
        sort_order: String(index + 1).padStart(4, "0"), // "0001", "0002", etc. for proper text sorting
      }));

      // Attributes to soft delete (in DB but not in current state)
      const toDelete = existingMapped.filter((e) => !currentIds.has(e.attribute_id));

      // Attributes to insert (in current state but not in DB)
      const toInsert = productAttributesWithOrder.filter((pa) => !existingIds.has(pa.attribute_id));

      // Attributes to update (in both)
      const toUpdate = productAttributesWithOrder.filter((pa) => existingIds.has(pa.attribute_id));

      // Perform soft deletes
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("product_template_attributes")
          .update({
            is_active: false,
            deleted_at: new Date().toISOString(),
          })
          .in(
            "id",
            toDelete.map((d) => d.id)
          );

        if (deleteError) throw deleteError;
      }

      // Helper to build typed value columns based on data_type
      const getTypedValueColumns = (pa) => {
        const dataType = pa.data_type?.toLowerCase();
        const value = pa.attribute_value;

        // Reset all value columns to null first
        const columns = {
          value_string: null,
          value_integer: null,
          value_decimal: null,
          value_boolean: null,
          value_json: null,
          value_text: null,
        };

        // Set the appropriate column based on data_type
        if (value !== "" && value !== null && value !== undefined) {
          switch (dataType) {
            case "integer":
              columns.value_integer = parseInt(value, 10) || null;
              break;
            case "decimal":
              columns.value_decimal = parseFloat(value) || null;
              break;
            case "boolean":
              columns.value_boolean = value === "true" || value === true;
              break;
            case "json":
              try {
                columns.value_json = typeof value === "string" ? JSON.parse(value) : value;
              } catch {
                columns.value_json = null;
              }
              break;
            case "text":
              columns.value_text = value?.toString() || null;
              break;
            case "list":
              columns.value_string = value?.toString() || null;
              break;
            case "string":
            default:
              columns.value_string = value?.toString() || null;
              break;
          }
        }

        return columns;
      };

      // Perform inserts
      if (toInsert.length > 0) {
        const insertData = toInsert.map((pa) => ({
          product_template_id: selectedProduct.id,
          attribute_definition_id: pa.attribute_id,
          is_required: pa.is_required ?? false,
          is_overview_display: pa.is_overview_display ?? false,
          sort_order: pa.sort_order?.toString() || "0",
          is_active: true,
          ...getTypedValueColumns(pa),
        }));

        const { error: insertError } = await supabase.from("product_template_attributes").insert(insertData);

        if (insertError) throw insertError;
      }

      // Perform updates
      for (const pa of toUpdate) {
        const existingRecord = existingMapped.find((e) => e.attribute_id === pa.attribute_id);
        if (existingRecord) {
          const { error: updateError } = await supabase
            .from("product_template_attributes")
            .update({
              is_required: pa.is_required ?? false,
              is_overview_display: pa.is_overview_display ?? false,
              sort_order: pa.sort_order?.toString() || "0",
              ...getTypedValueColumns(pa),
            })
            .eq("id", existingRecord.id);

          if (updateError) throw updateError;
        }
      }

      // Refresh data
      await fetchProductAttributes(selectedProduct.id);
      setHasChanges(false);
      setSnackbar({ open: true, message: "Changes saved successfully!", severity: "success" });
    } catch (err) {
      console.error("Error saving:", err);
      setSnackbar({ open: true, message: `Error saving: ${err.message}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          {/* Products List */}
          <Grid item xs={12} md={3}>
            <Card sx={{ height: "calc(100vh - 250px)", display: "flex", flexDirection: "column" }}>
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
                  Product Templates
                </MDTypography>
                <MDBox display="flex" gap={0.5}>
                  <Tooltip title="Manage Groups">
                    <IconButton
                      size="small"
                      onClick={handleOpenGroupsDialog}
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderRadius: 1,
                        padding: "4px 8px",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.3)",
                        },
                      }}
                    >
                      <Icon fontSize="small">folder</Icon>
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Template">
                    <IconButton
                      size="small"
                      onClick={handleOpenAddTemplate}
                      sx={{
                        color: "white",
                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                        borderRadius: 1,
                        padding: "4px 8px",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.3)",
                        },
                      }}
                    >
                      <Icon fontSize="small">add</Icon>
                    </IconButton>
                  </Tooltip>
                </MDBox>
              </MDBox>
              <MDBox p={2} sx={{ flex: 1, overflow: "auto" }}>
                {loadingProducts ? (
                  <MDBox display="flex" justifyContent="center" py={3}>
                    <CircularProgress color="info" size={30} />
                  </MDBox>
                ) : products.length === 0 ? (
                  <MDBox display="flex" flexDirection="column" alignItems="center" py={3}>
                    <MDTypography variant="body2" color="text" mb={1}>
                      No product templates found.
                    </MDTypography>
                    <MDButton variant="outlined" color="info" size="small" onClick={handleOpenAddTemplate}>
                      Add Template
                    </MDButton>
                  </MDBox>
                ) : (
                  <List dense>
                    {products.map((product) => (
                      <ListItem
                        key={product.id}
                        button
                        selected={selectedProduct?.id === product.id}
                        onClick={() => handleProductSelect(product)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          pr: 8,
                          "&.Mui-selected": {
                            backgroundColor: "rgba(26, 115, 232, 0.1)",
                            "&:hover": {
                              backgroundColor: "rgba(26, 115, 232, 0.15)",
                            },
                          },
                        }}
                      >
                        <ListItemText
                          primary={product.name}
                          primaryTypographyProps={{ variant: "button", fontWeight: "medium" }}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenEditTemplate(product, e)}
                            sx={{ mr: 0.5 }}
                          >
                            <Icon fontSize="small">edit</Icon>
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenDeleteTemplate(product, e)}
                            sx={{ color: "error.main" }}
                          >
                            <Icon fontSize="small">delete</Icon>
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </MDBox>
            </Card>
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={3}>
              {/* Linked Attributes */}
              <Grid item xs={12} md={7}>
                <Card sx={{ height: "calc(100vh - 250px)", display: "flex", flexDirection: "column" }}>
                  <MDBox
                    mx={2}
                    mt={-3}
                    py={1}
                    px={2}
                    variant="gradient"
                    bgColor="success"
                    borderRadius="lg"
                    coloredShadow="success"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <MDTypography variant="h6" color="white">
                      Linked Attributes
                      {selectedProduct && (
                        <MDTypography
                          component="span"
                          variant="caption"
                          color="white"
                          sx={{ ml: 1, opacity: 0.8 }}
                        >
                          ({productAttributes.length})
                        </MDTypography>
                      )}
                    </MDTypography>
                    {hasChanges && (
                      <MDButton
                        variant="contained"
                        color="white"
                        size="small"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </MDButton>
                    )}
                  </MDBox>
                  <MDBox p={2} sx={{ flex: 1, overflow: "auto" }}>
                    {!selectedProduct ? (
                      <MDBox
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                      >
                        <MDTypography variant="body2" color="text">
                          Select a product to manage attributes
                        </MDTypography>
                      </MDBox>
                    ) : loadingProductAttributes ? (
                      <MDBox display="flex" justifyContent="center" py={3}>
                        <CircularProgress color="info" size={30} />
                      </MDBox>
                    ) : productAttributes.length === 0 ? (
                      <MDBox
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                      >
                        <MDTypography variant="body2" color="text">
                          No attributes linked. Use the panel on the right to add attributes.
                        </MDTypography>
                      </MDBox>
                    ) : (
                      <MDBox>
                        {/* Column Headers */}
                        <MDBox
                          display="flex"
                          alignItems="center"
                          px={1}
                          py={1}
                          mb={1}
                          sx={{
                            borderBottom: "1px solid",
                            borderColor: "grey.300",
                          }}
                        >
                          <MDBox width={40} /> {/* Space for drag handle */}
                          <MDBox flex={2} minWidth={0}>
                            <MDTypography variant="caption" fontWeight="bold" color="text">
                              Attribute
                            </MDTypography>
                          </MDBox>
                          <MDBox width={100} textAlign="center">
                            <MDTypography variant="caption" fontWeight="bold" color="text">
                              Required
                            </MDTypography>
                          </MDBox>
                          <MDBox flex={1} minWidth={150}>
                            <MDTypography variant="caption" fontWeight="bold" color="text">
                              Value
                            </MDTypography>
                          </MDBox>
                          <MDBox width={40} /> {/* Space for remove button */}
                        </MDBox>

                        {/* Sortable Attribute Rows */}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={productAttributes.map((attr) => attr.id || `new-${attr.attribute_id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {productAttributes.map((attr, index) => (
                              <SortableAttributeItem
                                key={attr.id || `new-${attr.attribute_id}`}
                                attr={attr}
                                index={index}
                                totalCount={productAttributes.length}
                                onRequiredToggle={handleRequiredToggle}
                                onOverviewDisplayToggle={handleOverviewDisplayToggle}
                                onRemove={handleRemoveAttribute}
                                renderValueInput={renderValueInput}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </MDBox>
                    )}
                  </MDBox>
                </Card>
              </Grid>

              {/* Available Attributes */}
              <Grid item xs={12} md={5}>
                <Card sx={{ height: "calc(100vh - 250px)", display: "flex", flexDirection: "column" }}>
                  <MDBox
                    mx={2}
                    mt={-3}
                    py={1}
                    px={2}
                    variant="gradient"
                    bgColor="secondary"
                    borderRadius="lg"
                    coloredShadow="secondary"
                  >
                    <MDTypography variant="h6" color="white">
                      Available Attributes
                    </MDTypography>
                  </MDBox>
                  <MDBox p={2}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search by name or tags..."
                      value={attributeSearchTerm}
                      onChange={(e) => setAttributeSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Icon>search</Icon>
                          </InputAdornment>
                        ),
                        endAdornment: attributeSearchTerm && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setAttributeSearchTerm("")}>
                              <Icon fontSize="small">close</Icon>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </MDBox>
                  <Divider />
                  <MDBox px={2} pb={2} sx={{ flex: 1, overflow: "auto" }}>
                    {loadingAttributes ? (
                      <MDBox display="flex" justifyContent="center" py={3}>
                        <CircularProgress color="info" size={30} />
                      </MDBox>
                    ) : !selectedProduct ? (
                      <MDBox
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        height="100%"
                      >
                        <MDTypography variant="body2" color="text">
                          Select a product first
                        </MDTypography>
                      </MDBox>
                    ) : filteredAttributes.length === 0 ? (
                      <MDTypography variant="body2" color="text" sx={{ mt: 2 }}>
                        No attributes found.
                      </MDTypography>
                    ) : (
                      <List dense>
                        {filteredAttributes.map((attr) => {
                          const isLinked = linkedAttributeIds.has(String(attr.id));
                          const tags = parseTags(attr.tags);

                          return (
                            <ListItem
                              key={attr.id}
                              sx={{
                                borderRadius: 1,
                                mb: 0.5,
                                backgroundColor: isLinked
                                  ? "rgba(76, 175, 80, 0.08)"
                                  : "transparent",
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <Checkbox
                                  checked={isLinked}
                                  onChange={() => handleAttributeToggle(attr)}
                                  size="small"
                                  icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 20, color: "#9e9e9e" }} />}
                                  checkedIcon={<CheckBoxIcon sx={{ fontSize: 20, color: "#4caf50" }} />}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <MDBox display="flex" alignItems="center" gap={0.5}>
                                    <MDTypography variant="button" fontWeight="medium">
                                      {attr.display_name}
                                    </MDTypography>
                                  </MDBox>
                                }
                                secondary={
                                  <MDBox>
                                    <MDTypography variant="caption" color="text">
                                      {attr.attribute_key} ({attr.data_type})
                                      {attr.unit && ` • ${attr.unit}`}
                                    </MDTypography>
                                    {tags.length > 0 && (
                                      <MDBox display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                                        {tags.map((tag, idx) => (
                                          <Chip
                                            key={idx}
                                            label={tag}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: "0.6rem", height: 18 }}
                                          />
                                        ))}
                                      </MDBox>
                                    )}
                                  </MDBox>
                                }
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    )}
                  </MDBox>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Error display */}
      {error && (
        <MDBox px={3} pb={3}>
          <MDTypography variant="body2" color="error">
            Error: {error}
          </MDTypography>
        </MDBox>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Add/Edit Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={handleCloseTemplateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {templateDialogMode === "add" ? "Add Product Template" : "Edit Product Template"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={templateForm.name}
            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            onKeyPress={(e) => {
              if (e.key === "Enter" && templateDialogMode === "add") {
                handleSaveTemplate();
              }
            }}
          />

          {/* Template Group Selection */}
          <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
            <MDTypography variant="caption" fontWeight="medium" color="text" sx={{ mb: 0.5 }}>
              Template Group
            </MDTypography>
            <Select
              value={templateForm.group_id || ""}
              onChange={(e) => setTemplateForm({ ...templateForm, group_id: e.target.value || null })}
              displayEmpty
              sx={{ minHeight: 44 }}
            >
              <MenuItem value="">
                <em>No Group (Ungrouped)</em>
              </MenuItem>
              {templateGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  <MDBox display="flex" alignItems="center" gap={1}>
                    <Icon fontSize="small">{group.icon || "folder"}</Icon>
                    {group.name}
                  </MDBox>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Default Properties Section */}
          <MDBox
            mt={3}
            sx={{
              p: 2,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(76, 175, 80, 0.04) 0%, rgba(76, 175, 80, 0.08) 100%)",
              border: "1px solid",
              borderColor: "rgba(76, 175, 80, 0.15)",
            }}
          >
            <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <MDBox display="flex" alignItems="center" gap={1}>
                <MDBox
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
                  }}
                >
                  <Icon sx={{ color: "white", fontSize: 18 }}>tune</Icon>
                </MDBox>
                <MDBox>
                  <MDTypography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                    Default Properties
                  </MDTypography>
                  <MDTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                    Select which properties to show for products
                  </MDTypography>
                </MDBox>
              </MDBox>
              <Tooltip title="These properties will appear as columns and form fields for products using this template">
                <Icon sx={{ fontSize: 18, color: "success.main", cursor: "help" }}>info_outline</Icon>
              </Tooltip>
            </MDBox>

            <MDBox
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "rgba(255, 255, 255, 0.6)",
              }}
            >
              {DEFAULT_PROPERTIES.map((prop) => {
                const isEnabled = (templateForm.default_properties || []).includes(prop.key);
                return (
                  <Chip
                    key={prop.key}
                    label={
                      <MDBox display="flex" alignItems="center" gap={0.5}>
                        <Icon sx={{ fontSize: 16 }}>{prop.icon}</Icon>
                        <span>{prop.label}</span>
                      </MDBox>
                    }
                    onClick={() => handleToggleDefaultProperty(prop.key)}
                    sx={{
                      height: "auto",
                      py: 0.75,
                      px: 0.5,
                      borderRadius: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      backgroundColor: isEnabled ? "success.main" : "rgba(0, 0, 0, 0.06)",
                      color: isEnabled ? "white" : "text.primary",
                      border: "1px solid",
                      borderColor: isEnabled ? "success.main" : "rgba(0, 0, 0, 0.1)",
                      boxShadow: isEnabled ? "0 2px 8px rgba(76, 175, 80, 0.35)" : "none",
                      "& .MuiChip-label": {
                        px: 1,
                        fontSize: "0.8rem",
                        fontWeight: isEnabled ? 500 : 400,
                      },
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: isEnabled
                          ? "0 4px 12px rgba(76, 175, 80, 0.4)"
                          : "0 2px 8px rgba(0, 0, 0, 0.1)",
                        backgroundColor: isEnabled ? "success.dark" : "rgba(0, 0, 0, 0.1)",
                      },
                      "&:active": {
                        transform: "translateY(0)",
                      },
                    }}
                  />
                );
              })}
            </MDBox>
            {templateForm.default_properties?.length > 0 && (
              <MDBox
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
                gap={0.5}
                mt={1.5}
              >
                <Chip
                  size="small"
                  label={`${templateForm.default_properties.length} of ${DEFAULT_PROPERTIES.length} enabled`}
                  sx={{
                    height: 22,
                    backgroundColor: "success.main",
                    color: "white",
                    fontWeight: 500,
                    fontSize: "0.7rem",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </MDBox>
            )}
          </MDBox>

          {/* Filter Properties Section - Show which default properties to use as filters */}
          {templateForm.default_properties?.length > 0 && (
            <MDBox
              mt={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: "linear-gradient(135deg, rgba(156, 39, 176, 0.04) 0%, rgba(156, 39, 176, 0.08) 100%)",
                border: "1px solid",
                borderColor: "rgba(156, 39, 176, 0.15)",
              }}
            >
              <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <MDBox display="flex" alignItems="center" gap={1}>
                  <MDBox
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(156, 39, 176, 0.3)",
                    }}
                  >
                    <FilterListIcon sx={{ color: "white", fontSize: 18 }} />
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                      Property Filters
                    </MDTypography>
                    <MDTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                      Select which properties to show as filters
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <Tooltip title="Selected properties will appear as filter dropdowns on the Products page">
                  <Icon sx={{ fontSize: 18, color: "secondary.main", cursor: "help" }}>info_outline</Icon>
                </Tooltip>
              </MDBox>

              <MDBox
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: "rgba(255, 255, 255, 0.6)",
                }}
              >
                {DEFAULT_PROPERTIES.filter((prop) =>
                  (templateForm.default_properties || []).includes(prop.key)
                ).map((prop) => {
                  const isFilterEnabled = (templateForm.filter_properties || []).includes(prop.key);
                  return (
                    <Chip
                      key={prop.key}
                      label={
                        <MDBox display="flex" alignItems="center" gap={0.5}>
                          <Icon sx={{ fontSize: 16 }}>{prop.icon}</Icon>
                          <span>{prop.label}</span>
                        </MDBox>
                      }
                      icon={isFilterEnabled ? <FilterListIcon sx={{ fontSize: 16 }} /> : null}
                      onClick={() => handleToggleFilterProperty(prop.key)}
                      sx={{
                        height: "auto",
                        py: 0.75,
                        px: 0.5,
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        backgroundColor: isFilterEnabled ? "secondary.main" : "rgba(0, 0, 0, 0.06)",
                        color: isFilterEnabled ? "white" : "text.primary",
                        border: "1px solid",
                        borderColor: isFilterEnabled ? "secondary.main" : "rgba(0, 0, 0, 0.1)",
                        boxShadow: isFilterEnabled ? "0 2px 8px rgba(156, 39, 176, 0.35)" : "none",
                        "& .MuiChip-label": {
                          px: 1,
                          fontSize: "0.8rem",
                          fontWeight: isFilterEnabled ? 500 : 400,
                        },
                        "& .MuiChip-icon": {
                          color: "inherit",
                          ml: 0.5,
                        },
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: isFilterEnabled
                            ? "0 4px 12px rgba(156, 39, 176, 0.4)"
                            : "0 2px 8px rgba(0, 0, 0, 0.1)",
                          backgroundColor: isFilterEnabled ? "secondary.dark" : "rgba(0, 0, 0, 0.1)",
                        },
                        "&:active": {
                          transform: "translateY(0)",
                        },
                      }}
                    />
                  );
                })}
              </MDBox>
              {templateForm.filter_properties?.length > 0 && (
                <MDBox
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-end"
                  gap={0.5}
                  mt={1.5}
                >
                  <Chip
                    size="small"
                    label={`${templateForm.filter_properties.length} filter${templateForm.filter_properties.length !== 1 ? "s" : ""} active`}
                    sx={{
                      height: 22,
                      backgroundColor: "secondary.main",
                      color: "white",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </MDBox>
              )}
            </MDBox>
          )}

          {/* Filter Attributes Section - Only show when editing and has linked attributes */}
          {templateDialogMode === "edit" && (
            <MDBox
              mt={3}
              sx={{
                p: 2,
                borderRadius: 2,
                background: "linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(25, 118, 210, 0.08) 100%)",
                border: "1px solid",
                borderColor: "rgba(25, 118, 210, 0.15)",
              }}
            >
              <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                <MDBox display="flex" alignItems="center" gap={1}>
                  <MDBox
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(25, 118, 210, 0.3)",
                    }}
                  >
                    <FilterListIcon sx={{ color: "white", fontSize: 18 }} />
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                      Filter Attributes
                    </MDTypography>
                    <MDTypography variant="caption" color="text" sx={{ opacity: 0.7 }}>
                      Click to toggle filter visibility
                    </MDTypography>
                  </MDBox>
                </MDBox>
                <Tooltip title="Selected attributes will appear as filter dropdowns next to the search box on the Products page">
                  <Icon sx={{ fontSize: 18, color: "info.main", cursor: "help" }}>info_outline</Icon>
                </Tooltip>
              </MDBox>

              {loadingTemplateAttributes ? (
                <MDBox display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={24} color="info" />
                </MDBox>
              ) : templateLinkedAttributes.length === 0 ? (
                <MDBox
                  sx={{
                    py: 3,
                    px: 2,
                    borderRadius: 1.5,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    border: "1px dashed",
                    borderColor: "rgba(25, 118, 210, 0.3)",
                    textAlign: "center",
                  }}
                >
                  <Icon sx={{ fontSize: 36, color: "grey.400", mb: 1 }}>filter_list_off</Icon>
                  <MDTypography variant="body2" color="text">
                    No attributes linked yet
                  </MDTypography>
                  <MDTypography variant="caption" color="text" sx={{ opacity: 0.6 }}>
                    Link attributes to this template first
                  </MDTypography>
                </MDBox>
              ) : (
                <MDBox
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxHeight: 180,
                    overflowY: "auto",
                    p: 1.5,
                    borderRadius: 1.5,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(0, 0, 0, 0.05)",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(25, 118, 210, 0.3)",
                      borderRadius: "3px",
                      "&:hover": {
                        background: "rgba(25, 118, 210, 0.5)",
                      },
                    },
                  }}
                >
                  {templateLinkedAttributes.map((attr) => {
                    const isFilterable = (templateForm.filter_attributes || []).includes(attr.id);
                    return (
                      <Chip
                        key={attr.id}
                        label={
                          <MDBox display="flex" alignItems="center" gap={0.5}>
                            <span>{attr.display_name}</span>
                            <MDTypography
                              component="span"
                              variant="caption"
                              sx={{
                                opacity: 0.7,
                                fontSize: "0.65rem",
                                textTransform: "uppercase",
                              }}
                            >
                              {attr.data_type}
                            </MDTypography>
                          </MDBox>
                        }
                        onClick={() => handleToggleFilterAttribute(attr.id)}
                        icon={isFilterable ? <FilterListIcon sx={{ fontSize: 16 }} /> : null}
                        sx={{
                          height: "auto",
                          py: 0.75,
                          px: 0.5,
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          backgroundColor: isFilterable ? "info.main" : "rgba(0, 0, 0, 0.06)",
                          color: isFilterable ? "white" : "text.primary",
                          border: "1px solid",
                          borderColor: isFilterable ? "info.main" : "rgba(0, 0, 0, 0.1)",
                          boxShadow: isFilterable ? "0 2px 8px rgba(25, 118, 210, 0.35)" : "none",
                          "& .MuiChip-label": {
                            px: 1,
                            fontSize: "0.8rem",
                            fontWeight: isFilterable ? 500 : 400,
                          },
                          "& .MuiChip-icon": {
                            color: "inherit",
                            ml: 0.5,
                          },
                          "&:hover": {
                            transform: "translateY(-1px)",
                            boxShadow: isFilterable
                              ? "0 4px 12px rgba(25, 118, 210, 0.4)"
                              : "0 2px 8px rgba(0, 0, 0, 0.1)",
                            backgroundColor: isFilterable ? "info.dark" : "rgba(0, 0, 0, 0.1)",
                          },
                          "&:active": {
                            transform: "translateY(0)",
                          },
                        }}
                      />
                    );
                  })}
                </MDBox>
              )}
              {templateForm.filter_attributes?.length > 0 && (
                <MDBox
                  display="flex"
                  alignItems="center"
                  justifyContent="flex-end"
                  gap={0.5}
                  mt={1.5}
                >
                  <Chip
                    size="small"
                    label={`${templateForm.filter_attributes.length} active`}
                    sx={{
                      height: 22,
                      backgroundColor: "success.main",
                      color: "white",
                      fontWeight: 500,
                      fontSize: "0.7rem",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </MDBox>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog} disabled={savingTemplate}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            color="primary"
            disabled={savingTemplate}
            sx={{ color: "white !important" }}
          >
            {savingTemplate ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2">
            Are you sure you want to delete &quot;{deletingTemplate?.name}&quot;? This action cannot be undone.
          </MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={savingTemplate}>
            Cancel
          </Button>
          <Button onClick={handleDeleteTemplate} color="error" variant="contained" disabled={savingTemplate}>
            {savingTemplate ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Groups Management Dialog */}
      <Dialog open={groupsDialogOpen} onClose={handleCloseGroupsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <MDBox display="flex" alignItems="center" gap={1}>
            <Icon color="info">folder</Icon>
            Manage Template Groups
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {/* Add/Edit Group Form */}
          <MDBox
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              backgroundColor: editingGroup ? "rgba(255, 152, 0, 0.05)" : "rgba(76, 175, 80, 0.05)",
              border: "1px solid",
              borderColor: editingGroup ? "rgba(255, 152, 0, 0.2)" : "rgba(76, 175, 80, 0.2)",
            }}
          >
            <MDTypography variant="subtitle2" fontWeight="bold" mb={1.5}>
              {editingGroup ? "Edit Group" : "Add New Group"}
            </MDTypography>
            <MDBox display="flex" gap={1} alignItems="center">
              <TextField
                label="Group Name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                size="small"
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSaveGroup();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 40,
                  },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 48 }}>
                <Select
                  value={groupForm.icon}
                  onChange={(e) => setGroupForm({ ...groupForm, icon: e.target.value })}
                  sx={{
                    height: 40,
                    minWidth: 48,
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: "0 !important",
                      pr: "24px !important",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.23)",
                    },
                  }}
                  renderValue={(value) => (
                    <Icon sx={{ fontSize: "1.25rem" }}>{value}</Icon>
                  )}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 280,
                        "& .MuiList-root": {
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 0.5,
                          p: 1,
                        },
                      },
                    },
                  }}
                >
                  {GROUP_ICONS.map((iconName) => (
                    <MenuItem
                      key={iconName}
                      value={iconName}
                      sx={{
                        minWidth: "unset",
                        justifyContent: "center",
                        p: 1,
                        borderRadius: 1,
                        "&.Mui-selected": {
                          backgroundColor: "info.main",
                          color: "white",
                          "&:hover": {
                            backgroundColor: "info.dark",
                          },
                        },
                      }}
                    >
                      <Tooltip title={iconName} placement="top">
                        <Icon>{iconName}</Icon>
                      </Tooltip>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={editingGroup ? "Save Changes" : "Add Group"}>
                <IconButton
                  onClick={handleSaveGroup}
                  disabled={savingGroup || !groupForm.name.trim()}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    color: "white",
                    backgroundColor: editingGroup ? "warning.main" : "success.main",
                    "&:hover": {
                      backgroundColor: editingGroup ? "warning.dark" : "success.dark",
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "grey.300",
                      color: "grey.500",
                    },
                  }}
                >
                  <Icon>{savingGroup ? "hourglass_empty" : "check"}</Icon>
                </IconButton>
              </Tooltip>
              {editingGroup && (
                <Tooltip title="Cancel Edit">
                  <IconButton
                    onClick={handleCancelEditGroup}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      color: "grey.600",
                      border: "1px solid",
                      borderColor: "grey.300",
                      "&:hover": {
                        backgroundColor: "grey.100",
                      },
                    }}
                  >
                    <Icon>close</Icon>
                  </IconButton>
                </Tooltip>
              )}
            </MDBox>
          </MDBox>

          {/* Groups List */}
          <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
            Existing Groups ({templateGroups.length})
          </MDTypography>
          {loadingGroups ? (
            <MDBox display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </MDBox>
          ) : templateGroups.length === 0 ? (
            <MDBox
              sx={{
                py: 4,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "grey.300",
                borderRadius: 2,
              }}
            >
              <Icon sx={{ fontSize: 40, color: "grey.400", mb: 1 }}>folder_off</Icon>
              <MDTypography variant="body2" color="text">
                No groups created yet
              </MDTypography>
            </MDBox>
          ) : (
            <MDBox
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                maxHeight: 300,
                overflow: "auto",
                p: 1,
              }}
            >
              {templateGroups.map((group) => {
                const templatesCount = products.filter((t) => t.group_id === group.id).length;
                const isEditing = editingGroup?.id === group.id;
                return (
                  <Chip
                    key={group.id}
                    icon={<Icon sx={{ fontSize: "18px !important" }}>{group.icon || "folder"}</Icon>}
                    label={
                      <MDBox display="flex" alignItems="center" gap={0.5}>
                        <span>{group.name}</span>
                        <MDBox
                          component="span"
                          sx={{
                            backgroundColor: "rgba(0, 0, 0, 0.1)",
                            borderRadius: "10px",
                            px: 0.75,
                            py: 0.125,
                            fontSize: "0.65rem",
                            fontWeight: 500,
                            ml: 0.5,
                          }}
                        >
                          {templatesCount}
                        </MDBox>
                      </MDBox>
                    }
                    onClick={() => handleEditGroup(group)}
                    onDelete={templatesCount === 0 ? () => handleDeleteGroup(group) : undefined}
                    deleteIcon={
                      templatesCount === 0 ? (
                        <Tooltip title="Delete">
                          <Icon sx={{ fontSize: "18px !important" }}>close</Icon>
                        </Tooltip>
                      ) : undefined
                    }
                    sx={{
                      height: "auto",
                      py: 0.75,
                      px: 0.5,
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      backgroundColor: isEditing ? "warning.light" : "rgba(33, 150, 243, 0.1)",
                      color: isEditing ? "warning.dark" : "info.main",
                      border: "1px solid",
                      borderColor: isEditing ? "warning.main" : "rgba(33, 150, 243, 0.3)",
                      boxShadow: isEditing ? "0 2px 8px rgba(255, 152, 0, 0.3)" : "none",
                      "& .MuiChip-icon": {
                        color: isEditing ? "warning.dark" : "info.main",
                      },
                      "& .MuiChip-label": {
                        px: 1,
                        fontSize: "0.8rem",
                        fontWeight: 500,
                      },
                      "& .MuiChip-deleteIcon": {
                        color: "error.main",
                        "&:hover": {
                          color: "error.dark",
                        },
                      },
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: isEditing
                          ? "0 4px 12px rgba(255, 152, 0, 0.4)"
                          : "0 2px 8px rgba(33, 150, 243, 0.3)",
                        backgroundColor: isEditing ? "warning.light" : "rgba(33, 150, 243, 0.15)",
                      },
                    }}
                  />
                );
              })}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default ProductAttributes;
