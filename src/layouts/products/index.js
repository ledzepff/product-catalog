/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, useMemo } from "react";

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
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Autocomplete from "@mui/material/Autocomplete";

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

function Products() {
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
  const [productTemplates, setProductTemplates] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    scope_id: "",
    service_id: "",
    service_type_id: "",
    region_id: "",
    product_template_id: "",
  });
  const [formTouched, setFormTouched] = useState({});
  const [attributeValues, setAttributeValues] = useState({});
  const [templateAttributes, setTemplateAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Error state
  const [error, setError] = useState(null);

  // Fetch products list
  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const { data, error: fetchError } = await supabase
        .from("products")
        .select(`
          *,
          scope:scopes(id, name),
          service:service(id, name),
          service_type:service_type(id, name),
          region:region(id, name),
          product_attributes(product_template_id)
        `)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;

      // Get unique template IDs to fetch template names
      const templateIds = [
        ...new Set(
          (data || [])
            .flatMap((p) => p.product_attributes?.map((pa) => pa.product_template_id) || [])
            .filter(Boolean)
        ),
      ];

      // Fetch template names if there are any
      let templatesMap = {};
      if (templateIds.length > 0) {
        const { data: templates } = await supabase
          .from("product_templates")
          .select("id, name")
          .in("id", templateIds);

        templatesMap = (templates || []).reduce((acc, t) => {
          acc[t.id] = t;
          return acc;
        }, {});
      }

      // Process data to extract product_template from product_attributes
      const processedData = (data || []).map((product) => {
        const templateId = product.product_attributes?.[0]?.product_template_id;
        return {
          ...product,
          product_template: templateId ? templatesMap[templateId] || null : null,
        };
      });

      setProducts(processedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // Fetch lookup data
  const fetchLookupData = useCallback(async () => {
    try {
      const [scopesRes, servicesRes, serviceTypesRes, regionsRes, templatesRes] = await Promise.all([
        supabase.from("scopes").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service").select("id, name").eq("is_active", true).order("name"),
        supabase.from("service_type").select("id, name").eq("is_active", true).order("name"),
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
        supabase.from("product_templates").select("id, name").eq("is_active", true).order("name"),
      ]);

      if (scopesRes.error) throw scopesRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (serviceTypesRes.error) throw serviceTypesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setScopes(scopesRes.data || []);
      setServices(servicesRes.data || []);
      setServiceTypes(serviceTypesRes.data || []);
      setRegions(regionsRes.data || []);
      setProductTemplates(templatesRes.data || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Fetch template attributes when template is selected
  const fetchTemplateAttributes = useCallback(async (templateId) => {
    if (!templateId) {
      setTemplateAttributes([]);
      setAttributeValues({});
      return;
    }

    try {
      setLoadingAttributes(true);
      const { data, error: fetchError } = await supabase
        .from("product_template_attributes")
        .select(`
          *,
          attribute:attribute_definitions(*)
        `)
        .eq("product_template_id", templateId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (fetchError) throw fetchError;

      // Filter to only include attributes where attribute_definitions.is_active is true
      const attrs = (data || [])
        .filter((pta) => pta.attribute?.is_active === true)
        .map((pta) => ({
          id: pta.id,
          attribute_id: pta.attribute?.id,
          attribute_key: pta.attribute?.attribute_key,
          display_name: pta.attribute?.display_name,
          data_type: pta.attribute?.data_type,
          unit: pta.attribute?.unit,
          is_required: pta.is_required,
          default_value: pta.attribute?.default_value,
          validation_rules: pta.attribute?.validation_rules,
          options: pta.attribute?.options,
          sort_order: pta.sort_order,
        }));

      setTemplateAttributes(attrs);

      // Initialize attribute values with defaults or existing values
      const initialValues = {};
      attrs.forEach((attr) => {
        initialValues[attr.attribute_id] = attr.default_value || "";
      });
      setAttributeValues(initialValues);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAttributes(false);
    }
  }, []);

  // Fetch product attribute values for editing
  const fetchProductAttributeValues = useCallback(async (productId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("product_attributes")
        .select(`
          *,
          attribute:attribute_definitions(id, data_type)
        `)
        .eq("product_id", productId)
        .eq("is_active", true);

      if (fetchError) throw fetchError;

      const values = {};
      (data || []).forEach((pa) => {
        const dataType = pa.attribute?.data_type?.toLowerCase();
        let value = "";
        switch (dataType) {
          case "integer":
            value = pa.value_integer?.toString() ?? "";
            break;
          case "decimal":
            value = pa.value_decimal?.toString() ?? "";
            break;
          case "boolean":
            value = pa.value_boolean ?? false;
            break;
          case "json":
            value = pa.value_json ? JSON.stringify(pa.value_json) : "";
            break;
          default:
            value = pa.value_string ?? "";
        }
        values[pa.attribute?.id] = value;
      });

      setAttributeValues((prev) => ({ ...prev, ...values }));
    } catch (err) {
      console.error("Error fetching product attribute values:", err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchLookupData();
  }, [fetchProducts, fetchLookupData]);

  // Fetch attributes when template changes
  useEffect(() => {
    if (formData.product_template_id) {
      fetchTemplateAttributes(formData.product_template_id);
    }
  }, [formData.product_template_id, fetchTemplateAttributes]);

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

    // Check required - from template attribute or validation rules
    const isRequired = attr.is_required || parsedRules.required;
    if (isRequired && (value === "" || value === null || value === undefined)) {
      errors.push("This field is required");
      return errors;
    }

    if (value === "" || value === null || value === undefined) {
      return errors; // Skip other validations for empty optional fields
    }

    const dataType = attr.data_type?.toLowerCase();

    // Numeric validations (integer/decimal)
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
          // Invalid regex pattern, skip validation
        }
      }
    }

    return errors;
  };

  // Get all validation errors
  const getValidationErrors = () => {
    const errors = {};

    // Form field validations
    if (!formData.name?.trim()) errors.name = "Product name is required";
    if (!formData.scope_id) errors.scope_id = "Scope is required";
    if (!formData.service_id) errors.service_id = "Service is required";
    if (!formData.product_template_id) errors.product_template_id = "Product template is required";

    // Attribute validations
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

  // Split attributes into required and optional
  const { requiredAttributes, optionalAttributes } = useMemo(() => {
    const required = templateAttributes.filter((attr) => attr.is_required);
    const optional = templateAttributes.filter((attr) => !attr.is_required);
    return { requiredAttributes: required, optionalAttributes: optional };
  }, [templateAttributes]);

  // Open form for creating new product
  const handleCreateNew = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      scope_id: "",
      service_id: "",
      service_type_id: "",
      region_id: "",
      product_template_id: "",
    });
    setFormTouched({});
    setAttributeValues({});
    setTemplateAttributes([]);
    setShowOptionalFields(false);
    setFormDialogOpen(true);
  };

  // Open form for editing product
  const handleEdit = async (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      scope_id: product.scope?.id || "",
      service_id: product.service?.id || "",
      service_type_id: product.service_type?.id || "",
      region_id: product.region?.id || "",
      product_template_id: product.product_template?.id || "",
    });
    setFormTouched({});
    setShowOptionalFields(true);
    setFormDialogOpen(true);

    // Fetch template attributes and product values
    if (product.product_template?.id) {
      await fetchTemplateAttributes(product.product_template.id);
      await fetchProductAttributeValues(product.id);
    }
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
      product_template_id: "",
    });
    setFormTouched({});
    setAttributeValues({});
    setTemplateAttributes([]);
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
        // Update existing product
        const { error: updateError } = await supabase
          .from("products")
          .update({ ...productData, updated_at: new Date().toISOString() })
          .eq("id", editingProduct.id);

        if (updateError) throw updateError;
        productId = editingProduct.id;

        // Soft delete existing attribute values
        await supabase
          .from("product_attributes")
          .update({ is_active: false })
          .eq("product_id", productId);
      } else {
        // Create new product
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (insertError) throw insertError;
        productId = newProduct.id;
      }

      // Save attribute values to product_attributes table
      const attributeInserts = [];
      templateAttributes.forEach((attr) => {
        const value = attributeValues[attr.attribute_id];
        if (value !== "" && value !== null && value !== undefined) {
          const dataType = attr.data_type?.toLowerCase();
          const record = {
            product_id: productId,
            product_template_id: formData.product_template_id,
            attribute_definition_id: attr.attribute_id,
            value_string: null,
            value_integer: null,
            value_decimal: null,
            value_boolean: null,
            value_json: null,
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

      setSnackbar({
        open: true,
        message: editingProduct ? "Product updated successfully!" : "Product created successfully!",
        severity: "success",
      });
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

  // Render attribute input based on data type
  const renderAttributeInput = (attr, isRequired = false) => {
    const value = attributeValues[attr.attribute_id] ?? "";
    const errors = getValidationErrors();
    const errorKey = `attr_${attr.attribute_id}`;
    const hasError = formTouched[errorKey] && errors[errorKey];
    const dataType = attr.data_type?.toLowerCase();
    const label = isRequired ? `${attr.display_name} *` : attr.display_name;

    // Handler to mark attribute as touched
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
          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
                <Switch
                  checked={value === true || value === "true"}
                  onChange={(e) => handleAttributeChange(attr.attribute_id, e.target.checked)}
                  color="info"
                />
              }
              label={`${attr.display_name}: ${value === true || value === "true" ? "Yes" : "No"}`}
            />
          </FormControl>
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

  // Table columns
  const columns = [
    { Header: "Name", accessor: "name", width: "20%" },
    { Header: "Scope", accessor: "scope_name", width: "10%" },
    { Header: "Service", accessor: "service_name", width: "15%" },
    { Header: "Service Type", accessor: "service_type_name", width: "15%" },
    { Header: "Region", accessor: "region_name", width: "15%" },
    { Header: "Template", accessor: "template_name", width: "15%" },
    { Header: "Actions", accessor: "actions", width: "10%", align: "center" },
  ];

  // Table rows
  const rows = products.map((product) => ({
    name: product.name,
    scope_name: product.scope?.name || "-",
    service_name: product.service?.name || "-",
    service_type_name: product.service_type?.name || "-",
    region_name: product.region?.name || "-",
    template_name: product.product_template?.name || "-",
    actions: (
      <MDBox display="flex" justifyContent="center" gap={1}>
        <IconButton size="small" onClick={() => handleEdit(product)}>
          <Icon fontSize="small">edit</Icon>
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            setDeletingProduct(product);
            setDeleteDialogOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <Icon fontSize="small">delete</Icon>
        </IconButton>
      </MDBox>
    ),
  }));

  const validationErrors = getValidationErrors();

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
                  Products
                </MDTypography>
                <MDButton variant="contained" color="white" size="small" onClick={handleCreateNew}>
                  <Icon sx={{ mr: 1 }}>add</Icon>
                  Add Product
                </MDButton>
              </MDBox>
              <MDBox pt={3} px={2} pb={2}>
                {loadingProducts ? (
                  <MDBox display="flex" justifyContent="center" py={5}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : products.length === 0 ? (
                  <MDBox display="flex" flexDirection="column" alignItems="center" py={5}>
                    <MDTypography variant="body2" color="text" mb={2}>
                      No products found.
                    </MDTypography>
                    <MDButton variant="outlined" color="info" onClick={handleCreateNew}>
                      Create Your First Product
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
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle id="product-dialog-title">
          {editingProduct ? "Edit Product" : "Add Product"}
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

            {/* Row 2: Scope, Service, Service Type, Region (4 columns) */}
            <Grid container spacing={2}>
              <Grid item xs={3}>
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
              <Grid item xs={3}>
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
              <Grid item xs={3}>
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
              <Grid item xs={3}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={formTouched.region_id && !!validationErrors.region_id}
                >
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={formData.region_id}
                    onChange={(e) => handleFormChange("region_id", e.target.value)}
                    onBlur={() => setFormTouched((prev) => ({ ...prev, region_id: true }))}
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
                  {formTouched.region_id && validationErrors.region_id && (
                    <FormHelperText>{validationErrors.region_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            {/* Row 3: Product Template */}
            <FormControl
              fullWidth
              margin="normal"
              error={formTouched.product_template_id && !!validationErrors.product_template_id}
            >
              <InputLabel>Product Template *</InputLabel>
              <Select
                value={formData.product_template_id}
                onChange={(event) => handleFormChange("product_template_id", event.target.value)}
                onBlur={() => setFormTouched((prev) => ({ ...prev, product_template_id: true }))}
                label="Product Template *"
                sx={{ minHeight: 44 }}
              >
                <MenuItem value="">
                  <em>Select a template...</em>
                </MenuItem>
                {productTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
              {formTouched.product_template_id && validationErrors.product_template_id && (
                <FormHelperText>{validationErrors.product_template_id}</FormHelperText>
              )}
            </FormControl>

            {/* Template Attributes */}
            {formData.product_template_id && (
              <>
                <Divider sx={{ my: 3 }} />
                <MDTypography variant="h6" mb={1}>
                  Attributes
                </MDTypography>

                {loadingAttributes ? (
                  <MDBox display="flex" justifyContent="center" py={3}>
                    <CircularProgress color="info" size={30} />
                  </MDBox>
                ) : templateAttributes.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No attributes defined for this template.
                  </MDTypography>
                ) : (
                  <>
                    {/* Required Attributes */}
                    {requiredAttributes.length > 0 && (
                      <MDBox mb={2}>
                        <MDTypography variant="subtitle2" color="text" mb={1}>
                          Required Fields
                        </MDTypography>
                        <Grid container spacing={2}>
                          {requiredAttributes.map((attr) => (
                            <Grid item xs={12} md={6} lg={3} key={attr.attribute_id}>
                              {renderAttributeInput(attr, true)}
                            </Grid>
                          ))}
                        </Grid>
                      </MDBox>
                    )}

                    {/* Optional Attributes */}
                    {optionalAttributes.length > 0 && (
                      <MDBox>
                        <MDBox
                          display="flex"
                          alignItems="center"
                          sx={{ cursor: "pointer" }}
                          onClick={() => setShowOptionalFields(!showOptionalFields)}
                          mb={1}
                        >
                          <Icon sx={{ mr: 1 }}>
                            {showOptionalFields ? "expand_less" : "expand_more"}
                          </Icon>
                          <MDTypography variant="subtitle2" color="text">
                            Optional Fields ({optionalAttributes.length})
                          </MDTypography>
                        </MDBox>
                        <Collapse in={showOptionalFields}>
                          <Grid container spacing={2}>
                            {optionalAttributes.map((attr) => (
                              <Grid item xs={12} md={6} lg={3} key={attr.attribute_id}>
                                {renderAttributeInput(attr, false)}
                              </Grid>
                            ))}
                          </Grid>
                        </Collapse>
                      </MDBox>
                    )}
                  </>
                )}
              </>
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
        <DialogTitle>Delete Product</DialogTitle>
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
    </DashboardLayout>
  );
}

export default Products;
