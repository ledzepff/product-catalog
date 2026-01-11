/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";

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
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

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
  const [searchTerm, setSearchTerm] = useState("");

  // Lookup data
  const [products, setProducts] = useState([]);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editBundleItems, setEditBundleItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editFormTouched, setEditFormTouched] = useState({});

  // Add modal state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    description: "",
    tags: [],
    is_active: true,
  });
  const [addBundleItems, setAddBundleItems] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addFormTouched, setAddFormTouched] = useState({});

  // View bundle items modal
  const [viewItemsOpen, setViewItemsOpen] = useState(false);
  const [viewingBundle, setViewingBundle] = useState(null);
  const [bundleItems, setBundleItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  // Column order state
  const [columnOrder, setColumnOrder] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Tag input state
  const [tagInput, setTagInput] = useState("");

  // localStorage keys
  const COLUMN_ORDER_KEY = "bundles-column-order";
  const HIDDEN_COLUMNS_KEY = "bundles-hidden-columns";

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase
        .from("product_bundles")
        .select(`
          *,
          product_bundle_items(
            id,
            product_id,
            rate_plan_id,
            is_required,
            quantity_default,
            sort_order,
            product:products(id, name),
            rate_plan:rate_plans(
              id,
              product_id,
              meter:meters(id, name),
              unit:units(id, name, symbol),
              region:region(id, name),
              currency,
              price
            )
          )
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

  async function fetchProducts() {
    try {
      // Fetch products with their rate plans (for bundle selection)
      const { data: productsWithRatePlans, error: productsError } = await supabase
        .from("products")
        .select(`
          id,
          name,
          rate_plans!inner(
            id,
            product_id,
            meter:meters(id, name),
            unit:units(id, name, symbol),
            region:region(id, name),
            currency,
            price
          )
        `)
        .eq("is_active", true)
        .is("deleted_at", null)
        .is("rate_plans.deleted_at", null)
        .order("name");

      if (productsError) throw productsError;

      // Group rate plans by product
      const productMap = new Map();
      (productsWithRatePlans || []).forEach((p) => {
        if (!productMap.has(p.id)) {
          productMap.set(p.id, {
            id: p.id,
            name: p.name,
            rate_plans: [],
          });
        }
        // Add rate plans (avoid duplicates)
        const existingRatePlanIds = new Set(productMap.get(p.id).rate_plans.map((rp) => rp.id));
        (p.rate_plans || []).forEach((rp) => {
          if (!existingRatePlanIds.has(rp.id)) {
            productMap.get(p.id).rate_plans.push(rp);
          }
        });
      });

      setProducts(Array.from(productMap.values()));
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }

  useEffect(() => {
    fetchData();
    fetchProducts();
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
        .from("product_bundles")
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

  // View bundle items
  const handleViewItems = async (bundle) => {
    setViewingBundle(bundle);
    setBundleItems(bundle.product_bundle_items || []);
    setViewItemsOpen(true);
  };

  const handleCloseViewItems = () => {
    setViewItemsOpen(false);
    setViewingBundle(null);
    setBundleItems([]);
  };

  // Edit handlers
  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditFormData({
      name: row.name || "",
      description: row.description || "",
      tags: row.tags || [],
      is_active: row.is_active !== false,
    });

    // Map each bundle item individually (one row per rate plan)
    const bundleItemsList = (row.product_bundle_items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product?.name || "",
      rate_plan_id: item.rate_plan_id,
      rate_plan: item.rate_plan,
      is_required: item.is_required !== false,
      quantity_default: item.quantity_default || 1,
      sort_order: item.sort_order || "",
    }));

    setEditBundleItems(bundleItemsList);
    setEditFormTouched({});
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
    setEditBundleItems([]);
    setEditFormTouched({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);

      // Update bundle
      const updateData = {
        name: editFormData.name,
        description: editFormData.description || null,
        tags: editFormData.tags.length > 0 ? editFormData.tags : null,
        is_active: editFormData.is_active,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("product_bundles")
        .update(updateData)
        .eq("id", editingRow.id);

      if (updateError) throw updateError;

      // Delete existing bundle items
      const { error: deleteItemsError } = await supabase
        .from("product_bundle_items")
        .delete()
        .eq("bundle_id", editingRow.id);

      if (deleteItemsError) throw deleteItemsError;

      // Insert new bundle items - each item is already one rate plan
      const itemsToInsert = editBundleItems
        .filter((item) => item.rate_plan_id) // Only items with a rate plan selected
        .map((item) => ({
          bundle_id: editingRow.id,
          product_id: item.product_id,
          rate_plan_id: item.rate_plan_id,
          is_required: item.is_required,
          quantity_default: item.quantity_default || 1,
          sort_order: item.sort_order || null,
        }));

      if (itemsToInsert.length > 0) {
        const { error: insertItemsError } = await supabase
          .from("product_bundle_items")
          .insert(itemsToInsert);

        if (insertItemsError) throw insertItemsError;
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
    setAddFormData({ name: "", description: "", tags: [], is_active: true });
    setAddBundleItems([]);
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleDuplicateClick = (row) => {
    setAddFormData({
      name: `${row.name || ""} (Copy)`,
      description: row.description || "",
      tags: row.tags || [],
      is_active: true,
    });

    // Map each bundle item individually (one row per rate plan)
    const bundleItemsList = (row.product_bundle_items || []).map((item) => ({
      product_id: item.product_id,
      product_name: item.product?.name || "",
      rate_plan_id: item.rate_plan_id,
      rate_plan: item.rate_plan,
      is_required: item.is_required !== false,
      quantity_default: item.quantity_default || 1,
      sort_order: item.sort_order || "",
    }));

    setAddBundleItems(bundleItemsList);
    setAddFormTouched({});
    setAddDialogOpen(true);
  };

  const handleAddClose = () => {
    setAddDialogOpen(false);
    setAddFormData({ name: "", description: "", tags: [], is_active: true });
    setAddBundleItems([]);
    setAddFormTouched({});
    setTagInput("");
  };

  const handleAddFormChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSave = async () => {
    try {
      setAdding(true);

      // Insert bundle
      const insertData = {
        name: addFormData.name,
        description: addFormData.description || null,
        tags: addFormData.tags.length > 0 ? addFormData.tags : null,
        is_active: addFormData.is_active,
        created_at: new Date().toISOString(),
      };

      const { data: newBundle, error: insertError } = await supabase
        .from("product_bundles")
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert bundle items - each item is already one rate plan
      const itemsToInsert = addBundleItems
        .filter((item) => item.rate_plan_id) // Only items with a rate plan selected
        .map((item) => ({
          bundle_id: newBundle.id,
          product_id: item.product_id,
          rate_plan_id: item.rate_plan_id,
          is_required: item.is_required,
          quantity_default: item.quantity_default || 1,
          sort_order: item.sort_order || null,
        }));

      if (itemsToInsert.length > 0) {
        const { error: insertItemsError } = await supabase
          .from("product_bundle_items")
          .insert(itemsToInsert);

        if (insertItemsError) throw insertItemsError;
      }

      await fetchData();
      handleAddClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  // Bundle items management - each item is a single rate plan
  const handleAddRatePlansFromProduct = (product, items, setItems) => {
    // Add all rate plans from the selected product as individual items
    const newItems = (product.rate_plans || []).map((rp) => ({
      product_id: product.id,
      product_name: product.name,
      rate_plan_id: rp.id,
      rate_plan: rp,
      is_required: true,
      quantity_default: 1,
      sort_order: "",
    }));
    setItems([...items, ...newItems]);
  };

  const handleRemoveBundleItem = (index, items, setItems) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleBundleItemChange = (index, field, value, items, setItems) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRatePlanSelect = (index, ratePlan, product, items, setItems) => {
    if (ratePlan) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: product.id,
        product_name: product.name,
        rate_plan_id: ratePlan.id,
        rate_plan: ratePlan,
      };
      setItems(newItems);
    }
  };

  // Helper to format rate plan display
  const formatRatePlanLabel = (rp) => {
    const parts = [];
    if (rp.meter?.name) parts.push(rp.meter.name);
    if (rp.unit?.name) parts.push(`${rp.unit.name}${rp.unit.symbol ? ` (${rp.unit.symbol})` : ""}`);
    if (rp.region?.name) parts.push(rp.region.name);
    if (rp.currency) parts.push(rp.currency);
    if (rp.price != null) parts.push(rp.price.toFixed(3));
    return parts.join(" | ") || `Rate Plan ${rp.id}`;
  };

  // Validation
  const validateName = (name) => {
    if (!name || name.trim().length === 0) return "Name is required";
    return "";
  };

  const isAddFormValid = () => !validateName(addFormData.name);
  const isEditFormValid = () => !validateName(editFormData.name);

  // Filter data
  const filteredData = data.filter((row) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (row.name && row.name.toLowerCase().includes(search)) ||
      (row.description && row.description.toLowerCase().includes(search)) ||
      (row.tags && row.tags.some((tag) => tag.toLowerCase().includes(search)))
    );
  });

  // Define columns
  const allColumns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        id: "name",
        width: "20%",
        sortType: (rowA, rowB) => {
          const a = rowA.original.name_raw || "";
          const b = rowB.original.name_raw || "";
          return a.localeCompare(b);
        },
      },
      {
        Header: "Description",
        accessor: "description",
        id: "description",
        width: "25%",
      },
      {
        Header: "Rate Plans",
        accessor: "products_count",
        id: "products_count",
        width: "10%",
        align: "center",
      },
      {
        Header: "Tags",
        accessor: "tags",
        id: "tags",
        width: "20%",
      },
      {
        Header: "Status",
        accessor: "status",
        id: "status",
        width: "10%",
        align: "center",
      },
      {
        Header: "Actions",
        accessor: "actions",
        id: "actions",
        width: "15%",
        align: "center",
        disableSortBy: true,
      },
    ],
    []
  );

  // Get ordered columns
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

  // Get visible columns
  const columns = useMemo(() => {
    return orderedColumns.filter((col) => !hiddenColumns.includes(col.id));
  }, [orderedColumns, hiddenColumns]);

  // Transform data to rows
  const rows = filteredData.map((row) => ({
    id: row.id,
    name: (
      <MDTypography variant="button" fontWeight="medium">
        {row.name || "-"}
      </MDTypography>
    ),
    name_raw: row.name || "",
    description: (
      <MDTypography variant="caption" color="text">
        {row.description ? (row.description.length > 50 ? `${row.description.substring(0, 50)}...` : row.description) : "-"}
      </MDTypography>
    ),
    products_count: (
      <Tooltip title="View Rate Plans" placement="top">
        <Chip
          label={row.product_bundle_items?.length || 0}
          size="small"
          color="info"
          variant="outlined"
          onClick={() => handleViewItems(row)}
          sx={{ cursor: "pointer" }}
        />
      </Tooltip>
    ),
    tags: (
      <MDBox display="flex" flexWrap="wrap" gap={0.5}>
        {row.tags && row.tags.length > 0 ? (
          row.tags.slice(0, 3).map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
          ))
        ) : (
          <MDTypography variant="caption" color="text">
            -
          </MDTypography>
        )}
        {row.tags && row.tags.length > 3 && (
          <Chip label={`+${row.tags.length - 3}`} size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} />
        )}
      </MDBox>
    ),
    status: (
      <Chip
        label={row.is_active ? "Active" : "Inactive"}
        size="small"
        color={row.is_active ? "success" : "default"}
        variant="outlined"
      />
    ),
    actions: (
      <MDBox display="flex" justifyContent="center" gap={0.5}>
        <Tooltip title="View Products" placement="top">
          <IconButton
            size="small"
            onClick={() => handleViewItems(row)}
            sx={{
              color: "secondary.main",
              "&:hover": { transform: "scale(1.2)", backgroundColor: "rgba(156, 39, 176, 0.1)" },
            }}
          >
            <Icon fontSize="small">visibility</Icon>
          </IconButton>
        </Tooltip>
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

  // Bundle items form component - each row is a single rate plan with its own settings
  const BundleItemsForm = ({ items, setItems, products }) => {
    const [selectedProductForAdd, setSelectedProductForAdd] = React.useState(null);

    // Group items by product for display
    const groupedItems = React.useMemo(() => {
      const groups = new Map();
      items.forEach((item, index) => {
        const key = item.product_id || `empty-${index}`;
        if (!groups.has(key)) {
          groups.set(key, {
            product_id: item.product_id,
            product_name: item.product_name,
            items: [],
          });
        }
        groups.get(key).items.push({ ...item, originalIndex: index });
      });
      return Array.from(groups.values());
    }, [items]);

    // Get products that haven't been added yet
    const availableProducts = products.filter(
      (p) => !items.some((item) => item.product_id === p.id)
    );

    return (
      <MDBox mt={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h6">Bundle Rate Plans</MDTypography>
        </MDBox>

        {/* Add Product Dropdown */}
        <MDBox display="flex" gap={2} mb={2} alignItems="center">
          <Autocomplete
            options={availableProducts}
            getOptionLabel={(option) => option.name || ""}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase();
              return options.filter((option) =>
                option.name?.toLowerCase().includes(searchTerm)
              );
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.name} <span style={{ color: "#888", marginLeft: 8 }}>({option.rate_plans?.length || 0} rate plans)</span>
              </li>
            )}
            value={selectedProductForAdd}
            onChange={(_, newValue) => setSelectedProductForAdd(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Product to Add" placeholder="Choose a product..." variant="outlined" />
            )}
            sx={{
              minWidth: 300,
              '& .MuiInputBase-root': {
                height: 56
              }
            }}
          />
          <MDButton
            variant="outlined"
            color="info"
            size="small"
            disabled={!selectedProductForAdd}
            onClick={() => {
              if (selectedProductForAdd) {
                handleAddRatePlansFromProduct(selectedProductForAdd, items, setItems);
                setSelectedProductForAdd(null);
              }
            }}
          >
            <Icon sx={{ mr: 0.5 }}>add</Icon>
            Add All Rate Plans
          </MDButton>
        </MDBox>

        {items.length === 0 ? (
          <MDTypography variant="caption" color="text">
            No rate plans added yet. Select a product above to add its rate plans to this bundle.
          </MDTypography>
        ) : (
          <Paper variant="outlined">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, width: 100, borderBottom: "1px solid #e0e0e0" }}>Product</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid #e0e0e0" }}>Rate Plan</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: 70, borderBottom: "1px solid #e0e0e0" }}>Sort</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: 70, borderBottom: "1px solid #e0e0e0" }}>Qty</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: 80, borderBottom: "1px solid #e0e0e0" }}>Required</th>
                  <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600, width: 60, borderBottom: "1px solid #e0e0e0" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedItems.map((group) =>
                  group.items.map((item, groupIndex) => {
                    const rp = item.rate_plan;
                    const ratePlanLabel = rp
                      ? [
                          rp.region?.name,
                          rp.unit?.symbol || rp.unit?.name,
                          rp.currency,
                          rp.price?.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : "No rate plan";

                    return (
                      <tr
                        key={item.originalIndex}
                        style={{
                          borderTop: groupIndex === 0 ? "2px solid #e0e0e0" : "none",
                        }}
                      >
                        <td style={{ padding: "8px 16px", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          {groupIndex === 0 ? (
                            <MDTypography variant="button" fontWeight="medium">
                              {item.product_name || "-"}
                            </MDTypography>
                          ) : null}
                        </td>

                        <td style={{ padding: "8px 16px", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          <MDTypography variant="caption">
                            {ratePlanLabel}
                          </MDTypography>
                        </td>

                        <td style={{ padding: "4px 8px", textAlign: "center", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          <TextField
                            type="number"
                            size="small"
                            value={item.sort_order}
                            onChange={(e) =>
                              handleBundleItemChange(item.originalIndex, "sort_order", e.target.value, items, setItems)
                            }
                            placeholder="-"
                            sx={{ width: 55 }}
                            inputProps={{ style: { textAlign: "center", padding: "4px 6px" } }}
                          />
                        </td>

                        <td style={{ padding: "4px 8px", textAlign: "center", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity_default}
                            onChange={(e) =>
                              handleBundleItemChange(
                                item.originalIndex,
                                "quantity_default",
                                parseInt(e.target.value) || 1,
                                items,
                                setItems
                              )
                            }
                            inputProps={{ min: 1, style: { textAlign: "center", padding: "4px 6px" } }}
                            sx={{ width: 55 }}
                          />
                        </td>

                        <td style={{ padding: "4px 8px", textAlign: "center", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          <Checkbox
                            checked={item.is_required}
                            onChange={(e) =>
                              handleBundleItemChange(item.originalIndex, "is_required", e.target.checked, items, setItems)
                            }
                            size="small"
                          />
                        </td>

                        <td style={{ padding: "4px 8px", textAlign: "center", verticalAlign: "middle", borderBottom: "1px solid #f0f0f0" }}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveBundleItem(item.originalIndex, items, setItems)}
                          >
                            <Icon fontSize="small">close</Icon>
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Paper>
        )}
      </MDBox>
    );
  };

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
                  Product Bundles
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <MDBox px={3} pb={2}>
                  <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <MDBox display="flex" alignItems="center" gap={2}>
                      <TextField
                        placeholder="Search bundles..."
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
                      <MDButton variant="gradient" color="info" size="small" onClick={handleAddClick}>
                        <Icon sx={{ mr: 1 }}>add</Icon>
                        Add Bundle
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
                        No bundles found. Click &quot;Add Bundle&quot; to create one.
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
                      tableId="bundles-table"
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
            Are you sure you want to delete &quot;{rowToDelete?.name}&quot;? This will also remove all
            product associations.
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

      {/* View Bundle Items Dialog */}
      <Dialog open={viewItemsOpen} onClose={handleCloseViewItems} maxWidth="md" fullWidth>
        <DialogTitle>
          Bundle Rate Plans: {viewingBundle?.name}
        </DialogTitle>
        <DialogContent>
          {bundleItems.length === 0 ? (
            <MDTypography variant="body2" color="text" py={2}>
              No rate plans in this bundle.
            </MDTypography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
              <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "20%" }}>Product</TableCell>
                    <TableCell sx={{ width: "35%" }}>Rate Plan</TableCell>
                    <TableCell align="center" sx={{ width: "15%" }}>Required</TableCell>
                    <TableCell align="center" sx={{ width: "15%" }}>Default Qty</TableCell>
                    <TableCell sx={{ width: "15%" }}>Sort Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bundleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <MDTypography variant="button" fontWeight="medium" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                          {item.product?.name || "-"}
                        </MDTypography>
                      </TableCell>
                      <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <MDTypography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                          {item.rate_plan ? formatRatePlanLabel(item.rate_plan) : "-"}
                        </MDTypography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.is_required ? "Required" : "Optional"}
                          size="small"
                          color={item.is_required ? "primary" : "default"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">{item.quantity_default || 1}</TableCell>
                      <TableCell>{item.sort_order || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseViewItems} color="info">
            Close
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Bundle</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={editFormData.name || ""}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  onBlur={() => setEditFormTouched((prev) => ({ ...prev, name: true }))}
                  error={editFormTouched.name && !!validateName(editFormData.name)}
                  helperText={editFormTouched.name && validateName(editFormData.name)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editFormData.is_active}
                      onChange={(e) => handleEditFormChange("is_active", e.target.checked)}
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editFormData.description || ""}
                  onChange={(e) => handleEditFormChange("description", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  label="Tags"
                  placeholder="Type and press Enter to add..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tags = editFormData.tags || [];
                      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setEditFormData({
                          ...editFormData,
                          tags: [...tags, tagInput.trim()],
                        });
                        setTagInput("");
                      }
                    }
                  }}
                  fullWidth
                />
                {(editFormData.tags || []).length > 0 && (
                  <MDBox display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {(editFormData.tags || []).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        onDelete={() =>
                          setEditFormData({
                            ...editFormData,
                            tags: (editFormData.tags || []).filter((t) => t !== tag),
                          })
                        }
                      />
                    ))}
                  </MDBox>
                )}
              </Grid>
            </Grid>

            <BundleItemsForm items={editBundleItems} setItems={setEditBundleItems} products={products} />
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

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={handleAddClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Bundle</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Name *"
                  value={addFormData.name}
                  onChange={(e) => handleAddFormChange("name", e.target.value)}
                  onBlur={() => setAddFormTouched((prev) => ({ ...prev, name: true }))}
                  error={addFormTouched.name && !!validateName(addFormData.name)}
                  helperText={addFormTouched.name && validateName(addFormData.name)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={addFormData.is_active}
                      onChange={(e) => handleAddFormChange("is_active", e.target.checked)}
                    />
                  }
                  label="Active"
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={addFormData.description}
                  onChange={(e) => handleAddFormChange("description", e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  label="Tags"
                  placeholder="Type and press Enter to add..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tags = addFormData.tags || [];
                      if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                        setAddFormData({
                          ...addFormData,
                          tags: [...tags, tagInput.trim()],
                        });
                        setTagInput("");
                      }
                    }
                  }}
                  fullWidth
                />
                {(addFormData.tags || []).length > 0 && (
                  <MDBox display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {(addFormData.tags || []).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        onDelete={() =>
                          setAddFormData({
                            ...addFormData,
                            tags: (addFormData.tags || []).filter((t) => t !== tag),
                          })
                        }
                      />
                    ))}
                  </MDBox>
                )}
              </Grid>
            </Grid>

            <BundleItemsForm items={addBundleItems} setItems={setAddBundleItems} products={products} />
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
    </DashboardLayout>
  );
}

export default Bundles;
