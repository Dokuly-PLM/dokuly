import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDrop } from "react-dnd";
import { Container, Table, Row, Col, Form } from "react-bootstrap";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import NavigateButton from "./components/navigateButton";
import ColumnSelector from "./components/columnSelector";
import CsvDownloader from "./components/csvDownloader";
import DraggableHeader from "./components/draggableHeader";
import sortData from "./functions/sortUtils";
import MarkdownDownloader from "./components/markdownDownloader";
import { toast } from "react-toastify";
import NumericFieldEditor from "./components/numericFieldEditor";
import TextFieldEditor from "./components/textFieldEditor";
import QuestionToolTip from "../questionToolTip";
import { searchHelpText } from "./functions/textUtils";
import HierarchicalCol from "./components/hierarchicalCol";
import { useSpring, animated } from "react-spring";

/**
 * DokulyTable is a table component that can be used to display data in a table format.
 * It supports features like sorting, pagination, search, column selection, and CSV download.
 * It also supports custom cell formatters for different data types.
 * @param {Object} props
 * @param {Array} props.data - The data to be displayed in the table
 * @param {String} props.tableName - The name of the table
 * @param {Boolean} props.showColumnSelector - Whether to show the column selector
 * @param {Array} props.columns - The columns to be displayed in the table
 * @param {Number} props.itemsPerPage - The number of items to display per page
 * @param {Number} props.selectedRowIndex - The index of the selected row
 * @param {Function} props.onRowClick - The function to be called when a row is clicked
 * @param {Function} props.onRowDoubleClick - The function to be called when a row is double clicked
 * @param {Boolean} props.showCsvDownload - Whether to show the CSV download button
 * @param {Boolean} props.showPagination - Whether to show the pagination
 * @param {Boolean} props.showSearch - Whether to show the search bar
 * @param {Boolean} props.navigateColumn - Whether to show the navigate column
 * @param {Function} props.onNavigate - The function to be called when the navigate button is clicked
 * @param {Object} props.defaultSort - The default sort order
 * @param {String} props.textSize - The font size of the text in the table
 * @param {Boolean} props.isMarkdownTable - Whether the table is a markdown table
 * @param {Element} props.renderChildrenNextToSearch - The children to be rendered next to the search bar
 * @param {String} props.idKey - The key to be used as the id
 * @param {String} props.parentIdKey - The key to be used as the parent id
 * @param {Boolean} props.treeData - Whether the data is tree data
 * @param {Array} props.contextMenuActions - The actions to be displayed in the context menu
 * @param {Boolean} props.useOnRightClick - Whether to use the on right click functionality
 * @returns {JSX.Element}
 * @constructor
 * @example
 * <DokulyTable
 *  data={data}
 * tableName="Table Name"
 * showColumnSelector={true}
 * columns={columns}
 * itemsPerPage={50}
 * selectedRowIndex={selectedRowIndex}
 * onRowClick={onRowClick}
 * onRowDoubleClick={onRowDoubleClick}
 * showCsvDownload={true}
 * showPagination={true}
 * showSearch={true}
 * navigateColumn={false}
 * onNavigate={onNavigate}
 * defaultSort={{ columnNumber: 0, order: "asc" }}
 * textSize="16px"
 * isMarkdownTable={false}
 * renderChildrenNextToSearch={<></>}
 * />
 */
function DokulyTable(props) {
  return <DokulyTableContents {...props} />;
}

