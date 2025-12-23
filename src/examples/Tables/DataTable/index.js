/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo, useEffect, useState, useRef } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// react-table components
import { useTable, usePagination, useGlobalFilter, useAsyncDebounce, useSortBy } from "react-table";

// @mui material components
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import Tooltip from "@mui/material/Tooltip";

// Drag and drop for column reordering
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDPagination from "components/MDPagination";

// Material Dashboard 2 React example components
import DataTableHeadCell from "examples/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "examples/Tables/DataTable/DataTableBodyCell";

// Draggable header cell wrapper component
function DraggableHeaderCell({ column, children, sorted, isSorted, width, align, onSortClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 1000 : "auto",
  };

  const handleSortClick = (e) => {
    e.stopPropagation();
    // Don't trigger sort if sorting is disabled for this column
    if (column.disableSortBy) {
      return;
    }
    if (onSortClick) {
      onSortClick(e);
    }
  };

  return (
    <DataTableHeadCell
      ref={setNodeRef}
      style={style}
      {...attributes}
      width={width}
      align={align}
      sorted={sorted}
      onSortClick={onSortClick}
    >
      <MDBox display="flex" alignItems="center" width="100%">
        <Tooltip title="Drag to reorder" placement="top" enterDelay={300}>
          <span
            {...listeners}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "grab",
              padding: "2px",
              marginRight: "4px",
            }}
          >
            <Icon sx={{ fontSize: "14px !important", opacity: 0.5 }}>drag_indicator</Icon>
          </span>
        </Tooltip>
        <MDBox
          onClick={handleSortClick}
          sx={{
            cursor: column.disableSortBy ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            flex: 1,
            userSelect: "none",
          }}
        >
          {children}
        </MDBox>
      </MDBox>
    </DataTableHeadCell>
  );
}

