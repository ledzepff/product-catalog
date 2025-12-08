import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";

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

function Tables2() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: tableData, error: fetchError } = await supabase.from("test_table").select("*");

      if (fetchError) {
        throw fetchError;
      }

      if (tableData && tableData.length > 0) {
        setColumns(Object.keys(tableData[0]));
        setData(tableData);
      } else {
        setData([]);
        setColumns([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Delete handlers
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
      const { error: deleteError } = await supabase
        .from("test_table")
        .delete()
        .eq("id", rowToDelete.id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh data after deletion
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
    setEditFormData({ ...row });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditingRow(null);
    setEditFormData({});
  };

  const handleEditFormChange = (column, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleEditSave = async () => {
    if (!editingRow) return;

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from("test_table")
        .update(editFormData)
        .eq("id", editingRow.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh data after update
      await fetchData();
      handleEditClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Get editable columns (exclude 'id' and system columns)
  const getEditableColumns = () => {
    return columns.filter((col) => col !== "id" && col !== "created_at" && col !== "updated_at");
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
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Test Table Data
                </MDTypography>
              </MDBox>
              <MDBox pt={3} pb={3} px={3}>
                {loading ? (
                  <MDBox display="flex" justifyContent="center" py={3}>
                    <CircularProgress color="info" />
                  </MDBox>
                ) : error ? (
                  <MDTypography variant="body2" color="error">
                    Error: {error}
                  </MDTypography>
                ) : data.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No data found in test_table.
                  </MDTypography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {columns.map((column) => (
                            <TableCell key={column}>
                              <MDTypography variant="caption" fontWeight="bold" color="text">
                                {column.toUpperCase()}
                              </MDTypography>
                            </TableCell>
                          ))}
                          <TableCell>
                            <MDTypography variant="caption" fontWeight="bold" color="text">
                              ACTIONS
                            </MDTypography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column) => (
                              <TableCell key={column}>
                                <MDTypography variant="body2" color="text">
                                  {row[column] !== null ? String(row[column]) : "-"}
                                </MDTypography>
                              </TableCell>
                            ))}
                            <TableCell>
                              <MDBox display="flex" gap={1}>
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleEditClick(row)}
                                >
                                  <Icon>edit</Icon>
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(row)}
                                >
                                  <Icon>delete</Icon>
                                </IconButton>
                              </MDBox>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
            Are you sure you want to delete this record? This action cannot be undone.
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
        <DialogTitle id="edit-dialog-title">Edit Record</DialogTitle>
        <DialogContent>
          <MDBox pt={2}>
            {getEditableColumns().map((column) => (
              <TextField
                key={column}
                fullWidth
                label={column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " ")}
                value={editFormData[column] !== null ? editFormData[column] : ""}
                onChange={(e) => handleEditFormChange(column, e.target.value)}
                margin="normal"
                variant="outlined"
              />
            ))}
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
    </DashboardLayout>
  );
}

export default Tables2;