function DokulyTableContents({
  data,
  tableName = "",
  showColumnSelector = false,
  columns,
  itemsPerPage = 50,
  selectedRowIndex,
  onRowClick,
  onRowDoubleClick,
  showCsvDownload = true,
  showPagination = true,
  showSearch = true,
  navigateColumn = false,
  onNavigate,
  defaultSort = { columnNumber: 0, order: "asc" },
  textSize = "16px",
  isMarkdownTable = false,
  renderChildrenNextToSearch = <></>,
  idKey = "id",
  parentIdKey = "parent_task",
  treeData = false,
  contextMenuActions = [],
  useOnRightClick = false,
}) {
  const [selectedColumns, setSelectedColumns] = useState(
    columns.filter((col) => col.defaultShowColumn !== false)
  );
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState(defaultSort.order);
  const [sortedColumn, setSortedColumn] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [expandedRows, setExpandedRows] = useState({});
  const [parentToChildren, setParentToChildren] = useState({});

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    rowData: null,
  });

  const tableRef = useRef(null);

  useEffect(() => {
    if (data && data.length > 0) {
      const dataWithRowId = data.map((item, index) => ({
        ...item,
        row_id: index,
      }));

      // Build mappings
      const objectMap = {};
      const parentMap = {};
      dataWithRowId.forEach((object) => {
        objectMap[object[idKey]] = object;
        const parentId = object[parentIdKey];
        if (parentId) {
          if (!parentMap[parentId]) {
            parentMap[parentId] = [];
          }
          parentMap[parentId].push(object);
        }
      });
      setParentToChildren(parentMap);

      // Mark rows that has a sub object
      dataWithRowId.forEach((object) => {
        object.hasSubObject = !!parentMap[object[idKey]];
      });

      setTableData(dataWithRowId);
    }

    if (columns && columns.length > 0) {
      setSortedColumn(columns[defaultSort.columnNumber]);
    }
  }, [data, columns, defaultSort.columnNumber]);

  const getVisibleData = (data) => {
    if (!treeData) {
      return sortData(data, sortedColumn, sortOrder);
    }

    const processObject = (object, level = 0) => {
      const currentLevel = level;
      const result = [{ ...object, level: currentLevel }];

      if (expandedRows[object[idKey]]) {
        let subObjects = parentToChildren[object[idKey]] || [];
        // Recursively sort subtasks
        subObjects = sortData(subObjects, sortedColumn, sortOrder);
        subObjects.forEach((subObject) => {
          result.push(...processObject(subObject, currentLevel + 1));
        });
      }

      return result;
    };

    // Get root tasks (tasks without a parent)
    let rootObjects = data.filter((object) => !object[parentIdKey]);
    // Sort root tasks
    rootObjects = sortData(rootObjects, sortedColumn, sortOrder);

    const finalResult = [];
    rootObjects.forEach((object) => {
      finalResult.push(...processObject(object));
    });

    return finalResult;
  };

  const highlightMatch = (text, queries) => {
    if (!queries.length) return text;

    const escapedQueries = queries.map((q) =>
      q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const regex = new RegExp(`(${escapedQueries.join("|")})`, "gi");

    const parts = text.split(regex);

    return parts.filter(Boolean).map((part, index) => {
      if (part.match(regex)) {
        return (
          <span key={index} style={{ fontWeight: "bold" }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const moveColumn = useCallback(
    (dragIndex, hoverIndex) => {
      const dragColumn = selectedColumns[dragIndex];
      const newColumns = [...selectedColumns];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, dragColumn);
      setSelectedColumns(newColumns);
    },
    [selectedColumns]
  );

  const [, drop] = useDrop({
    accept: "COLUMN",
    hover(item, monitor) {
      const draggedIndex = item.originalIndex;
      const hoveredIndex = index;

      if (draggedIndex === hoveredIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      if (draggedIndex < hoveredIndex && hoverClientX < hoverMiddleX) {
        return;
      }

      if (draggedIndex > hoveredIndex && hoverClientX > hoverMiddleX) {
        return;
      }

      moveColumn(draggedIndex, hoveredIndex);
      item.originalIndex = hoveredIndex;
    },
  });

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleHeaderClick = (column) => {
    if (sortedColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortedColumn(column);
      setSortOrder("asc");
    }
  };

  const searchTerms = searchTerm
    .toLowerCase()
    .split(",")
    .map((term) => term.trim())
    .filter((term) => term);

  const filterData = (data) => {
    const terms = searchTerm
      .toLowerCase()
      .split(/\s*,\s*|\s+/)
      .filter(Boolean);

    return data.filter((row) =>
      terms.every((term) =>
        columns.some((column) => {
          if (column?.searchValue) {
            const cellValue =
              column.searchValue(row)?.toString().toLowerCase() || "";
            return cellValue.includes(term);
          }
          const cellValue = row[column.key]?.toString().toLowerCase() || "";
          return cellValue.includes(term);
        })
      )
    );
  };

  const filteredData = filterData(tableData);
  const sortedData = sortData(filteredData, sortedColumn, sortOrder);
  const visibleData = getVisibleData(sortedData);
  const paginatedData = visibleData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handleRowKeyDown = (e, row_id) => {
    if (e.key === "Enter") {
      const row = tableData.find((item) => item.row_id === row_id);
      onRowClick(tableData.indexOf(row));
    }
  };

  const handleToggleExpand = (objectId) => {
    setExpandedRows((prevState) => ({
      ...prevState,
      [objectId]: !prevState[objectId],
    }));
  };

  const handleSortAndPaginate = (data) => {
    if (treeData) {
      return data;
    }
    return sortData(data, sortedColumn, sortOrder);
  };

  const sortedAndPaginatedData = handleSortAndPaginate(paginatedData);

  const renderCellContent = (row, column) => {
    if (column.type === "numeric") {
      return (
        <NumericFieldEditor
          number={row[column.key]}
          setNumber={(newNumber) => {
            const updatedRow = { ...row, [column.key]: newNumber };
            const updatedData = tableData.map((item) =>
              item.row_id === row.row_id ? updatedRow : item
            );
            setTableData(updatedData);
          }}
          readOnly={column.readOnly}
        />
      );
    }

    if (column.type === "text") {
      return (
        <TextFieldEditor
          text={row[column.key]}
          setText={(newText) => {
            const updatedRow = { ...row, [column.key]: newText };
            const updatedData = tableData.map((item) =>
              item.row_id === row.row_id ? updatedRow : item
            );
            setTableData(updatedData);
          }}
          readOnly={column.readOnly}
          searchString={searchTerm} // Pass searchString for highlighting in text cells
        />
      );
    }

    const indent = row?.level ? row?.level * 40 : 0;
    const hasSubObject = row?.hasSubObject ?? false;

    // Backwards-compatible formatter: Pass row, column, and searchTerm (searchString)
    const content = column.formatter
      ? column.formatter(row, column, searchTerm)
      : row[column.key];

    if (typeof content === "string" && searchTerm) {
      // Seems like there is duplication of highlight funcitonality. Both in TextFieldEditor and here.
      return <>{highlightMatch(content, searchTerms)}</>;
    }

    if (treeData && column?.hierarchical) {
      return (
        <HierarchicalCol
          content={content}
          indent={indent}
          handleToggleExpand={handleToggleExpand}
          row={row}
          idKey={idKey}
          expandedRows={expandedRows}
          hasSubObject={hasSubObject}
        />
      );
    }
    return content;
  };

  const checkForWarning = (row) => {
    if (!row?.pcba && !row?.assembly && !row?.part && row?.bom) {
      return true;
    }
    if (
      row?.isProjectTask &&
      (row?.title === "" || row?.title === "--") &&
      row?.description === ""
    ) {
      return true;
    }
    return false;
  };

  const handleContextMenu = (e, row) => {
    e.preventDefault();

    const offsetX = 10; // Pixels to the right
    const offsetY = 10; // Pixels below

    console.log("On right click: Mouse X:", e.clientX, "Mouse Y:", e.clientY);

    setContextMenu({
      visible: true,
      x: e.clientX + offsetX,
      y: e.clientY + offsetY,
      rowData: row,
    });
  };

  const handleClickOutside = () => {
    if (contextMenu.visible && useOnRightClick) {
      setContextMenu({ ...contextMenu, visible: false });
    }
  };

  const handleDownloadPdf = async () => {
    toast.info("Generating PDF... This might take a while");
    const tableElement = tableRef.current;
    if (!tableElement) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;
    let currentHeight = margin;

    const rows = tableElement.querySelectorAll("tr");

    for (const row of rows) {
      // Create a canvas for each row
      const canvas = await html2canvas(row, { scale: 2 });
      const imgData = canvas.toDataURL("image/jpeg");
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // Check if adding this row would overflow the page
      if (currentHeight + imgHeight > contentHeight) {
        pdf.addPage();
        currentHeight = margin;
      }

      // Add the row image to the PDF
      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        currentHeight,
        contentWidth,
        imgHeight
      );
      currentHeight += imgHeight;
    }
    // Save the PDF with the table content

    const fileName = window.document.title;
    pdf.save(`${fileName}.pdf`);
  };

  const getRowClassName = (row, selectedRowIndex) => {
    if (selectedRowIndex === row.row_id) {
      return "selected-row";
    }
    if (row?.ignored) {
      return "selected-row-marked-danger";
    }
    if (row?.is_stock_in_other_revision) {
      return "selected-row-marked-warning";
    }
    return "";
  };

  const animationProps = useSpring({
    opacity: contextMenu.visible ? 1 : 0,
    transform: contextMenu.visible ? "translateY(0px)" : "translateY(-10px)",
    config: { tension: 250, friction: 20 },
  });

  return (
    <Container fluid ref={tableRef} onClick={handleClickOutside}>
      {showSearch && (
        <Row className="mb-2 mt-2">
          <Col md={5}>
            <Row className="mb-1">
              <Col className="col-9">
                <Form.Control
                  className="dokuly-form-input"
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: textSize }}
                />
              </Col>
              <Col className="d-flex align-items-center justify-content-start">
                <QuestionToolTip
                  optionalHelpText={searchHelpText}
                  placement="right"
                />
              </Col>
            </Row>
          </Col>
          {renderChildrenNextToSearch}
        </Row>
      )}

      {showColumnSelector && (
        <ColumnSelector
          tableName={tableName}
          columns={columns}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          fontsize={12}
        />
      )}

      <div style={{ overflowX: "auto" }}>
        <Table hover className="w-100" style={{ fontSize: textSize }}>
          <thead>
            <tr>
              {selectedColumns.map((column, index) => (
                <DraggableHeader
                  key={column.key}
                  column={column}
                  index={index}
                  moveColumn={moveColumn}
                  handleHeaderClick={handleHeaderClick}
                  sortedColumn={sortedColumn}
                  sortOrder={sortOrder}
                />
              ))}
              {navigateColumn && (
                <th style={{ width: "25px", textAlign: "center" }}> </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedAndPaginatedData.map((row) => (
              <tr
                key={row.id}
                onClick={(e) => onRowClick(row.row_id, row, e)} // Event added to the end so to not affect any existing functionality
                onDoubleClick={() => onRowDoubleClick(row.row_id, row)}
                onKeyDown={(e) => handleRowKeyDown(e, row.row_id, row)}
                onContextMenu={(e) => {
                  if (!useOnRightClick) {
                    return;
                  }
                  handleContextMenu(e, row);
                }}
                role="button"
                tabIndex={0}
                className={getRowClassName(row, selectedRowIndex)}
                style={{
                  cursor: "pointer",
                  border: checkForWarning(row) ? "2px solid #ffc109" : "none",
                }}
              >
                {selectedColumns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      maxWidth: column.maxWidth ? column.maxWidth : "auto",
                      whiteSpace: "normal",
                      cursor: "pointer",
                    }}
                  >
                    {renderCellContent(row, column)}
                  </td>
                ))}
                {navigateColumn && (
                  <td
                    style={{ width: "25px", textAlign: "center", padding: "0" }}
                  >
                    <NavigateButton onNavigateClick={() => onNavigate(row)} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {showPagination && (
        <Row className="pagination-row">
          <Col className="d-flex justify-content-center align-items-center">
            <div className="mr-2">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <img
                src="../../../static/icons/arrow-left.svg"
                alt="Previous Page"
                style={{
                  cursor: "pointer",
                  opacity: currentPage > 1 ? 1 : 0,
                }}
                onClick={() => {
                  if (currentPage > 1) {
                    handlePageChange(currentPage - 1);
                  }
                }}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
                tabIndex={0}
              />
            </div>

            {(isMarkdownTable &&
              Math.ceil(tableData.length / itemsPerPage) !== 1) ||
              (!isMarkdownTable && (
                <div className="d-flex align-items-center">
                  <span style={{ fontSize: textSize }}>
                    {currentPage} of{" "}
                    {Math.ceil(tableData.length / itemsPerPage)}
                  </span>
                </div>
              ))}

            <div className="ml-2">
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <img
                src="../../../static/icons/arrow-right.svg"
                alt="Next Page"
                style={{
                  cursor: "pointer",
                  opacity:
                    currentPage < Math.ceil(tableData.length / itemsPerPage)
                      ? 1
                      : 0,
                }}
                onClick={() => {
                  const totalPages = Math.ceil(tableData.length / itemsPerPage);
                  if (currentPage < totalPages) {
                    handlePageChange(currentPage + 1);
                  }
                }}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
                tabIndex={0}
              />
            </div>
          </Col>
        </Row>
      )}

      {showCsvDownload && (
        <Row className="pagination-row">
          <Col className="d-flex justify-content-start align-items-center">
            <CsvDownloader
              data={tableData}
              columns={columns}
              tableName={tableName}
              sortedColumn={sortedColumn}
              sortOrder={sortOrder}
              textSize={textSize}
            />{" "}
            <div className="mr-2" />
            <button
              type="button"
              className="btn dokuly-btn-transparent p-0"
              title="Download as PDF"
              onClick={handleDownloadPdf}
            >
              <img
                className="icon-dark"
                src="../../static/icons/file-download.svg"
                alt="icon"
              />
              <span className="btn-text ml-1" style={{ fontSize: textSize }}>
                PDF
              </span>
            </button>
            <div className="mr-2" />
            <MarkdownDownloader
              data={tableData}
              columns={columns}
              sortedColumn={sortedColumn}
              sortOrder={sortOrder}
              textSize={textSize}
            />
          </Col>
        </Row>
      )}
      {contextMenu.visible && useOnRightClick && (
        <animated.ul
          className="dropdown-menu show"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            ...animationProps,
          }}
          onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside
        >
          {contextMenuActions.length !== 0 ? (
            contextMenuActions.map((action, index) => (
              <li key={index}>
                <a
                  className="dropdown-item"
                  onClick={() => {
                    action.onClick(contextMenu.rowData);
                    setContextMenu({
                      visible: false,
                      x: 0,
                      y: 0,
                      rowData: null,
                    });
                  }}
                >
                  {action.label}
                </a>
              </li>
            ))
          ) : (
            <div
              className="m-2"
              onClick={() =>
                setContextMenu({
                  visible: false,
                  x: 0,
                  y: 0,
                  rowData: null,
                })
              }
            >
              No right click menu items sent to component!
            </div>
          )}
        </animated.ul>
      )}
    </Container>
  );
}

export default DokulyTable;