function DataTable({
  entriesPerPage,
  canSearch,
  showTotalEntries,
  table,
  pagination,
  isSorted,
  noEndBorder,
  draggableColumns,
  onColumnOrderChange,
  onResetColumnOrder,
  currentPage,
  onPageChange,
  tableId,
  filterComponents,
}) {
  const defaultValue = entriesPerPage.defaultValue ? entriesPerPage.defaultValue : 10;

  // Get initial sort state from sessionStorage
  const getInitialSortState = () => {
    if (!tableId) return [];
    try {
      const saved = sessionStorage.getItem(`table-sort-${tableId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  };

  // Drag and drop sensors for column reordering
  const columnSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const entries = entriesPerPage.entries
    ? entriesPerPage.entries.map((el) => el.toString())
    : ["5", "10", "15", "20", "25"];
  const columns = useMemo(() => table.columns, [table]);
  const data = useMemo(() => table.rows, [table]);

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: {
        pageIndex: currentPage || 0,
        sortBy: getInitialSortState(),
      },
      autoResetPage: false, // Prevent automatic page reset when data changes
      autoResetSortBy: false, // Prevent automatic sort reset when data changes
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter, sortBy },
  } = tableInstance;

  // Set the default value for the entries per page when component mounts
  useEffect(() => setPageSize(defaultValue || 10), [defaultValue]);

  // Save sort state to sessionStorage when it changes
  useEffect(() => {
    if (tableId && sortBy) {
      try {
        sessionStorage.setItem(`table-sort-${tableId}`, JSON.stringify(sortBy));
      } catch {
        // Ignore storage errors
      }
    }
  }, [tableId, sortBy]);

  // Track the previous pageIndex to detect internal vs external changes
  const prevPageIndexRef = useRef(pageIndex);
  const prevCurrentPageRef = useRef(currentPage);

  // Sync external page control with internal state
  useEffect(() => {
    // Only sync if currentPage prop changed (external change from parent)
    if (currentPage !== undefined && currentPage !== prevCurrentPageRef.current) {
      prevCurrentPageRef.current = currentPage;
      if (currentPage !== pageIndex) {
        gotoPage(currentPage);
        prevPageIndexRef.current = currentPage;
      }
    }
  }, [currentPage, gotoPage, pageIndex]);

  // Notify parent when page changes internally (user clicking pagination)
  useEffect(() => {
    // Only notify if pageIndex changed internally (not from parent prop)
    if (pageIndex !== prevPageIndexRef.current) {
      prevPageIndexRef.current = pageIndex;
      if (onPageChange && currentPage !== undefined && pageIndex !== currentPage) {
        onPageChange(pageIndex);
      }
    }
  }, [pageIndex, onPageChange, currentPage]);

  // Ensure current page is valid when data changes (e.g., after deletion)
  useEffect(() => {
    if (pageOptions.length > 0 && pageIndex >= pageOptions.length) {
      const validPage = Math.max(0, pageOptions.length - 1);
      gotoPage(validPage);
      if (onPageChange && currentPage !== undefined) {
        onPageChange(validPage);
      }
    }
  }, [pageOptions.length, pageIndex, gotoPage, onPageChange, currentPage]);

  // Set the entries per page value based on the select value
  const setEntriesPerPage = (value) => setPageSize(value);

  // Render the paginations with sliding window of 5 pages
  const getVisiblePages = () => {
    const totalPages = pageOptions.length;
    const current = pageIndex;
    const windowSize = 5; // Show 5 pages at a time

    if (totalPages <= windowSize) {
      // If total pages <= 5, show all pages without ellipsis
      return { pages: pageOptions, showLeftEllipsis: false, showRightEllipsis: false };
    }

    // Calculate the window start and end
    let windowStart = Math.max(0, current - Math.floor(windowSize / 2));
    let windowEnd = windowStart + windowSize - 1;

    // Adjust if window goes beyond total pages
    if (windowEnd >= totalPages) {
      windowEnd = totalPages - 1;
      windowStart = Math.max(0, windowEnd - windowSize + 1);
    }

    const pages = [];
    for (let i = windowStart; i <= windowEnd; i++) {
      pages.push(i);
    }

    // Show left ellipsis if there are pages before the window
    const showLeftEllipsis = windowStart > 0;
    // Show right ellipsis if there are pages after the window
    const showRightEllipsis = windowEnd < totalPages - 1;

    return { pages, showLeftEllipsis, showRightEllipsis };
  };

  const { pages: visiblePages, showLeftEllipsis, showRightEllipsis } = getVisiblePages();

  const renderPagination = visiblePages.map((option) => (
    <MDPagination
      item
      key={option}
      onClick={() => gotoPage(Number(option))}
      active={pageIndex === option}
    >
      {option + 1}
    </MDPagination>
  ));

  // Handler for the input to set the pagination index
  const handleInputPagination = ({ target: { value } }) =>
    value > pageOptions.length || value < 0 ? gotoPage(0) : gotoPage(Number(value));

  // Customized page options starting from 1
  const customizedPageOptions = pageOptions.map((option) => option + 1);

  // Setting value for the pagination input
  const handleInputPaginationValue = ({ target: value }) => gotoPage(Number(value.value - 1));

  // Search input value state
  const [search, setSearch] = useState(globalFilter);

  // Search input state handle
  const onSearchChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 100);

  // A function that sets the sorted value for the table
  const setSortedValue = (column) => {
    let sortedValue;

    // If column has sorting disabled, don't show sort arrows
    if (column.disableSortBy) {
      return false;
    }

    if (isSorted && column.isSorted) {
      sortedValue = column.isSortedDesc ? "desc" : "asce";
    } else if (isSorted) {
      sortedValue = "none";
    } else {
      sortedValue = false;
    }

    return sortedValue;
  };

  // Handle column drag end
  const handleColumnDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && onColumnOrderChange) {
      const headers = headerGroups[0]?.headers || [];
      const oldIndex = headers.findIndex((col) => col.id === active.id);
      const newIndex = headers.findIndex((col) => col.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(
          headers.map((col) => col.id),
          oldIndex,
          newIndex
        );
        onColumnOrderChange(newOrder);
      }
    }
  };

  // Setting the entries starting point
  const entriesStart = pageIndex === 0 ? pageIndex + 1 : pageIndex * pageSize + 1;

  // Setting the entries ending point
  let entriesEnd;

  if (pageIndex === 0) {
    entriesEnd = pageSize;
  } else if (pageIndex === pageOptions.length - 1) {
    entriesEnd = rows.length;
  } else {
    entriesEnd = pageSize * (pageIndex + 1);
  }

  return (
    <TableContainer sx={{ boxShadow: "none" }}>
      {entriesPerPage || canSearch ? (
        <MDBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
          {canSearch && (
            <MDBox width="12rem">
              <MDInput
                placeholder="Search..."
                value={search}
                size="small"
                fullWidth
                onChange={({ currentTarget }) => {
                  setSearch(search);
                  onSearchChange(currentTarget.value);
                }}
              />
            </MDBox>
          )}
          {filterComponents && (
            <MDBox display="flex" alignItems="center" ml={2} gap={1}>
              {filterComponents}
            </MDBox>
          )}
          <MDBox display="flex" alignItems="center" ml="auto">
            {draggableColumns && onResetColumnOrder && (
              <MDBox mr={2}>
                <Tooltip title="Reset column order to default">
                  <MDBox
                    component="button"
                    onClick={onResetColumnOrder}
                    sx={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "text.secondary",
                      "&:hover": { color: "info.main" },
                    }}
                  >
                    <Icon sx={{ mr: 0.5 }}>restart_alt</Icon>
                    <MDTypography variant="caption" color="inherit">
                      Reset Columns
                    </MDTypography>
                  </MDBox>
                </Tooltip>
              </MDBox>
            )}
            {entriesPerPage && (
              <MDBox display="flex" alignItems="center">
                <Autocomplete
                  disableClearable
                  value={pageSize.toString()}
                  options={entries}
                  onChange={(event, newValue) => {
                    setEntriesPerPage(parseInt(newValue, 10));
                  }}
                  size="small"
                  sx={{ width: "5rem" }}
                  renderInput={(params) => <MDInput {...params} />}
                />
                <MDTypography variant="caption" color="secondary">
                  &nbsp;&nbsp;entries per page
                </MDTypography>
              </MDBox>
            )}
          </MDBox>
        </MDBox>
      ) : null}
      <Table {...getTableProps()} sx={{ tableLayout: "fixed", width: "100%" }}>
        {draggableColumns ? (
          <DndContext
            sensors={columnSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleColumnDragEnd}
          >
            <MDBox component="thead">
              {headerGroups.map((headerGroup, key) => (
                <TableRow key={key} {...headerGroup.getHeaderGroupProps()}>
                  <SortableContext
                    items={headerGroup.headers.map((col) => col.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((column, idx) => {
                      const sortToggleProps = isSorted && !column.disableSortBy ? column.getSortByToggleProps() : {};
                      return (
                        <DraggableHeaderCell
                          key={column.id}
                          column={column}
                          width={column.width ? column.width : "auto"}
                          align={column.align ? column.align : "left"}
                          sorted={setSortedValue(column)}
                          isSorted={isSorted}
                          onSortClick={sortToggleProps.onClick}
                        >
                          {column.render("Header")}
                        </DraggableHeaderCell>
                      );
                    })}
                  </SortableContext>
                </TableRow>
              ))}
            </MDBox>
          </DndContext>
        ) : (
          <MDBox component="thead">
            {headerGroups.map((headerGroup, key) => (
              <TableRow key={key} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, idx) => (
                  <DataTableHeadCell
                    key={idx}
                    {...column.getHeaderProps(isSorted && column.getSortByToggleProps())}
                    width={column.width ? column.width : "auto"}
                    align={column.align ? column.align : "left"}
                    sorted={setSortedValue(column)}
                  >
                    {column.render("Header")}
                  </DataTableHeadCell>
                ))}
              </TableRow>
            ))}
          </MDBox>
        )}
        <TableBody {...getTableBodyProps()}>
          {page.map((row, key) => {
            prepareRow(row);
            return (
              <TableRow key={key} {...row.getRowProps()}>
                {row.cells.map((cell, idx) => (
                  <DataTableBodyCell
                    key={idx}
                    noBorder={noEndBorder && rows.length - 1 === key}
                    align={cell.column.align ? cell.column.align : "left"}
                    fullWidth={cell.column.fullWidth || false}
                    {...cell.getCellProps()}
                  >
                    {cell.render("Cell")}
                  </DataTableBodyCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <MDBox
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        p={!showTotalEntries && pageOptions.length === 1 ? 0 : 3}
      >
        {showTotalEntries && (
          <MDBox mb={{ xs: 3, sm: 0 }}>
            <MDTypography variant="button" color="secondary" fontWeight="regular">
              Showing {entriesStart} to {entriesEnd} of {rows.length} entries
            </MDTypography>
          </MDBox>
        )}
        {pageOptions.length > 1 && (
          <MDPagination
            variant={pagination.variant ? pagination.variant : "gradient"}
            color={pagination.color ? pagination.color : "info"}
          >
            {/* First page button */}
            <MDPagination item onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
              <Icon sx={{ fontWeight: "bold" }}>first_page</Icon>
            </MDPagination>
            {/* Previous page button */}
            <MDPagination item onClick={() => previousPage()} disabled={!canPreviousPage}>
              <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
            </MDPagination>
            {/* Left ellipsis */}
            {showLeftEllipsis && (
              <MDBox
                sx={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  fontSize: "0.875rem",
                }}
              >
                ...
              </MDBox>
            )}
            {renderPagination}
            {/* Right ellipsis */}
            {showRightEllipsis && (
              <MDBox
                sx={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  fontSize: "0.875rem",
                }}
              >
                ...
              </MDBox>
            )}
            {/* Next page button */}
            <MDPagination item onClick={() => nextPage()} disabled={!canNextPage}>
              <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
            </MDPagination>
            {/* Last page button */}
            <MDPagination item onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage}>
              <Icon sx={{ fontWeight: "bold" }}>last_page</Icon>
            </MDPagination>
          </MDPagination>
        )}
      </MDBox>
    </TableContainer>
  );
}

// Setting default values for the props of DataTable
DataTable.defaultProps = {
  entriesPerPage: { defaultValue: 10, entries: [5, 10, 15, 20, 25] },
  canSearch: false,
  showTotalEntries: true,
  pagination: { variant: "gradient", color: "info" },
  isSorted: true,
  noEndBorder: false,
  draggableColumns: false,
  onColumnOrderChange: null,
  onResetColumnOrder: null,
  currentPage: undefined,
  onPageChange: null,
  tableId: null,
  filterComponents: null,
};

// Typechecking props for the DataTable
DataTable.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  canSearch: PropTypes.bool,
  showTotalEntries: PropTypes.bool,
  table: PropTypes.objectOf(PropTypes.array).isRequired,
  pagination: PropTypes.shape({
    variant: PropTypes.oneOf(["contained", "gradient"]),
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "light",
    ]),
  }),
  isSorted: PropTypes.bool,
  noEndBorder: PropTypes.bool,
  draggableColumns: PropTypes.bool,
  onColumnOrderChange: PropTypes.func,
  onResetColumnOrder: PropTypes.func,
  currentPage: PropTypes.number,
  onPageChange: PropTypes.func,
  tableId: PropTypes.string,
  filterComponents: PropTypes.node,
};

export default DataTable;
