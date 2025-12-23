/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import Checkbox from "@mui/material/Checkbox";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
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

function TemplateProducts() {
  const { templateName } = useParams();
  const decodedTemplateName = templateName ? decodeURIComponent(templateName) : null;

  // Template info
  const [template, setTemplate] = useState(null);
  const [templateAttributes, setTemplateAttributes] = useState([]);
  const [filterAttributeIds, setFilterAttributeIds] = useState([]);
  const [filterPropertyKeys, setFilterPropertyKeys] = useState([]); // Which default properties to show as filters
  const [defaultProperties, setDefaultProperties] = useState(["scope", "service", "region"]); // Default enabled properties
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Modal state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // List state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Lookup data
  const [scopes, setScopes] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [regions, setRegions] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    scope_id: "",
    service_id: "",
    service_type_id: "",
    region_id: "",
  });
  const [formTouched, setFormTouched] = useState({});
  const [attributeValues, setAttributeValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showOptionalAttrs, setShowOptionalAttrs] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Error state
  const [error, setError] = useState(null);

  // Column order state (for drag-and-drop reordering)
  const [columnOrder, setColumnOrder] = useState([]);

  // Hidden columns state (for column visibility)
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // Column visibility menu anchor
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10; // Default entries per page

  // Filter state
  const [filterValues, setFilterValues] = useState({});

  // localStorage keys for this template
  const columnOrderKey = template ? `product-columns-${template.id}` : null;
  const hiddenColumnsKey = template ? `product-hidden-columns-${template.id}` : null;

  // Get filterable attributes (those in filter_attributes array)
  const filterableAttributes = useMemo(() => {
    if (!filterAttributeIds.length || !templateAttributes.length) return [];
    return templateAttributes.filter((attr) => filterAttributeIds.includes(attr.attribute_id));
  }, [filterAttributeIds, templateAttributes]);

  // Get unique values for each filterable attribute from products
  const filterOptions = useMemo(() => {
    const options = {};
    filterableAttributes.forEach((attr) => {
      const uniqueValues = new Set();
      products.forEach((product) => {
        const value = product.attributes[attr.attribute_id];
        if (value !== null && value !== undefined && value !== "") {
          uniqueValues.add(value.toString());
        }
      });
      options[attr.attribute_id] = Array.from(uniqueValues).sort();
    });
    return options;
  }, [filterableAttributes, products]);

  // Handle filter change
  const handleFilterChange = (attributeId, value) => {
    setFilterValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
    // Reset to first page when filter changes
    setCurrentPage(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterValues({});
    setCurrentPage(0);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(filterValues).some((v) => v !== "" && v !== undefined);

  // Load column order from localStorage when template loads
  useEffect(() => {
    if (columnOrderKey) {
      const savedOrder = localStorage.getItem(columnOrderKey);
      if (savedOrder) {
        try {
          setColumnOrder(JSON.parse(savedOrder));
        } catch {
          setColumnOrder([]);
        }
      } else {
        setColumnOrder([]);
      }
    }
  }, [columnOrderKey]);

  // Load hidden columns from localStorage when template loads
  useEffect(() => {
    if (hiddenColumnsKey) {
      const savedHidden = localStorage.getItem(hiddenColumnsKey);
      if (savedHidden) {
        try {
          setHiddenColumns(JSON.parse(savedHidden));
        } catch {
          setHiddenColumns([]);
        }
      } else {
        setHiddenColumns([]);
      }
    }
  }, [hiddenColumnsKey]);

  // Save column order to localStorage
  const saveColumnOrder = useCallback((order) => {
    if (columnOrderKey) {
      localStorage.setItem(columnOrderKey, JSON.stringify(order));
    }
  }, [columnOrderKey]);

  // Save hidden columns to localStorage
  const saveHiddenColumns = useCallback((hidden) => {
    if (hiddenColumnsKey) {
      localStorage.setItem(hiddenColumnsKey, JSON.stringify(hidden));
    }
  }, [hiddenColumnsKey]);

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

  // Fetch template info and attributes
  const fetchTemplateInfo = useCallback(async () => {
    console.log("fetchTemplateInfo - templateName from URL:", templateName);
    console.log("fetchTemplateInfo - decodedTemplateName:", decodedTemplateName);

    if (!decodedTemplateName) {
      setLoadingTemplate(false);
      return;
    }

    try {
      setLoadingTemplate(true);

      // Fetch template by name
      console.log("Querying product_templates with name:", decodedTemplateName);
      const { data: templateData, error: templateError } = await supabase
        .from("product_templates")
        .select("*")
        .eq("name", decodedTemplateName)
        .eq("is_active", true)
        .single();

      console.log("Template query result:", { templateData, templateError });
      if (templateError) throw templateError;
      setTemplate(templateData);

      // Store filter attribute IDs from template
      const filterAttrs = templateData.filter_attributes || [];
      setFilterAttributeIds(Array.isArray(filterAttrs) ? filterAttrs : []);

      // Store filter property keys from template (which default properties to show as filters)
      const filterProps = templateData.filter_properties || [];
      setFilterPropertyKeys(Array.isArray(filterProps) ? filterProps : []);

      // Store default properties from template (backward compatible: default to all if not set)
      const defaultProps = templateData.default_properties;
      setDefaultProperties(Array.isArray(defaultProps) ? defaultProps : ["scope", "service", "region"]);

      // Fetch template attributes using template ID
      const { data: attrsData, error: attrsError } = await supabase
        .from("product_template_attributes")
        .select(`
          *,
          attribute:attribute_definitions(*)
        `)
        .eq("product_template_id", templateData.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (attrsError) throw attrsError;

      // Filter to only include active attributes
      const attrs = (attrsData || [])
        .filter((pta) => pta.attribute?.is_active === true)
        .map((pta) => ({
          id: pta.id,
          attribute_id: pta.attribute?.id,
          attribute_key: pta.attribute?.attribute_key,
          display_name: pta.attribute?.display_name,
          data_type: pta.attribute?.data_type,
          unit: pta.attribute?.unit,
          is_required: pta.is_required === true,
          default_value: pta.attribute?.default_value,
          validation_rules: pta.attribute?.validation_rules,
          options: pta.attribute?.options,
          list_options: pta.attribute?.list_options,
          sort_order: pta.sort_order,
        }));

      console.log("Loaded attributes with is_required:", attrs.map(a => ({
        display_name: a.display_name,
        is_required: a.is_required
      })));

      setTemplateAttributes(attrs);
    } catch (err) {
      console.error("Error fetching template info:", err);
      setError(err.message);
    } finally {
      setLoadingTemplate(false);
    }
  }, [decodedTemplateName]);

  // Fetch products for this template (depends on template being loaded)
  const fetchProducts = useCallback(async () => {
    if (!template?.id) {
      setLoadingProducts(false);
      return;
    }

    try {
      setLoadingProducts(true);

      // Fetch products that have attributes linked to this template
      const { data: productAttrs, error: attrsError } = await supabase
        .from("product_attributes")
        .select(`
          product_id,
          product:products(
            *,
            scope:scopes(id, name),
            service:service(id, name),
            service_type:service_type(id, name),
            region:region(id, name)
          ),
          attribute_definition_id,
          value_string,
          value_integer,
          value_decimal,
          value_boolean,
          value_json,
          value_text,
          attribute:attribute_definitions(id, attribute_key, data_type)
        `)
        .eq("product_template_id", template.id)
        .eq("is_active", true);

      if (attrsError) throw attrsError;

      // Group by product and build product objects with attribute values
      const productsMap = new Map();

      (productAttrs || []).forEach((pa) => {
        if (!pa.product || pa.product.is_active === false) return;

        const productId = pa.product_id;
        if (!productsMap.has(productId)) {
          productsMap.set(productId, {
            ...pa.product,
            attributes: {},
          });
        }

        const product = productsMap.get(productId);
        const dataType = pa.attribute?.data_type?.toLowerCase();
        let value;

        switch (dataType) {
          case "integer":
            value = pa.value_integer;
            break;
          case "decimal":
            value = pa.value_decimal;
            break;
          case "boolean":
            value = pa.value_boolean;
            break;
          case "json":
            value = pa.value_json;
            break;
          case "text":
            value = pa.value_text;
            break;
          case "list":
            value = pa.value_string;
            break;
          default:
            value = pa.value_string;
        }

        product.attributes[pa.attribute_definition_id] = value;
      });

      setProducts(Array.from(productsMap.values()));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [template?.id]);

  // Fetch lookup data
  const fetchLookupData = useCallback(async () => {
    try {
      const [scopesRes, servicesRes, serviceTypesRes, regionsRes] = await Promise.all([
        supabase.from("scopes").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service_type").select("id, name").eq("is_active", true).order("name"),
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
      ]);

      if (scopesRes.error) throw scopesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (serviceTypesRes.error) throw serviceTypesRes.error;
      if (regionsRes.error) throw regionsRes.error;

      setScopes(scopesRes.data || []);
      setServices(servicesRes.data || []);
      setServiceTypes(serviceTypesRes.data || []);
      setRegions(regionsRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Initial data fetch - template info and lookup data
  useEffect(() => {
    fetchTemplateInfo();
    fetchLookupData();
  }, [fetchTemplateInfo, fetchLookupData]);

  // Fetch products after template is loaded
  useEffect(() => {
    if (template?.id) {
      fetchProducts();
    }
  }, [template?.id, fetchProducts]);

  // Handle form field change
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Handle attribute value change
  const handleAttributeChange = (attributeId, value) => {
    setAttributeValues((prev) => ({ ...prev, [attributeId]: value }));
  };

  // Validate attribute value
  const validateAttribute = (attr, value) => {
    const errors = [];

    // Parse validation rules
    let parsedRules = {};
    const rules = attr.validation_rules;
    if (rules) {
      if (typeof rules === "string") {
        try {
          parsedRules = JSON.parse(rules);
        } catch {
          parsedRules = {};
        }
      } else {
        parsedRules = rules;
      }
    }

    // Check required
    const isRequired = attr.is_required || parsedRules.required;
    if (isRequired && (value === "" || value === null || value === undefined)) {
      errors.push("This field is required");
      return errors;
    }

    if (value === "" || value === null || value === undefined) {
      return errors;
    }

    const dataType = attr.data_type?.toLowerCase();

    // Numeric validations
    if (dataType === "integer" || dataType === "decimal") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push("Must be a valid number");
      } else {
        if (parsedRules.min !== undefined && numValue < parsedRules.min) {
          errors.push(`Minimum value is ${parsedRules.min}`);
        }
        if (parsedRules.max !== undefined && numValue > parsedRules.max) {
          errors.push(`Maximum value is ${parsedRules.max}`);
        }
      }
    }

    // String validations
    if (dataType === "string") {
      if (parsedRules.minLength !== undefined && value.length < parsedRules.minLength) {
        errors.push(`Minimum length is ${parsedRules.minLength} characters`);
      }
      if (parsedRules.maxLength !== undefined && value.length > parsedRules.maxLength) {
        errors.push(`Maximum length is ${parsedRules.maxLength} characters`);
      }
      if (parsedRules.regex) {
        try {
          const regex = new RegExp(parsedRules.regex);
          if (!regex.test(value)) {
            errors.push(parsedRules.regexMessage || "Invalid format");
          }
        } catch {
          // Invalid regex pattern
        }
      }
    }

    return errors;
  };

  // Get all validation errors
  const getValidationErrors = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = "Product name is required";
    // Only validate required fields if they are in defaultProperties
    if (defaultProperties.includes("scope") && !formData.scope_id) {
      errors.scope_id = "Scope is required";
    }
    if (defaultProperties.includes("service") && !formData.service_id) {
      errors.service_id = "Service is required";
    }

    templateAttributes.forEach((attr) => {
      const attrErrors = validateAttribute(attr, attributeValues[attr.attribute_id]);
      if (attrErrors.length > 0) {
        errors[`attr_${attr.attribute_id}`] = attrErrors[0];
      }
    });

    return errors;
  };

  // Check if form is valid
  const isFormValid = () => {
    const errors = getValidationErrors();
    return Object.keys(errors).length === 0;
  };

  // Open form for creating new product
  const handleCreateNew = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      scope_id: "",
      service_id: "",
      service_type_id: "",
      region_id: "",
    });
    setFormTouched({});

    // Initialize attribute values with defaults
    const initialValues = {};
    templateAttributes.forEach((attr) => {
      initialValues[attr.attribute_id] = attr.default_value || "";
    });
    setAttributeValues(initialValues);

    setFormDialogOpen(true);
  };

  // Open form for editing product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      scope_id: product.scope?.id || "",
      service_id: product.service?.id || "",
      service_type_id: product.service_type?.id || "",
      region_id: product.region?.id || "",
    });
    setFormTouched({});

    // Set attribute values from product
    const values = {};
    templateAttributes.forEach((attr) => {
      const value = product.attributes[attr.attribute_id];
      if (value !== undefined && value !== null) {
        values[attr.attribute_id] = attr.data_type?.toLowerCase() === "boolean" ? value : value.toString();
      } else {
        values[attr.attribute_id] = attr.default_value || "";
      }
    });
    setAttributeValues(values);

    setFormDialogOpen(true);
  };

  // Duplicate product - opens add dialog with pre-filled data from selected product
  const handleDuplicate = (product) => {
    setEditingProduct(null); // null means we're creating a new product
    setFormData({
      name: `${product.name || ""} (Copy)`,
      scope_id: product.scope?.id || "",
      service_id: product.service?.id || "",
      service_type_id: product.service_type?.id || "",
      region_id: product.region?.id || "",
    });
    setFormTouched({});

    // Copy attribute values from the source product
    const values = {};
    templateAttributes.forEach((attr) => {
      const value = product.attributes[attr.attribute_id];
      if (value !== undefined && value !== null) {
        values[attr.attribute_id] = attr.data_type?.toLowerCase() === "boolean" ? value : value.toString();
      } else {
        values[attr.attribute_id] = attr.default_value || "";
      }
    });
    setAttributeValues(values);

    setFormDialogOpen(true);
  };

  // Close form dialog
  const handleFormClose = () => {
    setFormDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      scope_id: "",
      service_id: "",
      service_type_id: "",
      region_id: "",
    });
    setFormTouched({});
    setAttributeValues({});
    setShowOptionalAttrs(false);
  };

  // Save product
  const handleSave = async () => {
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    templateAttributes.forEach((attr) => {
      allTouched[`attr_${attr.attribute_id}`] = true;
    });
    setFormTouched(allTouched);

    if (!isFormValid()) {
      setSnackbar({ open: true, message: "Please fix validation errors", severity: "error" });
      return;
    }

    try {
      setSaving(true);

      const productData = {
        name: formData.name.trim(),
        scope_id: formData.scope_id || null,
        service_id: formData.service_id || null,
        service_type_id: formData.service_type_id || null,
        region_id: formData.region_id || null,
        is_active: true,
      };

      let productId;

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from("products")
          .update({ ...productData, updated_at: new Date().toISOString() })
          .eq("id", editingProduct.id);

        if (updateError) throw updateError;
        productId = editingProduct.id;

        // Update existing attribute values
        for (const attr of templateAttributes) {
          const value = attributeValues[attr.attribute_id];
          const dataType = attr.data_type?.toLowerCase();

          const record = {
            value_string: null,
            value_integer: null,
            value_decimal: null,
            value_boolean: null,
            value_json: null,
            value_text: null,
            is_active: true,
          };

          if (value !== "" && value !== null && value !== undefined) {
            switch (dataType) {
              case "integer":
                record.value_integer = parseInt(value, 10) || null;
                break;
              case "decimal":
                record.value_decimal = parseFloat(value) || null;
                break;
              case "boolean":
                record.value_boolean = value === true || value === "true";
                break;
              case "json":
                try {
                  record.value_json = typeof value === "string" ? JSON.parse(value) : value;
                } catch {
                  record.value_json = null;
                }
                break;
              case "text":
                record.value_text = value?.toString() || null;
                break;
              case "list":
                record.value_string = value?.toString() || null;
                break;
              default:
                record.value_string = value?.toString() || null;
            }
          }

          // Check if attribute record exists (use maybeSingle to handle 0 or 1 results)
          const { data: existingAttrs } = await supabase
            .from("product_attributes")
            .select("id")
            .eq("product_id", productId)
            .eq("product_template_id", template.id)
            .eq("attribute_definition_id", attr.attribute_id)
            .eq("is_active", true)
            .limit(1);

          const existingAttr = existingAttrs && existingAttrs.length > 0 ? existingAttrs[0] : null;

          if (existingAttr) {
            // Update existing record
            await supabase
              .from("product_attributes")
              .update(record)
              .eq("id", existingAttr.id);
          } else if (value !== "" && value !== null && value !== undefined) {
            // Insert new record only if there's a value
            await supabase
              .from("product_attributes")
              .insert({
                product_id: productId,
                product_template_id: template.id,
                attribute_definition_id: attr.attribute_id,
                ...record,
              });
          }
        }
      } else {
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;

        // Save attribute values for new product
        const attributeInserts = [];
        templateAttributes.forEach((attr) => {
          const value = attributeValues[attr.attribute_id];
          if (value !== "" && value !== null && value !== undefined) {
            const dataType = attr.data_type?.toLowerCase();
            const record = {
              product_id: productId,
              product_template_id: template.id,
              attribute_definition_id: attr.attribute_id,
              value_string: null,
              value_integer: null,
              value_decimal: null,
              value_boolean: null,
              value_json: null,
              value_text: null,
              is_active: true,
            };

            switch (dataType) {
              case "integer":
                record.value_integer = parseInt(value, 10) || null;
                break;
              case "decimal":
                record.value_decimal = parseFloat(value) || null;
                break;
              case "boolean":
                record.value_boolean = value === true || value === "true";
                break;
              case "json":
                try {
                  record.value_json = typeof value === "string" ? JSON.parse(value) : value;
                } catch {
                  record.value_json = null;
                }
                break;
              case "text":
                record.value_text = value?.toString() || null;
                break;
              case "list":
                record.value_string = value?.toString() || null;
                break;
              default:
                record.value_string = value?.toString() || null;
            }

            attributeInserts.push(record);
          }
        });

        if (attributeInserts.length > 0) {
          const { error: attrError } = await supabase
            .from("product_attributes")
            .insert(attributeInserts);

          if (attrError) throw attrError;
        }
      }

      setSnackbar({
        open: true,
        message: editingProduct ? "Product updated successfully!" : "Product created successfully!",
        severity: "success",
      });

      // For new products, calculate the page where the new item will appear
      // New items are typically added at the end, so go to the last page
      if (!editingProduct) {
        const newTotalItems = products.length + 1;
        const lastPage = Math.max(0, Math.ceil(newTotalItems / pageSize) - 1);
        setCurrentPage(lastPage);
      }
      // For edits, stay on current page (no change needed)

      handleFormClose();
      fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq("id", deletingProduct.id);

      if (deleteError) throw deleteError;

      setSnackbar({ open: true, message: "Product deleted successfully!", severity: "success" });
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: "error" });
    }
  };

  // Render attribute input
  const renderAttributeInput = (attr) => {
    const value = attributeValues[attr.attribute_id] ?? "";
    const errors = getValidationErrors();
    const errorKey = `attr_${attr.attribute_id}`;
    const hasError = formTouched[errorKey] && errors[errorKey];
    const dataType = attr.data_type?.toLowerCase();
    const label = attr.is_required ? `${attr.display_name} *` : attr.display_name;

    const handleBlur = () => {
      setFormTouched((prev) => ({ ...prev, [errorKey]: true }));
    };

    // Parse options for dropdown
    let options = [];
    if (attr.options) {
      if (typeof attr.options === "string") {
        try {
          options = JSON.parse(attr.options);
        } catch {
          options = attr.options.split(",").map((o) => o.trim());
        }
      } else if (Array.isArray(attr.options)) {
        options = attr.options;
      }
    }

    switch (dataType) {
      case "boolean":
        return (
          <MDBox
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              mt: 2,
              mb: 1,
            }}
          >
            <MDTypography
              variant="caption"
              fontWeight="medium"
              color="text"
              sx={{ mb: 0.5 }}
            >
              {attr.display_name}
            </MDTypography>
            <MDBox display="flex" alignItems="center" gap={1}>
              <Switch
                checked={value === true || value === "true"}
                onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.checked)}
                color="info"
              />
              <MDTypography variant="button" color="text">
                {value === true || value === "true" ? "Yes" : "No"}
              </MDTypography>
            </MDBox>
          </MDBox>
        );

      case "dropdown":
      case "select":
        return (
          <FormControl fullWidth margin="normal" error={hasError}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
              onBlur={handleBlur}
              label={label}
              sx={{ minHeight: 44 }}
            >
              <MenuItem value="">
                <em>Select...</em>
              </MenuItem>
              {options.map((opt, idx) => (
                <MenuItem key={idx} value={typeof opt === "object" ? opt.value : opt}>
                  {typeof opt === "object" ? opt.label : opt}
                </MenuItem>
              ))}
            </Select>
            {hasError && <FormHelperText>{errors[errorKey]}</FormHelperText>}
          </FormControl>
        );

      case "integer":
        return (
          <TextField
            fullWidth
            type="number"
            label={label}
            value={value}
            onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
            onBlur={handleBlur}
            margin="normal"
            variant="outlined"
            error={hasError}
            helperText={hasError ? errors[errorKey] : ""}
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
            type="number"
            label={label}
            value={value}
            onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
            onBlur={handleBlur}
            margin="normal"
            variant="outlined"
            error={hasError}
            helperText={hasError ? errors[errorKey] : ""}
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
            multiline
            rows={3}
            label={label}
            value={value}
            onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
            onBlur={handleBlur}
            margin="normal"
            variant="outlined"
            error={hasError}
            helperText={hasError ? errors[errorKey] : 'JSON format: {"key": "value"}'}
            placeholder='{"key": "value"}'
          />
        );

      case "text":
        return (
          <TextField
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            label={label}
            value={value}
            onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
            onBlur={handleBlur}
            margin="normal"
            variant="outlined"
            error={hasError}
            helperText={hasError ? errors[errorKey] : ""}
            placeholder="Enter text content..."
          />
        );

      case "list": {
        const listOptions = Array.isArray(attr.list_options) ? attr.list_options : [];
        return (
          <FormControl fullWidth margin="normal" error={hasError}>
            <InputLabel>{label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
              onBlur={handleBlur}
              label={label}
              sx={{ minHeight: 44 }}
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
            {hasError && <FormHelperText>{errors[errorKey]}</FormHelperText>}
          </FormControl>
        );
      }

      default: // string
        return (
          <TextField
            fullWidth
            label={label}
            value={value}
            onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.value)}
            onBlur={handleBlur}
            margin="normal"
            variant="outlined"
            error={hasError}
            helperText={hasError ? errors[errorKey] : ""}
            InputProps={{
              endAdornment: attr.unit ? (
                <InputAdornment position="end">{attr.unit}</InputAdornment>
              ) : null,
            }}
          />
        );
    }
  };

  // Format attribute value for table display
  const formatAttributeValue = (attr, value) => {
    if (value === null || value === undefined) return "-";

    const dataType = attr.data_type?.toLowerCase();

    // Helper function to wrap text with tooltip (CSS handles truncation)
    const wrapWithTooltip = (text) => {
      const textValue = text.toString();
      return (
        <span title={textValue}>{textValue}</span>
      );
    };

    switch (dataType) {
      case "boolean":
        return value ? "Yes" : "No";
      case "json":
        return typeof value === "object" ? JSON.stringify(value) : value;
      case "text":
      case "string":
        return wrapWithTooltip(value);
      default: {
        const displayValue = attr.unit ? `${value} ${attr.unit}` : value.toString();
        return wrapWithTooltip(displayValue);
      }
    }
  };

  // Build all available columns (base + attributes + actions)
  const allColumns = useMemo(() => {
    // Name is always shown
    const baseColumns = [
      { Header: "Name", accessor: "name", width: "15%", id: "name" },
    ];

    // Conditionally add property columns based on template configuration
    if (defaultProperties.includes("scope")) {
      baseColumns.push({ Header: "Scope", accessor: "scope_name", width: "10%", id: "scope_name" });
    }
    if (defaultProperties.includes("service")) {
      baseColumns.push({ Header: "Service", accessor: "service_name", width: "10%", id: "service_name" });
    }
    if (defaultProperties.includes("service_type")) {
      baseColumns.push({ Header: "Service Type", accessor: "service_type_name", width: "10%", id: "service_type_name" });
    }
    if (defaultProperties.includes("region")) {
      baseColumns.push({ Header: "Region", accessor: "region_name", width: "10%", id: "region_name" });
    }

    // Add attribute columns with fullWidth for CSS-based text truncation
    const attrColumns = templateAttributes.map((attr) => ({
      Header: attr.display_name,
      accessor: `attr_${attr.attribute_id}`,
      width: "auto",
      id: `attr_${attr.attribute_id}`,
      fullWidth: true,
    }));

    const actionColumn = {
      Header: "Actions",
      accessor: "actions",
      width: "12%",
      align: "center",
      id: "actions",
      disableSortBy: true,
    };

    return [...baseColumns, ...attrColumns, actionColumn];
  }, [templateAttributes, defaultProperties]);

  // Get ordered columns based on saved column order
  const orderedColumns = useMemo(() => {
    if (columnOrder.length === 0) {
      return allColumns;
    }

    // Create a map of columns by id for quick lookup
    const columnMap = new Map(allColumns.map((col) => [col.id, col]));

    // Order columns based on saved order, then append any new columns not in saved order
    const ordered = [];
    const usedIds = new Set();

    // First, add columns in the saved order
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

  // Handle column order change from DataTable
  const handleColumnOrderChange = useCallback((newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  }, [saveColumnOrder]);

  // Reset column order to default
  const resetColumnOrder = () => {
    setColumnOrder([]);
    if (columnOrderKey) {
      localStorage.removeItem(columnOrderKey);
    }
  };

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    if (!hasActiveFilters) return products;

    return products.filter((product) => {
      return Object.entries(filterValues).every(([filterKey, filterValue]) => {
        if (!filterValue || filterValue === "") return true;

        // Check if this is a property filter (prefixed with "prop_")
        if (filterKey.startsWith("prop_")) {
          const propKey = filterKey.replace("prop_", "");
          const propIdField = `${propKey}_id`;
          const productPropId = product[propIdField];
          // Compare as integers since filterValue is the selected ID
          return productPropId === parseInt(filterValue, 10);
        }

        // Otherwise it's an attribute filter
        const attributeId = parseInt(filterKey, 10);
        const productValue = product.attributes[attributeId];
        if (productValue === null || productValue === undefined) return false;

        // Find the attribute to determine its type
        const attr = filterableAttributes.find((a) => a.attribute_id === attributeId);
        const dataType = attr?.data_type?.toLowerCase();

        // Handle boolean values (exact match)
        if (dataType === "boolean") {
          return productValue.toString() === filterValue;
        }

        // Handle list values (exact match)
        if (dataType === "list") {
          return productValue.toString() === filterValue;
        }

        // Handle numeric types (integer, decimal) - partial match on string representation
        if (dataType === "integer" || dataType === "decimal") {
          return productValue.toString().includes(filterValue);
        }

        // Default: case-insensitive partial string match for string, text, json, etc.
        return productValue.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
  }, [products, filterValues, hasActiveFilters, filterableAttributes]);

  // Base colors for each property type (distinct colors)
  const PROPERTY_BASE_COLORS = {
    scope: { h: 207, s: 90, l: 54 },      // Blue (#1976d2)
    service: { h: 122, s: 39, l: 49 },    // Green (#4caf50)
    service_type: { h: 36, s: 100, l: 50 }, // Orange (#ff9800)
    region: { h: 291, s: 64, l: 42 },     // Purple (#9c27b0)
  };

  // Calculate contrasting text color based on background lightness
  const getContrastColor = (lightness) => {
    // If lightness is above 55%, use dark text; otherwise use white
    return lightness > 55 ? "#1a1a1a" : "#ffffff";
  };

  // Generate shades of a base color with corresponding text colors
  const generateShades = (baseColor, count) => {
    const shades = [];
    if (count === 1) {
      // Single value: use the base color
      shades.push({
        bg: `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`,
        text: getContrastColor(baseColor.l),
      });
    } else {
      // Multiple values: generate shades from darker to lighter
      const minL = Math.max(25, baseColor.l - 15);
      const maxL = Math.min(65, baseColor.l + 15);
      const step = (maxL - minL) / Math.max(1, count - 1);

      for (let i = 0; i < count; i++) {
        const lightness = minL + (step * i);
        shades.push({
          bg: `hsl(${baseColor.h}, ${baseColor.s}%, ${lightness}%)`,
          text: getContrastColor(lightness),
        });
      }
    }
    return shades;
  };

  // Build unique value color maps for each property type
  const propertyColorMaps = useMemo(() => {
    const maps = {
      scope: new Map(),
      service: new Map(),
      service_type: new Map(),
      region: new Map(),
    };

    // First pass: collect unique values for each property
    const uniqueValues = {
      scope: new Set(),
      service: new Set(),
      service_type: new Set(),
      region: new Set(),
    };

    products.forEach((product) => {
      if (product.scope?.name) uniqueValues.scope.add(product.scope.name);
      if (product.service?.name) uniqueValues.service.add(product.service.name);
      if (product.service_type?.name) uniqueValues.service_type.add(product.service_type.name);
      if (product.region?.name) uniqueValues.region.add(product.region.name);
    });

    // Second pass: generate shades and assign to values
    Object.keys(uniqueValues).forEach((propKey) => {
      const values = Array.from(uniqueValues[propKey]).sort();
      const baseColor = PROPERTY_BASE_COLORS[propKey];
      const shades = generateShades(baseColor, values.length);

      values.forEach((value, index) => {
        maps[propKey].set(value, shades[index]);
      });
    });

    return maps;
  }, [products]);

  // Helper to render property badge with dynamic color based on value
  const renderPropertyBadge = (value, propertyType) => {
    if (!value || value === "-") {
      return (
        <MDTypography variant="caption" color="text" sx={{ opacity: 0.5 }}>
          -
        </MDTypography>
      );
    }

    // Get color object from the property color map
    const colorMap = propertyColorMaps[propertyType];
    const colorObj = colorMap?.get(value) || { bg: "#757575", text: "#ffffff" };

    return (
      <Chip
        label={value}
        size="small"
        sx={{
          height: 24,
          fontSize: "0.75rem",
          fontWeight: 500,
          backgroundColor: colorObj.bg,
          color: colorObj.text,
          "& .MuiChip-label": { px: 1.5 },
        }}
      />
    );
  };

  // Build table rows
  const rows = useMemo(() => {
    return filteredProducts.map((product) => {
      const row = {
        name: product.name,
        scope_name: renderPropertyBadge(product.scope?.name, "scope"),
        service_name: renderPropertyBadge(product.service?.name, "service"),
        service_type_name: renderPropertyBadge(product.service_type?.name, "service_type"),
        region_name: renderPropertyBadge(product.region?.name, "region"),
        actions: (
          <MDBox display="flex" justifyContent="center" gap={0.5}>
            <Tooltip title="Edit" placement="top">
              <IconButton
                size="small"
                onClick={() => handleEdit(product)}
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
                onClick={() => handleDuplicate(product)}
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
                onClick={() => {
                  setDeletingProduct(product);
                  setDeleteDialogOpen(true);
                }}
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
      };

      // Add attribute values
      templateAttributes.forEach((attr) => {
        row[`attr_${attr.attribute_id}`] = formatAttributeValue(attr, product.attributes[attr.attribute_id]);
      });

      return row;
    });
  }, [filteredProducts, templateAttributes]);

  const validationErrors = getValidationErrors();

  // Property filter definitions
  const PROPERTY_FILTER_CONFIG = {
    scope: { label: "Scope", options: scopes, valueField: "scope_id", nameField: "scope" },
    service: { label: "Service", options: services, valueField: "service_id", nameField: "service" },
    service_type: { label: "Service Type", options: serviceTypes, valueField: "service_type_id", nameField: "service_type" },
    region: { label: "Region", options: regions, valueField: "region_id", nameField: "region" },
  };

  // Render filter components for DataTable
  const renderFilterComponents = () => {
    const hasPropertyFilters = filterPropertyKeys.length > 0;
    const hasAttributeFilters = filterableAttributes.length > 0;

    if (!hasPropertyFilters && !hasAttributeFilters) return null;

    return (
      <>
        {/* Property filters (scope, service, service_type, region) */}
        {filterPropertyKeys.map((propKey) => {
          const config = PROPERTY_FILTER_CONFIG[propKey];
          if (!config) return null;

          const filterKey = `prop_${propKey}`;
          const currentValue = filterValues[filterKey] || "";

          return (
            <FormControl key={filterKey} size="small" sx={{ minWidth: 120 }}>
              <InputLabel sx={{ fontSize: "0.875rem" }}>{config.label}</InputLabel>
              <Select
                value={currentValue}
                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                label={config.label}
                sx={{ height: 36, fontSize: "0.875rem" }}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {config.options.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        })}

        {/* Attribute filters */}
        {filterableAttributes.map((attr) => {
          const currentValue = filterValues[attr.attribute_id] || "";
          const dataType = attr.data_type?.toLowerCase();

          // For boolean type, show Yes/No dropdown
          if (dataType === "boolean") {
            return (
              <FormControl key={attr.attribute_id} size="small" sx={{ minWidth: 100 }}>
                <InputLabel sx={{ fontSize: "0.875rem" }}>{attr.display_name}</InputLabel>
                <Select
                  value={currentValue}
                  onChange={(e) => handleFilterChange(attr.attribute_id, e.target.value)}
                  label={attr.display_name}
                  sx={{ height: 36, fontSize: "0.875rem" }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            );
          }

          // For list/dropdown types, use select with list_options
          if (dataType === "list" && Array.isArray(attr.list_options) && attr.list_options.length > 0) {
            return (
              <FormControl key={attr.attribute_id} size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: "0.875rem" }}>{attr.display_name}</InputLabel>
                <Select
                  value={currentValue}
                  onChange={(e) => handleFilterChange(attr.attribute_id, e.target.value)}
                  label={attr.display_name}
                  sx={{ height: 36, fontSize: "0.875rem" }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {attr.list_options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          // For integer type, show number input
          if (dataType === "integer" || dataType === "decimal") {
            return (
              <TextField
                key={attr.attribute_id}
                size="small"
                label={attr.display_name}
                value={currentValue}
                onChange={(e) => handleFilterChange(attr.attribute_id, e.target.value)}
                type="text"
                inputProps={{ inputMode: "numeric" }}
                sx={{
                  minWidth: 100,
                  "& .MuiInputBase-root": { height: 36 },
                  "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                  "& .MuiInputBase-input": { fontSize: "0.875rem" },
                }}
                placeholder={`Filter ${attr.display_name}`}
              />
            );
          }

          // For string, text, json and other types, show text input
          return (
            <TextField
              key={attr.attribute_id}
              size="small"
              label={attr.display_name}
              value={currentValue}
              onChange={(e) => handleFilterChange(attr.attribute_id, e.target.value)}
              sx={{
                minWidth: 120,
                "& .MuiInputBase-root": { height: 36 },
                "& .MuiInputLabel-root": { fontSize: "0.875rem" },
                "& .MuiInputBase-input": { fontSize: "0.875rem" },
              }}
              placeholder={`Filter ${attr.display_name}`}
            />
          );
        })}
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <Chip
              label="Clear"
              size="small"
              onDelete={clearFilters}
              onClick={clearFilters}
              sx={{ height: 28 }}
            />
          </Tooltip>
        )}
      </>
    );
  };

  if (loadingTemplate) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress color="info" />
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!template) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <Card>
            <MDBox p={3}>
              <MDTypography variant="h6" color="error">
                Template not found
              </MDTypography>
            </MDBox>
          </Card>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={2}
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
                  {template.name}
                </MDTypography>
                <MDBox display="flex" alignItems="center" gap={1}>
                  <Tooltip title="Show/Hide Columns">
                    <IconButton
                      size="small"
                      onClick={handleColumnMenuOpen}
                      sx={{ color: "white.main" }}
                    >
                      <Icon>view_column</Icon>
                    </IconButton>
                  </Tooltip>
                  <MDButton variant="contained" color="white" size="small" onClick={handleCreateNew}>
                    <Icon sx={{ mr: 1 }}>add</Icon>
                    Add {template.name}
                  </MDButton>
                </MDBox>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loadingProducts ? (
                  <MDBox display="flex" justifyContent="center" py={5}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : products.length === 0 ? (
                  <MDBox display="flex" flexDirection="column" alignItems="center" py={5}>
                    <MDTypography variant="body2" color="text" mb={2}>
                      No {template.name} products found.
                    </MDTypography>
                    <MDButton variant="outlined" color="info" onClick={handleCreateNew}>
                      Create Your First {template.name}
                    </MDButton>
                  </MDBox>
                ) : (
                  <DataTable
                    table={{ columns, rows }}
                    isSorted={true}
                    entriesPerPage={{ defaultValue: 10 }}
                    showTotalEntries={true}
                    noEndBorder
                    canSearch={true}
                    draggableColumns={true}
                    onColumnOrderChange={handleColumnOrderChange}
                    onResetColumnOrder={resetColumnOrder}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    tableId={template ? `products-${template.id}` : null}
                    filterComponents={renderFilterComponents()}
                  />
                )}
              </MDBox>
            </Card>
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

      {/* Add/Edit Product Modal Dialog */}
      <Dialog
        open={formDialogOpen}
        onClose={handleFormClose}
        aria-labelledby="product-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="product-dialog-title">
          {editingProduct ? `Edit ${template.name}` : `Add ${template.name}`}
        </DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {/* Row 1: Product Name */}
            <TextField
              fullWidth
              label="Product Name *"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              onBlur={() => setFormTouched((prev) => ({ ...prev, name: true }))}
              margin="normal"
              variant="outlined"
              error={formTouched.name && !!validationErrors.name}
              helperText={formTouched.name && validationErrors.name}
            />

            {/* Row 2: Property fields (shown based on template configuration) */}
            {defaultProperties.length > 0 && (
              <Grid container spacing={2}>
                {defaultProperties.includes("scope") && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      error={formTouched.scope_id && !!validationErrors.scope_id}
                    >
                      <InputLabel>Scope *</InputLabel>
                      <Select
                        value={formData.scope_id}
                        onChange={(e) => handleFormChange("scope_id", e.target.value)}
                        onBlur={() => setFormTouched((prev) => ({ ...prev, scope_id: true }))}
                        label="Scope *"
                        sx={{ minHeight: 44 }}
                      >
                        {scopes.map((scope) => (
                          <MenuItem key={scope.id} value={scope.id}>
                            {scope.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formTouched.scope_id && validationErrors.scope_id && (
                        <FormHelperText>{validationErrors.scope_id}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
                {defaultProperties.includes("service") && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl
                      fullWidth
                      margin="normal"
                      error={formTouched.service_id && !!validationErrors.service_id}
                    >
                      <InputLabel>Service *</InputLabel>
                      <Select
                        value={formData.service_id}
                        onChange={(e) => handleFormChange("service_id", e.target.value)}
                        onBlur={() => setFormTouched((prev) => ({ ...prev, service_id: true }))}
                        label="Service *"
                        sx={{ minHeight: 44 }}
                      >
                        {services.map((svc) => (
                          <MenuItem key={svc.id} value={svc.id}>
                            {svc.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {formTouched.service_id && validationErrors.service_id && (
                        <FormHelperText>{validationErrors.service_id}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                )}
                {defaultProperties.includes("service_type") && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={formData.service_type_id}
                        onChange={(e) => handleFormChange("service_type_id", e.target.value)}
                        label="Service Type"
                        sx={{ minHeight: 44 }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {serviceTypes.map((st) => (
                          <MenuItem key={st.id} value={st.id}>
                            {st.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {defaultProperties.includes("region") && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Region</InputLabel>
                      <Select
                        value={formData.region_id}
                        onChange={(e) => handleFormChange("region_id", e.target.value)}
                        label="Region"
                        sx={{ minHeight: 44 }}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {regions.map((region) => (
                          <MenuItem key={region.id} value={region.id}>
                            {region.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            )}

            {/* Required Attributes Section */}
            {templateAttributes.filter((attr) => attr.is_required).length > 0 && (
              <MDBox mt={2}>
                <MDTypography variant="subtitle2" color="text" mb={1}>
                  Required Attributes
                </MDTypography>
                <Grid container spacing={2}>
                  {templateAttributes
                    .filter((attr) => attr.is_required)
                    .map((attr) => {
                      const isTextType = attr.data_type?.toLowerCase() === "text";
                      return (
                        <Grid item xs={12} md={isTextType ? 12 : 6} lg={isTextType ? 12 : 4} key={attr.attribute_id}>
                          {renderAttributeInput(attr)}
                        </Grid>
                      );
                    })}
                </Grid>
              </MDBox>
            )}

            {/* Optional Attributes Section (Collapsible) */}
            {templateAttributes.filter((attr) => !attr.is_required).length > 0 && (
              <MDBox mt={2}>
                <MDBox
                  display="flex"
                  alignItems="center"
                  sx={{ cursor: "pointer" }}
                  onClick={() => setShowOptionalAttrs(!showOptionalAttrs)}
                >
                  <Icon sx={{ mr: 1 }}>
                    {showOptionalAttrs ? "expand_less" : "expand_more"}
                  </Icon>
                  <MDTypography variant="subtitle2" color="text">
                    Show Optional Attributes ({templateAttributes.filter((attr) => !attr.is_required).length})
                  </MDTypography>
                </MDBox>
                <Collapse in={showOptionalAttrs} timeout="auto">
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {templateAttributes
                      .filter((attr) => !attr.is_required)
                      .map((attr) => {
                        const isTextType = attr.data_type?.toLowerCase() === "text";
                        return (
                          <Grid item xs={12} md={isTextType ? 12 : 6} lg={isTextType ? 12 : 4} key={attr.attribute_id}>
                            {renderAttributeInput(attr)}
                          </Grid>
                        );
                      })}
                  </Grid>
                </Collapse>
              </MDBox>
            )}
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleFormClose} color="secondary" disabled={saving}>
            Cancel
          </MDButton>
          <MDButton onClick={handleSave} color="info" disabled={saving}>
            {saving ? "Saving..." : editingProduct ? "Update" : "Add"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {template.name}</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2">
            Are you sure you want to delete &quot;{deletingProduct?.name}&quot;? This action cannot
            be undone.
          </MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
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

export default TemplateProducts;
