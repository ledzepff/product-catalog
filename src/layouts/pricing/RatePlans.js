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
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";

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

// CSV parsing
import Papa from "papaparse";

function RatePlans() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Lookup data
  const [products, setProducts] = useState([]);
  const [meters, setMeters] = useState([]);
  const [pricingAttributes, setPricingAttributes] = useState([]);
  const [units, setUnits] = useState([]);
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
  const [editFormTouched, setEditFormTouched] = useState({});

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    product_id: "",
    meter_id: "",
    pricing_attribute_id: "",
    unit_id: "",
    region_id: "",
    currency: "AZN",
    price: "",
    description: "",
    is_default: false,
  });
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({});

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Column order state
  const [columnOrder, setColumnOrder] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);

  // Bulk Upload Modal state
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkUploadStep, setBulkUploadStep] = useState(0); // 0: upload, 1: preview, 2: results
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState({ success: 0, failed: 0, errors: [] });

  // Product Search Modal state
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchStep, setProductSearchStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateProducts, setTemplateProducts] = useState([]);
  const [loadingTemplateProducts, setLoadingTemplateProducts] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [existingProductRatePlans, setExistingProductRatePlans] = useState([]);

  // localStorage keys
  const COLUMN_ORDER_KEY = "rate-plans-column-order";
  const HIDDEN_COLUMNS_KEY = "rate-plans-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("rate_plans")
        .select(`
          *,
          product:products(id, name),
          meter:meters(id, name),
          pricing_attribute:pricing_attributes(id, name),
          unit:units(id, name, symbol),
          region:region(id, name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setData(tableData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLookups() {
    try {
      const [metersRes, pricingAttrsRes, unitsRes, regionsRes, templatesRes] = await Promise.all([
        supabase.from("meters").select("id, name, value_type:meter_value_types(id, name)").is("deleted_at", null).order("name"),
        supabase.from("pricing_attributes").select("id, name").is("deleted_at", null).order("name"),
        supabase.from("units").select("id, name, symbol").is("deleted_at", null).order("name"),
        supabase.from("region").select("id, name").eq("is_active", true).order("name"),
        supabase.from("product_templates").select("id, name, description").eq("is_active", true).order("name"),
      ]);

      if (metersRes.error) throw metersRes.error;
      if (pricingAttrsRes.error) throw pricingAttrsRes.error;
      if (unitsRes.error) throw unitsRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setMeters(metersRes.data || []);
      setPricingAttributes(pricingAttrsRes.data || []);
      setUnits(unitsRes.data || []);
      setRegions(regionsRes.data || []);
      setTemplates(templatesRes.data || []);

      // Fetch ALL active products
      const { data: allProducts, error: productsError } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name");

      if (productsError) throw productsError;

      // Build products map with all products (including those without attributes)
      const productsMap = new Map();
      (allProducts || []).forEach((p) => {
        productsMap.set(p.id, {
          id: p.id,
          name: p.name,
          attributes: {},
        });
      });

      // Fetch product attributes to enrich products with attribute data
      const { data: productAttrs, error: attrsError } = await supabase
        .from("product_attributes")
        .select(`
          product_id,
          attribute_definition_id,
          value_string,
          value_integer,
          value_decimal,
          value_boolean,
          value_json,
          value_text,
          attribute:attribute_definitions(id, attribute_key, display_name, data_type)
        `)
        .eq("is_active", true);

      if (attrsError) throw attrsError;

      // Enrich products with their attributes
      (productAttrs || []).forEach((pa) => {
        const product = productsMap.get(pa.product_id);
        if (!product) return; // Skip if product not in map (inactive/deleted)

        const dataType = pa.attribute?.data_type?.toLowerCase();
        const attrKey = pa.attribute?.attribute_key;

        if (attrKey) {
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
            default:
              value = pa.value_string;
          }
          product.attributes[attrKey] = value;
        }
      });

      setProducts(Array.from(productsMap.values()));
    } catch (err) {
      setError(err.message);
    }
  }

  // Fetch products for a specific template
  async function fetchTemplateProducts(templateId) {
    try {
      setLoadingTemplateProducts(true);

      // Fetch product IDs that belong to this template
      const { data: productAttrs, error: attrsError } = await supabase
        .from("product_attributes")
        .select(`
          product_id,
          product:products(
            id, name, is_active,
            scope:scopes(id, name),
            service:service(id, name)
          )
        `)
        .eq("product_template_id", templateId)
        .eq("is_active", true);

      if (attrsError) throw attrsError;

      // Deduplicate and filter active products
      const productsMap = new Map();
      (productAttrs || []).forEach((pa) => {
        if (pa.product?.is_active && !productsMap.has(pa.product_id)) {
          productsMap.set(pa.product_id, pa.product);
        }
      });

      setTemplateProducts(Array.from(productsMap.values()));
    } catch (err) {
      console.error("Error fetching template products:", err);
      setError(err.message);
    } finally {
      setLoadingTemplateProducts(false);
    }
  }

  // Fetch existing rate plans for a product
  async function fetchProductRatePlans(productId) {
    try {
      const { data: ratePlansData, error: fetchError } = await supabase
        .from("rate_plans")
        .select(`
          *,
          meter:meters(id, name),
          pricing_attribute:pricing_attributes(id, name),
          unit:units(id, name, symbol),
          region:region(id, name)
        `)
        .eq("product_id", productId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setExistingProductRatePlans(ratePlansData || []);
    } catch (err) {
      console.error("Error fetching product rate plans:", err);
      setExistingProductRatePlans([]);
    }
  }

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

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

  const saveColumnOrder = useCallback((order) => {
    localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
  }, []);

  const saveHiddenColumns = useCallback((hidden) => {
    localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(hidden));
  }, []);

  const toggleColumnVisibility = (columnId) => {
    setHiddenColumns((prev) => {
      const newHidden = prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId];
      saveHiddenColumns(newHidden);
      return newHidden;
    });
  };

  const showAllColumns = () => {
    setHiddenColumns([]);
    saveHiddenColumns([]);
  };

  const handleColumnMenuOpen = (event) => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setColumnMenuAnchor(null);
  };

  const handleColumnOrderChange = (newOrder) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  };

  const resetColumnOrder = () => {
    setColumnOrder([]);
    localStorage.removeItem(COLUMN_ORDER_KEY);
    setHiddenColumns([]);
    localStorage.removeItem(HIDDEN_COLUMNS_KEY);
  };

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
        .from("rate_plans")
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowToDelete.id);

      if (updateError) throw updateError;

      await fetchData();
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    // Check if meter is percentage type and convert stored value (0.1) to display value (10)
    const isPercentage = isPercentageMeter(row.meter_id);
    const priceDisplay = isPercentage && row.price != null ? displayPercentage(row.price) : (row.price || "");
    setEditFormData({
      product_id: row.product_id || "",
      meter_id: row.meter_id || "",
      pricing_attribute_id: row.pricing_attribute_id || "",
      unit_id: row.unit_id || "",
      region_id: row.region_id || "",
      currency: row.currency || "USD",
      price: priceDisplay,
      description: row.description || "",
      is_default: row.is_default || false,
    });
    setEditFormTouched({});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditFormTouched({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      const isPercentage = isPercentageMeter(editFormData.meter_id);
      let priceValue = null;
      if (editFormData.price) {
        priceValue = isPercentage ? storePercentage(editFormData.price) : parseFloat(editFormData.price);
      }
      const { error: updateError } = await supabase
        .from("rate_plans")
        .update({
          product_id: editFormData.product_id || null,
          meter_id: editFormData.meter_id || null,
          pricing_attribute_id: editFormData.pricing_attribute_id || null,
          unit_id: editFormData.unit_id || null,
          region_id: editFormData.region_id || null,
          currency: editFormData.currency || null,
          price: priceValue,
          description: editFormData.description || null,
          is_default: editFormData.is_default,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRow.id);

      if (updateError) throw updateError;

      await fetchData();
      handleEditClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddClick = () => {
    // Open the Product Search Modal instead of directly opening the add dialog
    setProductSearchOpen(true);
    setProductSearchStep(0);
    setSelectedTemplate(null);
    setTemplateProducts([]);
    setProductSearchTerm("");
    setSelectedProduct(null);
    setExistingProductRatePlans([]);
  };

  // Open add dialog directly with a product already selected
  const handleAddClickDirect = () => {
    setAddFormData({
      product_id: "",
      meter_id: "",
      pricing_attribute_id: "",
      unit_id: "",
      region_id: "",
      currency: "AZN",
      price: "",
      description: "",
      is_default: false,
    });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleDuplicateClick = (row) => {
    // Check if meter is percentage type and convert stored value (0.1) to display value (10)
    const isPercentage = isPercentageMeter(row.meter_id);
    const priceDisplay = isPercentage && row.price != null ? displayPercentage(row.price) : (row.price || "");
    setAddFormData({
      product_id: row.product_id || "",
      meter_id: row.meter_id || "",
      pricing_attribute_id: row.pricing_attribute_id || "",
      unit_id: row.unit_id || "",
      region_id: row.region_id || "",
      currency: row.currency || "USD",
      price: priceDisplay,
      description: row.description ? `${row.description} (Copy)` : "(Copy)",
      is_default: false,
    });
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({
      product_id: "",
      meter_id: "",
      pricing_attribute_id: "",
      unit_id: "",
      region_id: "",
      currency: "AZN",
      price: "",
      description: "",
      is_default: false,
    });
    setAddFormTouched({});
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);
      const isPercentage = isPercentageMeter(addFormData.meter_id);
      let priceValue = null;
      if (addFormData.price) {
        priceValue = isPercentage ? storePercentage(addFormData.price) : parseFloat(addFormData.price);
      }
      const { error: insertError } = await supabase.from("rate_plans").insert({
        product_id: addFormData.product_id || null,
        meter_id: addFormData.meter_id || null,
        pricing_attribute_id: addFormData.pricing_attribute_id || null,
        unit_id: addFormData.unit_id || null,
        region_id: addFormData.region_id || null,
        currency: addFormData.currency || null,
        price: priceValue,
        description: addFormData.description || null,
        is_default: addFormData.is_default,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      await fetchData();
      handleAddClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const isFormValid = () => true; // No required fields

  // Product Search Modal handlers
  const handleProductSearchClose = () => {
    setProductSearchOpen(false);
    setProductSearchStep(0);
    setSelectedTemplate(null);
    setTemplateProducts([]);
    setProductSearchTerm("");
    setSelectedProduct(null);
    setExistingProductRatePlans([]);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setProductSearchStep(1);
    fetchTemplateProducts(template.id);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    fetchProductRatePlans(product.id);
    setProductSearchStep(2);
  };

  const handleCreateRatePlanFromSearch = () => {
    if (!selectedProduct) return;

    setAddFormData({
      product_id: selectedProduct.id,
      meter_id: "",
      pricing_attribute_id: "",
      unit_id: "",
      region_id: selectedProduct.region?.id || "",
      currency: "AZN",
      price: "",
      description: "",
      is_default: false,
    });
    setAddFormTouched({});
    handleProductSearchClose();
    setAddDialogOpen(true);
  };

  const handleDuplicateExistingRatePlan = (ratePlan) => {
    // Check if meter is percentage type and convert stored value (0.1) to display value (10)
    const isPercentage = isPercentageMeter(ratePlan.meter_id);
    const priceDisplay = isPercentage && ratePlan.price != null ? displayPercentage(ratePlan.price) : (ratePlan.price || "");
    setAddFormData({
      product_id: selectedProduct?.id || ratePlan.product_id || "",
      meter_id: ratePlan.meter_id || "",
      pricing_attribute_id: ratePlan.pricing_attribute_id || "",
      unit_id: ratePlan.unit_id || "",
      region_id: ratePlan.region_id || "",
      currency: ratePlan.currency || "USD",
      price: priceDisplay,
      description: ratePlan.description ? `${ratePlan.description} (Copy)` : "(Copy)",
      is_default: false,
    });
    setAddFormTouched({});
    handleProductSearchClose();
    setAddDialogOpen(true);
  };

  const handleProductSearchBack = () => {
    if (productSearchStep === 1) {
      setProductSearchStep(0);
      setSelectedTemplate(null);
      setTemplateProducts([]);
      setProductSearchTerm("");
    } else if (productSearchStep === 2) {
      setProductSearchStep(1);
      setSelectedProduct(null);
      setExistingProductRatePlans([]);
    }
  };

  // Bulk Upload handlers
  const handleBulkUploadOpen = () => {
    setBulkUploadOpen(true);
    setBulkUploadStep(0);
    setCsvData([]);
    setCsvErrors([]);
    setBulkUploadResults({ success: 0, failed: 0, errors: [] });
  };

  const handleBulkUploadClose = () => {
    setBulkUploadOpen(false);
    setBulkUploadStep(0);
    setCsvData([]);
    setCsvErrors([]);
    setBulkUploadResults({ success: 0, failed: 0, errors: [] });
  };

  // Helper function to find ID by name (case-insensitive)
  const findIdByName = (list, name, fieldName = "name") => {
    if (!name || !name.trim()) return { id: null, found: true, name: "" };
    const trimmedName = name.trim().toLowerCase();
    const found = list.find((item) => item[fieldName]?.toLowerCase() === trimmedName);
    return {
      id: found?.id || null,
      found: !!found,
      name: name.trim(),
    };
  };

  // Helper to find product by name and attributes
  // Note: Products no longer have region_id - region is stored on rate_plan itself
  const findProductByNameAndAttributes = (productName, row, csvColumns) => {
    if (!productName || !productName.trim()) {
      return { id: null, found: true, name: "", matchType: "empty" };
    }

    const trimmedName = productName.trim().toLowerCase();

    // Find all products matching the name
    let matchingProducts = products.filter(
      (p) => p.name?.toLowerCase() === trimmedName
    );

    if (matchingProducts.length === 0) {
      return { id: null, found: false, name: productName.trim(), matchType: "not_found" };
    }

    // If there's only one product with this name, validate attr_* columns if provided
    if (matchingProducts.length === 1) {
      const product = matchingProducts[0];

      // Check if any attr_* columns are provided in CSV
      const attrFilters = {};
      csvColumns.forEach((col) => {
        if (col.startsWith("attr_")) {
          const attrKey = col.substring(5);
          const value = row[col];
          if (value !== undefined && value !== null && value !== "") {
            attrFilters[attrKey] = String(value).trim().toLowerCase();
          }
        }
      });

      // If attr_* columns provided, validate they match the product's attributes
      if (Object.keys(attrFilters).length > 0) {
        const attrMismatches = [];
        Object.entries(attrFilters).forEach(([attrKey, filterValue]) => {
          const productAttrValue = product.attributes?.[attrKey];
          const productValueStr = productAttrValue !== undefined && productAttrValue !== null
            ? String(productAttrValue).toLowerCase()
            : "";

          if (productValueStr !== filterValue) {
            attrMismatches.push({
              attrKey,
              csvValue: filterValue,
              availableValues: productAttrValue !== undefined && productAttrValue !== null
                ? [String(productAttrValue)]
                : ["(not set)"],
            });
          }
        });

        if (attrMismatches.length > 0) {
          return {
            id: null,
            found: false,
            name: productName.trim(),
            matchType: "attr_mismatch_unique",
            message: `Product "${productName}" found but attr_* values don't match`,
            attrMismatches,
            product,
          };
        }
      }

      return {
        id: product.id,
        found: true,
        name: productName.trim(),
        matchType: "unique",
        product,
      };
    }

    // Multiple products with same name - try attr_* columns to disambiguate
    const attrFilters = {};
    csvColumns.forEach((col) => {
      if (col.startsWith("attr_")) {
        const attrKey = col.substring(5);
        const value = row[col];
        if (value !== undefined && value !== null && value !== "") {
          attrFilters[attrKey] = String(value).trim().toLowerCase();
        }
      }
    });

    // Filter by attributes if provided
    if (Object.keys(attrFilters).length > 0) {
      const attrFiltered = matchingProducts.filter((p) => {
        return Object.entries(attrFilters).every(([attrKey, filterValue]) => {
          const productAttrValue = p.attributes?.[attrKey];
          if (productAttrValue === undefined || productAttrValue === null) {
            return filterValue === "";
          }
          return String(productAttrValue).toLowerCase() === filterValue;
        });
      });

      if (attrFiltered.length === 1) {
        return {
          id: attrFiltered[0].id,
          found: true,
          name: productName.trim(),
          matchType: "attr_match",
          product: attrFiltered[0],
        };
      }

      if (attrFiltered.length === 0) {
        // Collect detailed mismatch information for each attr_* column
        const attrMismatches = [];
        Object.entries(attrFilters).forEach(([attrKey, filterValue]) => {
          // Get all unique values for this attribute across matching products
          const availableValues = [...new Set(
            matchingProducts
              .map((p) => p.attributes?.[attrKey])
              .filter((v) => v !== undefined && v !== null && v !== "")
              .map((v) => String(v))
          )];

          // Check if the filter value matches any product
          const hasMatch = matchingProducts.some((p) => {
            const productAttrValue = p.attributes?.[attrKey];
            if (productAttrValue === undefined || productAttrValue === null) {
              return filterValue === "";
            }
            return String(productAttrValue).toLowerCase() === filterValue;
          });

          if (!hasMatch) {
            attrMismatches.push({
              attrKey,
              csvValue: filterValue,
              availableValues: availableValues.length > 0 ? availableValues : ["(not set)"],
            });
          }
        });

        return {
          id: null,
          found: false,
          name: productName.trim(),
          matchType: "no_match",
          message: `No product "${productName}" matches the specified attributes`,
          attrMismatches,
        };
      }

      matchingProducts = attrFiltered;
    }

    // Still ambiguous
    return {
      id: null,
      found: false,
      name: productName.trim(),
      matchType: "ambiguous",
      matchCount: matchingProducts.length,
      message: `Multiple products named "${productName}" found (${matchingProducts.length}). Add attr_* columns to specify.`,
    };
  };

  // Helper to create a unique key for rate plan duplicate detection
  const createRatePlanKey = (productId, meterId, pricingAttrId, unitId, regionId) => {
    return `${productId || ""}-${meterId || ""}-${pricingAttrId || ""}-${unitId || ""}-${regionId || ""}`;
  };

  // Process CSV data and validate lookups
  const processCSVData = (rawData, csvColumns) => {
    // Create a set of existing rate plan keys for duplicate detection
    const existingKeys = new Set(
      data.map((rp) =>
        createRatePlanKey(rp.product_id, rp.meter_id, rp.pricing_attribute_id, rp.unit_id, rp.region_id)
      )
    );

    // Track keys within the CSV to detect duplicates within the file itself
    const csvKeys = new Set();

    const processed = rawData.map((row, index) => {
      // Resolve lookups
      const regionLookup = findIdByName(regions, row.region_name);
      const productLookup = findProductByNameAndAttributes(row.product_name, row, csvColumns);
      const meterLookup = findIdByName(meters, row.meter_name);
      const pricingAttrLookup = findIdByName(pricingAttributes, row.pricing_attribute_name);
      const unitLookup = findIdByName(units, row.unit_name);

      // Check if meter is percentage type (for display purposes only)
      const meterObj = meters.find((m) => m.id === meterLookup.id);
      const isPercentage = meterObj?.value_type?.name?.toLowerCase().includes("percent") || false;

      // Parse price value - store as-is, no conversion
      let priceValue = null;
      if (row.price !== "" && row.price !== null && row.price !== undefined) {
        const parsedPrice = parseFloat(row.price);
        if (!isNaN(parsedPrice)) {
          priceValue = parsedPrice;
        }
      }

      // Parse is_default
      const isDefault = row.is_default === "true" || row.is_default === "TRUE" || row.is_default === "1" || row.is_default === true;

      const errors = [];

      // Product lookup errors (with enhanced messages for ambiguous cases)
      if (!productLookup.found) {
        if (productLookup.matchType === "ambiguous" || productLookup.matchType === "no_match") {
          errors.push(productLookup.message);
        } else if (productLookup.name) {
          errors.push(`Product "${productLookup.name}" not found`);
        }
      }

      if (!meterLookup.found && meterLookup.name) errors.push(`Meter "${meterLookup.name}" not found`);
      if (!pricingAttrLookup.found && pricingAttrLookup.name) errors.push(`Pricing Attribute "${pricingAttrLookup.name}" not found`);
      if (!unitLookup.found && unitLookup.name) errors.push(`Unit "${unitLookup.name}" not found`);
      if (!regionLookup.found && regionLookup.name) errors.push(`Region "${regionLookup.name}" not found`);

      // Check for duplicates (only if all lookups are valid)
      let isDuplicate = false;
      let isDuplicateInCsv = false;
      if (errors.length === 0) {
        const rowKey = createRatePlanKey(
          productLookup.id,
          meterLookup.id,
          pricingAttrLookup.id,
          unitLookup.id,
          regionLookup.id
        );

        // Check against existing rate plans in database
        if (existingKeys.has(rowKey)) {
          isDuplicate = true;
          errors.push("Duplicate: Rate plan already exists in database");
        }

        // Check against other rows in the CSV
        if (csvKeys.has(rowKey)) {
          isDuplicateInCsv = true;
          errors.push("Duplicate: Same combination appears earlier in CSV");
        }

        // Add to CSV keys set
        csvKeys.add(rowKey);
      }

      const hasErrors = errors.length > 0;

      return {
        rowIndex: index + 1,
        original: row,
        product: productLookup,
        meter: meterLookup,
        pricingAttribute: pricingAttrLookup,
        unit: unitLookup,
        region: regionLookup,
        currency: row.currency?.trim() || "AZN",
        price: priceValue,
        priceDisplay: isPercentage && priceValue != null ? (priceValue * 100).toString() : row.price,
        isPercentage,
        description: row.description?.trim() || "",
        isDefault,
        errors,
        hasErrors,
        isValid: !hasErrors,
        isDuplicate,
        isDuplicateInCsv,
      };
    });

    return processed;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setCsvErrors(results.errors.map((e) => `Row ${e.row}: ${e.message}`));
        } else {
          setCsvErrors([]);
        }

        // Get CSV column names (including any attr_* columns)
        const csvColumns = results.meta?.fields || [];

        const processed = processCSVData(results.data, csvColumns);
        setCsvData(processed);
        setBulkUploadStep(1);
      },
      error: (error) => {
        setCsvErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });

    // Reset file input
    event.target.value = "";
  };

  const handleBulkUploadConfirm = async () => {
    const validRows = csvData.filter((row) => row.isValid);
    if (validRows.length === 0) return;

    setBulkUploading(true);
    const results = { success: 0, failed: 0, errors: [] };

    for (const row of validRows) {
      try {
        const { error: insertError } = await supabase.from("rate_plans").insert({
          product_id: row.product.id,
          meter_id: row.meter.id,
          pricing_attribute_id: row.pricingAttribute.id,
          unit_id: row.unit.id,
          region_id: row.region.id,
          currency: row.currency,
          price: row.price,
          description: row.description,
          is_default: row.isDefault,
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          results.failed++;
          results.errors.push(`Row ${row.rowIndex}: ${insertError.message}`);
        } else {
          results.success++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${row.rowIndex}: ${err.message}`);
      }
    }

    setBulkUploadResults(results);
    setBulkUploadStep(2);
    setBulkUploading(false);

    // Refresh data if any rows were successful
    if (results.success > 0) {
      await fetchData();
    }
  };

  // Get all unique attribute keys from all products
  const getAllProductAttributeKeys = () => {
    const attrKeys = new Set();
    products.forEach((p) => {
      if (p.attributes) {
        Object.keys(p.attributes).forEach((key) => attrKeys.add(key));
      }
    });
    return Array.from(attrKeys).sort();
  };

  // Check if there are duplicate product names (need attr_* columns)
  const hasDuplicateProductNames = () => {
    const nameCount = {};
    products.forEach((p) => {
      const name = p.name?.toLowerCase();
      if (name) {
        nameCount[name] = (nameCount[name] || 0) + 1;
      }
    });
    return Object.values(nameCount).some((count) => count > 1);
  };

  const downloadCSVTemplate = () => {
    // Base headers
    const headers = [
      "product_name",
      "meter_name",
      "pricing_attribute_name",
      "unit_name",
      "region_name",
      "currency",
      "price",
      "description",
      "is_default",
    ];

    // Add attr_* columns if there are duplicate product names that need more disambiguation
    const attrKeys = getAllProductAttributeKeys();
    if (hasDuplicateProductNames() && attrKeys.length > 0) {
      attrKeys.forEach((key) => headers.push(`attr_${key}`));
    }

    // Example row
    const firstProduct = products[0];
    const exampleRow = [
      firstProduct?.name || "Product Name",
      meters[0]?.name || "Meter Name",
      pricingAttributes[0]?.name || "",
      units[0]?.name || "",
      regions[0]?.name || "",
      "AZN",
      "10.00",
      "Description here",
      "false",
    ];

    // Add attribute values if attr_* columns are included
    if (hasDuplicateProductNames() && attrKeys.length > 0) {
      attrKeys.forEach((key) => {
        const value = firstProduct?.attributes?.[key];
        exampleRow.push(value !== undefined && value !== null ? String(value) : "");
      });
    }

    const csvContent = [
      headers.join(","),
      exampleRow.map((v) => `"${v}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rate_plans_template.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadLookupValues = () => {
    // Create a CSV with all available lookup values for reference
    const sections = [];

    // Products section with attributes
    sections.push("# PRODUCTS");
    const attrKeys = getAllProductAttributeKeys();
    if (attrKeys.length > 0) {
      sections.push(`name,${attrKeys.map((k) => `attr_${k}`).join(",")}`);
      products.forEach((p) => {
        const attrValues = attrKeys.map((k) => {
          const val = p.attributes?.[k];
          return val !== undefined && val !== null ? `"${val}"` : '""';
        });
        sections.push(`"${p.name}",${attrValues.join(",")}`);
      });
    } else {
      sections.push("name");
      products.forEach((p) => sections.push(`"${p.name}"`));
    }
    sections.push("");

    sections.push("# METERS");
    sections.push("name");
    meters.forEach((m) => sections.push(`"${m.name}"`));
    sections.push("");

    sections.push("# PRICING ATTRIBUTES");
    sections.push("name");
    pricingAttributes.forEach((pa) => sections.push(`"${pa.name}"`));
    sections.push("");

    sections.push("# UNITS");
    sections.push("name,symbol");
    units.forEach((u) => sections.push(`"${u.name}","${u.symbol || ""}"`));
    sections.push("");

    sections.push("# REGIONS");
    sections.push("name");
    regions.forEach((r) => sections.push(`"${r.name}"`));

    // Add note about disambiguation
    sections.push("");
    sections.push("# NOTE: If multiple products have the same name, use attr_* columns to disambiguate.");
    sections.push("# The region_name column sets the region for the rate plan itself.");

    const csvContent = sections.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "rate_plans_lookup_values.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Filter template products by search term
  const filteredTemplateProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return templateProducts;
    const search = productSearchTerm.toLowerCase();
    return templateProducts.filter((p) =>
      p.name?.toLowerCase().includes(search) ||
      p.scope?.name?.toLowerCase().includes(search) ||
      p.service?.name?.toLowerCase().includes(search) ||
      p.region?.name?.toLowerCase().includes(search)
    );
  }, [templateProducts, productSearchTerm]);

  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.product?.name && row.product.name.toLowerCase().includes(search)) ||
      (row.meter?.name && row.meter.name.toLowerCase().includes(search)) ||
      (row.region?.name && row.region.name.toLowerCase().includes(search)) ||
      (row.currency && row.currency.toLowerCase().includes(search)) ||
      (row.description && row.description.toLowerCase().includes(search))
    );
  });

  const allColumns = useMemo(() => [
    {
      Header: "Product",
      accessor: "product",
      id: "product",
      width: "15%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.product_raw || "";
        const b = rowB.original.product_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Meter",
      accessor: "meter",
      id: "meter",
      width: "12%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.meter_raw || "";
        const b = rowB.original.meter_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Unit",
      accessor: "unit",
      id: "unit",
      width: "10%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.unit_raw || "";
        const b = rowB.original.unit_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Region",
      accessor: "region",
      id: "region",
      width: "12%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.region_raw || "";
        const b = rowB.original.region_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Currency",
      accessor: "currency",
      id: "currency",
      width: "8%",
      sortType: (rowA, rowB) => {
        const a = rowA.original.currency_raw || "";
        const b = rowB.original.currency_raw || "";
        return a.localeCompare(b);
      },
    },
    {
      Header: "Price",
      accessor: "price",
      id: "price",
      width: "10%",
      align: "right",
      sortType: (rowA, rowB) => {
        const a = rowA.original.price_raw || 0;
        const b = rowB.original.price_raw || 0;
        return a - b;
      },
    },
    {
      Header: "Default",
      accessor: "is_default",
      id: "is_default",
      width: "8%",
      align: "center",
    },
    {
      Header: "Description",
      accessor: "description",
      id: "description",
      width: "18%",
    },
    {
      Header: "Actions",
      accessor: "actions",
      id: "actions",
      width: "12%",
      align: "center",
      disableSortBy: true,
    },
  ], []);

  const orderedColumns = useMemo(() => {
    if (columnOrder.length === 0) return allColumns;

    const columnMap = new Map(allColumns.map((col) => [col.id, col]));
    const ordered = [];
    const usedIds = new Set();

    columnOrder.forEach((id) => {
      if (columnMap.has(id)) {
        ordered.push(columnMap.get(id));
        usedIds.add(id);
      }
    });

    allColumns.forEach((col) => {
      if (!usedIds.has(col.id)) ordered.push(col);
    });

    return ordered;
  }, [allColumns, columnOrder]);

  const columns = useMemo(() => {
    return orderedColumns.filter((col) => !hiddenColumns.includes(col.id));
  }, [orderedColumns, hiddenColumns]);

  // Helper function to format price display based on meter type
  const formatPriceDisplay = (row) => {
    if (row.price == null) return "-";
    // Check if meter is percentage type by looking up in meters state
    const meter = meters.find((m) => m.id === row.meter_id);
    const isPercentage = meter?.value_type?.name?.toLowerCase().includes("percent") || false;
    if (isPercentage) {
      // Convert decimal to percentage display (0.15 -> 15%)
      const percentValue = (row.price * 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      return `${percentValue}%`;
    }
    return row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const rows = filteredData.map((row) => ({
    id: row.id,
    product: (
      <MDTypography variant="button" fontWeight="medium">
        {row.product?.name || "-"}
      </MDTypography>
    ),
    product_raw: row.product?.name || "",
    meter: (
      <MDTypography variant="caption" color="text">
        {row.meter?.name || "-"}
      </MDTypography>
    ),
    meter_raw: row.meter?.name || "",
    unit: (
      <MDTypography variant="caption" color="text">
        {row.unit ? `${row.unit.name}${row.unit.symbol ? ` (${row.unit.symbol})` : ""}` : "-"}
      </MDTypography>
    ),
    unit_raw: row.unit?.name || "",
    region: (
      <Chip
        label={row.region?.name || "-"}
        size="small"
        color="secondary"
        variant="outlined"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    region_raw: row.region?.name || "",
    currency: (
      <Chip
        label={row.currency || "-"}
        size="small"
        color="info"
        variant="outlined"
        sx={{ fontSize: "0.7rem" }}
      />
    ),
    currency_raw: row.currency || "",
    price: (
      <MDTypography variant="button" fontWeight="medium" sx={{ textAlign: "right", display: "block" }}>
        {formatPriceDisplay(row)}
      </MDTypography>
    ),
    price_raw: row.price || 0,
    is_default: (
      <Icon sx={{ color: row.is_default ? "success.main" : "grey.400" }}>
        {row.is_default ? "check_circle" : "cancel"}
      </Icon>
    ),
    description: (
      <MDTypography
        variant="caption"
        color="text"
        sx={{
          display: "block",
          maxWidth: 150,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={row.description || ""}
      >
        {row.description || "-"}
      </MDTypography>
    ),
    actions: (
      <MDBox display="flex" justifyContent="center" gap={0.5}>
        <Tooltip title="Edit" placement="top">
          <IconButton
            size="small"
            onClick={() => handleEditClick(row)}
            sx={{
              color: "info.main",
              "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(26, 115, 232, 0.1)" },
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
              "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(76, 175, 80, 0.1)" },
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
              "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(244, 67, 54, 0.1)" },
            }}
          >
            <Icon fontSize="small">delete</Icon>
          </IconButton>
        </Tooltip>
      </MDBox>
    ),
  }));

  // Helper function to check if selected meter is percentage type
  const isPercentageMeter = (meterId) => {
    if (!meterId) return false;
    const meter = meters.find((m) => m.id === meterId);
    return meter?.value_type?.name?.toLowerCase().includes("percent") || false;
  };

  // Convert percentage for display (0.1 -> 10) and storage (10 -> 0.1)
  const displayPercentage = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    return (parseFloat(value) * 100).toString();
  };

  const storePercentage = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return parseFloat(value) / 100;
  };

  const renderFormFields = (formData, handleChange, isPercentage) => (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Autocomplete
            options={products}
            getOptionLabel={(option) => option?.name || ""}
            value={products.find((p) => p.id === formData.product_id) || null}
            onChange={(event, newValue) => {
              handleChange("product_id", newValue?.id || "");
            }}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                margin="normal"
                placeholder="Search products..."
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                {option.name}
              </Box>
            )}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Meter</InputLabel>
            <Select
              value={formData.meter_id || ""}
              onChange={(e) => handleChange("meter_id", e.target.value)}
              label="Meter"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {meters.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Unit</InputLabel>
            <Select
              value={formData.unit_id || ""}
              onChange={(e) => handleChange("unit_id", e.target.value)}
              label="Unit"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name}{u.symbol ? ` (${u.symbol})` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Region</InputLabel>
            <Select
              value={formData.region_id || ""}
              onChange={(e) => handleChange("region_id", e.target.value)}
              label="Region"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {regions.map((r) => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Pricing Attribute</InputLabel>
            <Select
              value={formData.pricing_attribute_id || ""}
              onChange={(e) => handleChange("pricing_attribute_id", e.target.value)}
              label="Pricing Attribute"
              sx={{ minHeight: 44 }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {pricingAttributes.map((pa) => (
                <MenuItem key={pa.id} value={pa.id}>{pa.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Currency"
            value={formData.currency || ""}
            onChange={(e) => handleChange("currency", e.target.value)}
            margin="normal"
            placeholder="e.g., USD, EUR, GBP"
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={isPercentage ? "Percentage" : "Price"}
            type="number"
            value={formData.price || ""}
            onChange={(e) => handleChange("price", e.target.value)}
            margin="normal"
            placeholder={isPercentage ? "e.g., 10 (for 10%)" : "e.g., 10.00"}
            inputProps={{ step: isPercentage ? "0.1" : "0.01", min: "0", max: isPercentage ? "100" : undefined }}
            helperText={isPercentage ? "Enter percentage value (e.g., 10 for 10%)" : ""}
          />
        </Grid>
        <Grid item xs={6}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_default || false}
                onChange={(e) => handleChange("is_default", e.target.checked)}
              />
            }
            label="Default Rate Plan"
            sx={{ mt: 2 }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </>
  );

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
                  Rate Plans
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <TextField
                        placeholder="Search rate plans..."
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
                    </MDBox>
                    <MDBox display="flex" alignItems="center" gap={1}>
                      <Tooltip title="Show/Hide Columns">
                        <IconButton size="small" onClick={handleColumnMenuOpen} sx={{ color: "text.secondary" }}>
                          <Icon>view_column</Icon>
                        </IconButton>
                      </Tooltip>
                      <MDButton variant="outlined" color="info" size="small" onClick={handleBulkUploadOpen}>
                        <Icon sx={{ mr: 1 }}>upload_file</Icon>
                        Bulk Upload
                      </MDButton>
                      <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
                        <Icon sx={{ mr: 1 }}>add</Icon>
                        Add Rate Plan
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
                        No rate plans found. Click &quot;Add Rate Plan&quot; to create one.
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
                      tableId="rate-plans-table"
                    />
                  )}
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this rate plan?
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Rate Plan</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {renderFormFields(editFormData, handleEditFormChange, isPercentageMeter(editFormData.meter_id))}
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleEditClose} color="secondary" disabled={saving}>
            Cancel
          </MDButton>
          <MDButton onClick={handleEditSave} color="info" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Rate Plan</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {renderFormFields(addFormData, handleAddFormChange, isPercentageMeter(addFormData.meter_id))}
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleAddClose} color="secondary" disabled={adding}>
            Cancel
          </MDButton>
          <MDButton onClick={handleAddSave} color="info" disabled={adding}>
            {adding ? "Adding..." : "Add"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Column Menu */}
      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
        PaperProps={{ sx: { maxHeight: 400, minWidth: 220 } }}
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
            <MenuItem key={col.id} onClick={() => toggleColumnVisibility(col.id)} dense sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Checkbox checked={!hiddenColumns.includes(col.id)} size="small" sx={{ p: 0 }} />
              </ListItemIcon>
              <ListItemText primary={col.Header} primaryTypographyProps={{ variant: "body2", fontSize: "0.875rem" }} />
            </MenuItem>
          ))}
      </Menu>

      {/* Product Search Modal */}
      <Dialog
        open={productSearchOpen}
        onClose={handleProductSearchClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { minHeight: "60vh" } }}
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center" justifyContent="space-between">
            <MDTypography variant="h6">Select Product for Rate Plan</MDTypography>
            {productSearchStep > 0 && (
              <Button
                startIcon={<Icon>arrow_back</Icon>}
                onClick={handleProductSearchBack}
                size="small"
              >
                Back
              </Button>
            )}
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {/* Stepper */}
          <Stepper activeStep={productSearchStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Select Template</StepLabel>
            </Step>
            <Step>
              <StepLabel>Select Product</StepLabel>
            </Step>
            <Step>
              <StepLabel>Review & Create</StepLabel>
            </Step>
          </Stepper>

          {/* Step 0: Select Template */}
          {productSearchStep === 0 && (
            <MDBox>
              <MDTypography variant="body2" color="text" mb={2}>
                Choose a product template to find products:
              </MDTypography>
              <Grid container spacing={2}>
                {templates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
                    <Card
                      sx={{
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <MDBox p={2}>
                        <MDBox display="flex" alignItems="center" gap={1} mb={1}>
                          <Icon color="info">inventory_2</Icon>
                          <MDTypography variant="subtitle2" fontWeight="medium">
                            {template.name}
                          </MDTypography>
                        </MDBox>
                        {template.description && (
                          <MDTypography variant="caption" color="text">
                            {template.description}
                          </MDTypography>
                        )}
                      </MDBox>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {templates.length === 0 && (
                <MDBox textAlign="center" py={5}>
                  <MDTypography variant="body2" color="text">
                    No product templates found.
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          )}

          {/* Step 1: Select Product */}
          {productSearchStep === 1 && (
            <MDBox>
              <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <MDTypography variant="body2" color="text">
                  Select a product from <strong>{selectedTemplate?.name}</strong>:
                </MDTypography>
                <TextField
                  size="small"
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  sx={{ width: 250 }}
                  InputProps={{
                    startAdornment: <Icon sx={{ color: "text.secondary", mr: 1 }}>search</Icon>,
                  }}
                />
              </MDBox>

              {loadingTemplateProducts ? (
                <MDBox display="flex" justifyContent="center" py={5}>
                  <CircularProgress color="info" />
                </MDBox>
              ) : filteredTemplateProducts.length === 0 ? (
                <MDBox textAlign="center" py={5}>
                  <MDTypography variant="body2" color="text">
                    {productSearchTerm
                      ? "No products match your search."
                      : "No products found for this template."}
                  </MDTypography>
                </MDBox>
              ) : (
                <DataTable
                  table={{
                    columns: [
                      {
                        Header: "",
                        accessor: "select",
                        id: "select",
                        width: "5%",
                        disableSortBy: true,
                      },
                      {
                        Header: "Name",
                        accessor: "name",
                        id: "name",
                        width: "30%",
                      },
                      {
                        Header: "Scope",
                        accessor: "scope",
                        id: "scope",
                        width: "20%",
                      },
                      {
                        Header: "Service",
                        accessor: "service",
                        id: "service",
                        width: "25%",
                      },
                      {
                        Header: "Region",
                        accessor: "region",
                        id: "region",
                        width: "20%",
                      },
                    ],
                    rows: filteredTemplateProducts.map((product) => ({
                      id: product.id,
                      select: (
                        <Radio
                          checked={selectedProduct?.id === product.id}
                          size="small"
                          onClick={() => handleProductSelect(product)}
                        />
                      ),
                      name: (
                        <MDTypography
                          variant="button"
                          fontWeight="medium"
                          sx={{ cursor: "pointer" }}
                          onClick={() => handleProductSelect(product)}
                        >
                          {product.name}
                        </MDTypography>
                      ),
                      scope: product.scope?.name ? (
                        <Chip
                          label={product.scope.name}
                          size="small"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ) : (
                        "-"
                      ),
                      service: product.service?.name ? (
                        <Chip
                          label={product.service.name}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ) : (
                        "-"
                      ),
                      region: product.region?.name ? (
                        <Chip
                          label={product.region.name}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ) : (
                        "-"
                      ),
                    })),
                  }}
                  isSorted={false}
                  entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                  showTotalEntries={true}
                  noEndBorder
                  canSearch={false}
                />
              )}
            </MDBox>
          )}

          {/* Step 2: Review & Create */}
          {productSearchStep === 2 && selectedProduct && (
            <MDBox>
              {/* Selected Product Info */}
              <Card sx={{ mb: 3, bgcolor: "grey.50" }}>
                <MDBox p={2}>
                  <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                    Selected Product
                  </MDTypography>
                  <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <MDTypography variant="h6">{selectedProduct.name}</MDTypography>
                    {selectedProduct.scope?.name && (
                      <Chip label={selectedProduct.scope.name} size="small" />
                    )}
                    {selectedProduct.service?.name && (
                      <Chip
                        label={selectedProduct.service.name}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                    {selectedProduct.region?.name && (
                      <Chip
                        label={selectedProduct.region.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </MDBox>
                </MDBox>
              </Card>

              {/* Existing Rate Plans */}
              {existingProductRatePlans.length > 0 && (
                <MDBox mb={3}>
                  <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                    Existing Rate Plans ({existingProductRatePlans.length})
                  </MDTypography>
                  <MDTypography variant="caption" color="text" mb={2} display="block">
                    This product already has rate plans. You can duplicate one or create a new one.
                  </MDTypography>
                  <DataTable
                    table={{
                      columns: [
                        {
                          Header: "Meter",
                          accessor: "meter",
                          id: "meter",
                          width: "18%",
                        },
                        {
                          Header: "Unit",
                          accessor: "unit",
                          id: "unit",
                          width: "15%",
                        },
                        {
                          Header: "Region",
                          accessor: "region",
                          id: "region",
                          width: "15%",
                        },
                        {
                          Header: "Currency",
                          accessor: "currency",
                          id: "currency",
                          width: "12%",
                        },
                        {
                          Header: "Price",
                          accessor: "price",
                          id: "price",
                          width: "12%",
                          align: "right",
                        },
                        {
                          Header: "Default",
                          accessor: "is_default",
                          id: "is_default",
                          width: "10%",
                          align: "center",
                        },
                        {
                          Header: "Action",
                          accessor: "action",
                          id: "action",
                          width: "10%",
                          align: "center",
                          disableSortBy: true,
                        },
                      ],
                      rows: existingProductRatePlans.map((rp) => ({
                        id: rp.id,
                        meter: (
                          <MDTypography variant="caption" color="text">
                            {rp.meter?.name || "-"}
                          </MDTypography>
                        ),
                        unit: (
                          <MDTypography variant="caption" color="text">
                            {rp.unit
                              ? `${rp.unit.name}${rp.unit.symbol ? ` (${rp.unit.symbol})` : ""}`
                              : "-"}
                          </MDTypography>
                        ),
                        region: rp.region?.name ? (
                          <Chip
                            label={rp.region.name}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ) : (
                          "-"
                        ),
                        currency: rp.currency ? (
                          <Chip
                            label={rp.currency}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ) : (
                          "-"
                        ),
                        price: (
                          <MDTypography variant="button" fontWeight="medium">
                            {formatPriceDisplay(rp)}
                          </MDTypography>
                        ),
                        is_default: (
                          <Icon
                            sx={{ color: rp.is_default ? "success.main" : "grey.400" }}
                          >
                            {rp.is_default ? "check_circle" : "cancel"}
                          </Icon>
                        ),
                        action: (
                          <Tooltip title="Duplicate this rate plan">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicateExistingRatePlan(rp)}
                              color="success"
                            >
                              <Icon fontSize="small">content_copy</Icon>
                            </IconButton>
                          </Tooltip>
                        ),
                      })),
                    }}
                    isSorted={false}
                    entriesPerPage={false}
                    showTotalEntries={false}
                    noEndBorder
                    canSearch={false}
                  />
                </MDBox>
              )}

              {existingProductRatePlans.length === 0 && (
                <MDBox mb={3} textAlign="center" py={2}>
                  <Icon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}>
                    price_change
                  </Icon>
                  <MDTypography variant="body2" color="text">
                    No existing rate plans for this product.
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleProductSearchClose} color="secondary">
            Cancel
          </MDButton>
          {productSearchStep === 2 && selectedProduct && (
            <MDButton onClick={handleCreateRatePlanFromSearch} color="info">
              <Icon sx={{ mr: 1 }}>add</Icon>
              Create New Rate Plan
            </MDButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Modal */}
      <Dialog
        open={bulkUploadOpen}
        onClose={handleBulkUploadClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { minHeight: "70vh" } }}
      >
        <DialogTitle>
          <MDBox display="flex" alignItems="center" justifyContent="space-between">
            <MDTypography variant="h6">Bulk Upload Rate Plans</MDTypography>
            {bulkUploadStep === 1 && (
              <Button
                startIcon={<Icon>arrow_back</Icon>}
                onClick={() => setBulkUploadStep(0)}
                size="small"
              >
                Back
              </Button>
            )}
          </MDBox>
        </DialogTitle>
        <DialogContent>
          {/* Stepper */}
          <Stepper activeStep={bulkUploadStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Upload CSV</StepLabel>
            </Step>
            <Step>
              <StepLabel>Preview & Validate</StepLabel>
            </Step>
            <Step>
              <StepLabel>Results</StepLabel>
            </Step>
          </Stepper>

          {/* Step 0: Upload CSV */}
          {bulkUploadStep === 0 && (
            <MDBox>
              <MDBox textAlign="center" py={4}>
                <Icon sx={{ fontSize: 64, color: "info.main", mb: 2 }}>cloud_upload</Icon>
                <MDTypography variant="h6" mb={1}>
                  Upload CSV File
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Upload a CSV file with rate plan data. Use names instead of IDs for lookups.
                </MDTypography>

                <input
                  accept=".csv"
                  style={{ display: "none" }}
                  id="csv-file-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="csv-file-upload">
                  <MDButton variant="gradient" color="info" component="span" size="large">
                    <Icon sx={{ mr: 1 }}>upload_file</Icon>
                    Select CSV File
                  </MDButton>
                </label>
              </MDBox>

              <MDBox mt={4} p={3} bgcolor="grey.100" borderRadius={2}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={2}>
                  CSV Format Requirements
                </MDTypography>
                <MDTypography variant="body2" color="text" component="div">
                  <p>Required columns (use exact header names):</p>
                  <code style={{ display: "block", padding: "12px", backgroundColor: "#fff", borderRadius: "4px", marginTop: "8px", marginBottom: "16px", fontSize: "12px" }}>
                    product_name, meter_name, pricing_attribute_name, unit_name, region_name, currency, price, description, is_default
                  </code>
                  <p><strong>Notes:</strong></p>
                  <ul style={{ marginLeft: "20px", marginTop: "8px" }}>
                    <li>Use exact names from the system (case-insensitive matching)</li>
                    <li>Leave fields empty if not applicable</li>
                    <li>For percentage meters, enter the percentage value (e.g., 15 for 15%)</li>
                    <li>is_default accepts: true, false, TRUE, FALSE, 1, 0</li>
                  </ul>
                  <p style={{ marginTop: "16px" }}><strong>Product Disambiguation:</strong></p>
                  <ul style={{ marginLeft: "20px", marginTop: "8px" }}>
                    <li>If multiple products have the same name, use <code>attr_&lt;attribute_key&gt;</code> columns to specify which one (e.g., <code>attr_vm_cluster</code>)</li>
                    <li>Download &quot;Lookup Values&quot; to see all products and their attribute values</li>
                    <li>The <code>region_name</code> column sets the region for the rate plan (not for product matching)</li>
                  </ul>
                </MDTypography>
              </MDBox>

              <MDBox mt={3} display="flex" gap={2} justifyContent="center">
                <MDButton variant="outlined" color="info" size="small" onClick={downloadCSVTemplate}>
                  <Icon sx={{ mr: 1 }}>download</Icon>
                  Download Template
                </MDButton>
                <MDButton variant="outlined" color="secondary" size="small" onClick={downloadLookupValues}>
                  <Icon sx={{ mr: 1 }}>list</Icon>
                  Download Lookup Values
                </MDButton>
              </MDBox>

              {csvErrors.length > 0 && (
                <MDBox mt={3} p={2} bgcolor="error.light" borderRadius={1}>
                  <MDTypography variant="subtitle2" color="error" fontWeight="medium">
                    CSV Parsing Errors:
                  </MDTypography>
                  {csvErrors.map((err, idx) => (
                    <MDTypography key={idx} variant="caption" color="error" display="block">
                      {err}
                    </MDTypography>
                  ))}
                </MDBox>
              )}
            </MDBox>
          )}

          {/* Step 1: Preview & Validate */}
          {bulkUploadStep === 1 && (
            <MDBox>
              <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <MDBox>
                  <MDTypography variant="body2" color="text">
                    <strong>{csvData.length}</strong> rows found.{" "}
                    <span style={{ color: "green" }}>{csvData.filter((r) => r.isValid).length} valid</span>,{" "}
                    <span style={{ color: "red" }}>{csvData.filter((r) => !r.isValid).length} with errors</span>
                    {csvData.filter((r) => r.isDuplicate || r.isDuplicateInCsv).length > 0 && (
                      <span style={{ color: "orange" }}>
                        {" "}({csvData.filter((r) => r.isDuplicate).length} duplicates in DB, {csvData.filter((r) => r.isDuplicateInCsv).length} duplicates in CSV)
                      </span>
                    )}
                  </MDTypography>
                </MDBox>
              </MDBox>

              <DataTable
                table={{
                  columns: [
                    { Header: "Row", accessor: "rowNum", id: "rowNum", width: "5%" },
                    { Header: "Status", accessor: "status", id: "status", width: "6%", align: "center" },
                    { Header: "Product", accessor: "product", id: "product", width: "14%" },
                    { Header: "Meter", accessor: "meter", id: "meter", width: "12%" },
                    { Header: "Pricing Attr", accessor: "pricingAttr", id: "pricingAttr", width: "12%" },
                    { Header: "Unit", accessor: "unit", id: "unit", width: "10%" },
                    { Header: "Region", accessor: "region", id: "region", width: "10%" },
                    { Header: "Currency", accessor: "currency", id: "currency", width: "8%" },
                    { Header: "Price", accessor: "price", id: "price", width: "8%", align: "right" },
                    { Header: "Default", accessor: "isDefault", id: "isDefault", width: "7%", align: "center" },
                    { Header: "Errors", accessor: "errors", id: "errors", width: "8%" },
                  ],
                  rows: csvData.map((row) => ({
                    rowNum: (
                      <MDTypography variant="caption" fontWeight="medium">
                        {row.rowIndex}
                      </MDTypography>
                    ),
                    status: (
                      <Icon sx={{ color: row.isValid ? "success.main" : "error.main" }}>
                        {row.isValid ? "check_circle" : "error"}
                      </Icon>
                    ),
                    product: row.product.name ? (
                      <Chip
                        label={row.product.name}
                        size="small"
                        color={row.product.found ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                    meter: row.meter.name ? (
                      <Chip
                        label={row.meter.name}
                        size="small"
                        color={row.meter.found ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                    pricingAttr: row.pricingAttribute.name ? (
                      <Chip
                        label={row.pricingAttribute.name}
                        size="small"
                        color={row.pricingAttribute.found ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                    unit: row.unit.name ? (
                      <Chip
                        label={row.unit.name}
                        size="small"
                        color={row.unit.found ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                    region: row.region.name ? (
                      <Chip
                        label={row.region.name}
                        size="small"
                        color={row.region.found ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                    currency: (
                      <Chip
                        label={row.currency}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    ),
                    price: (
                      <MDTypography variant="button" fontWeight="medium">
                        {row.priceDisplay || "-"}
                        {row.isPercentage && row.priceDisplay ? "%" : ""}
                      </MDTypography>
                    ),
                    isDefault: (
                      <Icon sx={{ color: row.isDefault ? "success.main" : "grey.400" }}>
                        {row.isDefault ? "check_circle" : "cancel"}
                      </Icon>
                    ),
                    errors: row.errors.length > 0 ? (
                      <Tooltip title={row.errors.join(", ")}>
                        <Chip
                          label={row.isDuplicate || row.isDuplicateInCsv ? "Duplicate" : `${row.errors.length} error(s)`}
                          size="small"
                          color={row.isDuplicate || row.isDuplicateInCsv ? "warning" : "error"}
                          sx={{ fontSize: "0.65rem", cursor: "help" }}
                        />
                      </Tooltip>
                    ) : (
                      <MDTypography variant="caption" color="text">-</MDTypography>
                    ),
                  })),
                }}
                isSorted={false}
                entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
                showTotalEntries={true}
                noEndBorder
                canSearch={false}
              />

              {csvData.filter((r) => !r.isValid).length > 0 && (
                <MDBox mt={2} p={2} bgcolor="warning.light" borderRadius={1}>
                  <MDTypography variant="body2" color="warning">
                    <Icon sx={{ verticalAlign: "middle", mr: 1 }}>warning</Icon>
                    Rows with errors will be skipped during import. Only {csvData.filter((r) => r.isValid).length} valid rows will be imported.
                  </MDTypography>
                </MDBox>
              )}

              {/* Enhanced Error Summary Section */}
              {csvData.filter((r) => !r.isValid).length > 0 && (
                <MDBox mt={3} p={2} bgcolor="grey.100" borderRadius={2}>
                  <MDTypography variant="h6" mb={2} sx={{ display: "flex", alignItems: "center" }}>
                    <Icon sx={{ mr: 1, color: "info.main" }}>help_outline</Icon>
                    Error Details & Hints
                  </MDTypography>

                  {/* Group errors by type */}
                  {(() => {
                    const errorRows = csvData.filter((r) => !r.isValid);
                    const productNotFound = errorRows.filter((r) => !r.product.found && r.product.name && r.product.matchType === "not_found");
                    const meterNotFound = errorRows.filter((r) => !r.meter.found && r.meter.name);
                    const pricingAttrNotFound = errorRows.filter((r) => !r.pricingAttribute.found && r.pricingAttribute.name);
                    const unitNotFound = errorRows.filter((r) => !r.unit.found && r.unit.name);
                    const regionNotFound = errorRows.filter((r) => !r.region.found && r.region.name);
                    const duplicates = errorRows.filter((r) => r.isDuplicate || r.isDuplicateInCsv);
                    const ambiguousProducts = errorRows.filter((r) => r.product.matchType === "ambiguous");
                    const attrValueMismatches = errorRows.filter((r) =>
                      (r.product.matchType === "no_match" || r.product.matchType === "attr_mismatch_unique") &&
                      r.product.attrMismatches?.length > 0
                    );

                    return (
                      <MDBox>
                        {/* Product Not Found Errors */}
                        {productNotFound.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Product Not Found ({productNotFound.length} row{productNotFound.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {productNotFound.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Products: {[...new Set(productNotFound.map((r) => r.product.name))].join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Check that product names match exactly (case-sensitive). Download the lookup values file to see valid product names.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Ambiguous Product Errors */}
                        {ambiguousProducts.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="warning.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="warning" mb={0.5}>
                              Ambiguous Product Name ({ambiguousProducts.length} row{ambiguousProducts.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {ambiguousProducts.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Multiple products share this name. Add attr_* columns (e.g., attr_vm_cluster, attr_core) to disambiguate. Use attribute_key values from attribute_definitions table.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Attribute Value Mismatch Errors */}
                        {attrValueMismatches.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Attribute Value Mismatch ({attrValueMismatches.length} row{attrValueMismatches.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {attrValueMismatches.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Products: {[...new Set(attrValueMismatches.map((r) => r.product.name))].join(", ")}
                            </MDTypography>
                            {/* Show detailed mismatches */}
                            <MDBox mb={1}>
                              {(() => {
                                // Aggregate all mismatches across rows
                                const allMismatches = {};
                                attrValueMismatches.forEach((r) => {
                                  (r.product.attrMismatches || []).forEach((m) => {
                                    const key = `${m.attrKey}:${m.csvValue}`;
                                    if (!allMismatches[key]) {
                                      allMismatches[key] = {
                                        attrKey: m.attrKey,
                                        csvValue: m.csvValue,
                                        availableValues: new Set(m.availableValues),
                                      };
                                    } else {
                                      m.availableValues.forEach((v) => allMismatches[key].availableValues.add(v));
                                    }
                                  });
                                });
                                return Object.values(allMismatches).map((m, idx) => (
                                  <MDTypography key={idx} variant="caption" color="text" display="block" sx={{ ml: 1 }}>
                                    • <strong>attr_{m.attrKey}</strong>: CSV value "<strong>{m.csvValue}</strong>" not found.
                                    Available: {[...m.availableValues].join(", ")}
                                  </MDTypography>
                                ));
                              })()}
                            </MDBox>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: The attr_* column values in your CSV don&apos;t match any product&apos;s attribute values. Check spelling and case sensitivity. Values are matched exactly.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Meter Not Found Errors */}
                        {meterNotFound.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Meter Not Found ({meterNotFound.length} row{meterNotFound.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {meterNotFound.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Meters: {[...new Set(meterNotFound.map((r) => r.meter.name))].join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Check meter names match exactly. Go to Pricing &gt; Meters to see valid meter names.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Pricing Attribute Not Found Errors */}
                        {pricingAttrNotFound.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Pricing Attribute Not Found ({pricingAttrNotFound.length} row{pricingAttrNotFound.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {pricingAttrNotFound.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Pricing Attributes: {[...new Set(pricingAttrNotFound.map((r) => r.pricingAttribute.name))].join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Check pricing attribute names match exactly. Go to Pricing &gt; Pricing Attributes to see valid values.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Unit Not Found Errors */}
                        {unitNotFound.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Unit Not Found ({unitNotFound.length} row{unitNotFound.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {unitNotFound.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Units: {[...new Set(unitNotFound.map((r) => r.unit.name))].join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Check unit names match exactly. Go to Pricing &gt; Units to see valid unit names.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Region Not Found Errors */}
                        {regionNotFound.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="error.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="error" mb={0.5}>
                              Region Not Found ({regionNotFound.length} row{regionNotFound.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {regionNotFound.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Regions: {[...new Set(regionNotFound.map((r) => r.region.name))].join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: Check region names match exactly. Download lookup values to see valid region names.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}

                        {/* Duplicate Errors */}
                        {duplicates.length > 0 && (
                          <MDBox mb={2} p={1.5} bgcolor="warning.light" borderRadius={1}>
                            <MDTypography variant="subtitle2" fontWeight="bold" color="warning" mb={0.5}>
                              Duplicates Found ({duplicates.length} row{duplicates.length > 1 ? "s" : ""})
                            </MDTypography>
                            <MDTypography variant="caption" color="text" display="block" mb={1}>
                              Rows: {duplicates.map((r) => r.rowIndex).join(", ")}
                            </MDTypography>
                            <MDBox p={1} bgcolor="white" borderRadius={1}>
                              <MDTypography variant="caption" color="info" fontWeight="medium">
                                <Icon sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}>lightbulb</Icon>
                                Hint: A rate plan with the same Product + Meter + Pricing Attribute + Unit + Region combination already exists in the database or appears earlier in your CSV file.
                              </MDTypography>
                            </MDBox>
                          </MDBox>
                        )}
                      </MDBox>
                    );
                  })()}
                </MDBox>
              )}
            </MDBox>
          )}

          {/* Step 2: Results */}
          {bulkUploadStep === 2 && (
            <MDBox textAlign="center" py={4}>
              <Icon
                sx={{
                  fontSize: 64,
                  color: bulkUploadResults.failed === 0 ? "success.main" : "warning.main",
                  mb: 2,
                }}
              >
                {bulkUploadResults.failed === 0 ? "check_circle" : "warning"}
              </Icon>
              <MDTypography variant="h5" mb={2}>
                Import Complete
              </MDTypography>
              <MDBox display="flex" justifyContent="center" gap={4} mb={3}>
                <MDBox textAlign="center">
                  <MDTypography variant="h3" color="success">
                    {bulkUploadResults.success}
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    Successfully imported
                  </MDTypography>
                </MDBox>
                <MDBox textAlign="center">
                  <MDTypography variant="h3" color="error">
                    {bulkUploadResults.failed}
                  </MDTypography>
                  <MDTypography variant="body2" color="text">
                    Failed
                  </MDTypography>
                </MDBox>
              </MDBox>

              {bulkUploadResults.errors.length > 0 && (
                <MDBox mt={3} p={2} bgcolor="error.light" borderRadius={1} textAlign="left">
                  <MDTypography variant="subtitle2" color="error" fontWeight="medium" mb={1}>
                    Errors:
                  </MDTypography>
                  {bulkUploadResults.errors.map((err, idx) => (
                    <MDTypography key={idx} variant="caption" color="error" display="block">
                      {err}
                    </MDTypography>
                  ))}
                </MDBox>
              )}
            </MDBox>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleBulkUploadClose} color="secondary">
            {bulkUploadStep === 2 ? "Close" : "Cancel"}
          </MDButton>
          {bulkUploadStep === 1 && csvData.filter((r) => r.isValid).length > 0 && (
            <MDButton
              onClick={handleBulkUploadConfirm}
              color="info"
              disabled={bulkUploading}
            >
              {bulkUploading ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                  Importing...
                </>
              ) : (
                <>
                  <Icon sx={{ mr: 1 }}>check</Icon>
                  Import {csvData.filter((r) => r.isValid).length} Rate Plans
                </>
              )}
            </MDButton>
          )}
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default RatePlans;
