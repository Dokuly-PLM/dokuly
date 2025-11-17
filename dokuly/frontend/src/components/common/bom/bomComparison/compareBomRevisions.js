import React, { useState, useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";

import { getBomItemsById } from "../functions/queries";
import { getLinkedParts } from "../functions/queries";
import { buildBomObject } from "../functions/buildBomObject";
import { compareBoms } from "./functions/bomComparator";

function limit_caracters(text, limit) {
  if (text.length <= limit) {
    return text;
  }
  return `${text.substring(0, limit)}...`;
}

/**
 * Compare two items based on their revision counters.
 * @param {Object} a - First item with revision_count_major and revision_count_minor
 * @param {Object} b - Second item with revision_count_major and revision_count_minor
 * @returns {number} - Negative if a < b, positive if a > b, 0 if equal
 */
function compareRevisionCounters(a, b) {
  const majorA = a.revision_count_major ?? 0;
  const majorB = b.revision_count_major ?? 0;
  
  if (majorA !== majorB) {
    return majorA - majorB;
  }
  
  const minorA = a.revision_count_minor ?? 0;
  const minorB = b.revision_count_minor ?? 0;
  
  return minorA - minorB;
}

/**
 * Compare multiple PCBAs or PCBA revisions.
 * Requires a list of items whose bom to compare, and their app, Pcba or Assembly.
 *
 * @param {*} items
 * @param {*} app
 * @returns
 */
export default function BomComparisonTable({
  items,
  app,
  current_revision_major = 0, // Optional, if not provided, the latest revision will be used
  current_revision_minor = 0, // Optional, if not provided, the latest revision will be used
  designator_header = "F/N",
  setShowBomDifferenceTable, // This is a function that sets the state of showBomTable in the parent component.
}) {
  // Only show card if there are any items to compare.
  if (!items || items < 2) {
    return "";
  }

  // Sort the items based on revision counters
  const sortedItems = items.sort((a, b) => compareRevisionCounters(a, b));

  // Find the current revision index using revision counters
  const currentRevisionIndex = sortedItems.findIndex((item) => {
    return (
      item.revision_count_major === current_revision_major &&
      item.revision_count_minor === current_revision_minor
    );
  });

  // Default comparison revision is the one before the current, if possible
  const defaultComparisonIndex =
    currentRevisionIndex > 0
      ? currentRevisionIndex - 1
      : currentRevisionIndex < sortedItems.length - 1
      ? currentRevisionIndex + 1
      : -1;

  const [bom_arrays, setBomArrays] = useState([]);
  const [mappedBomArrays, setMappedBomArrays] = useState([]);
  const [comparisonRevisionIndex, setComparisonRevisionIndex] = useState(
    defaultComparisonIndex,
  );

  // Local library of parts to map to the bom arrays.
  const [parts, setParts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [pcbas, setPcbas] = useState([]);

  const [showBomTable, setShowBomTable] = useState(false);

  useEffect(() => {
    const fetchBomData = async () => {
      const newBomArray = await Promise.all(
        sortedItems.map((item) =>
          getBomItemsById(item.id, app)
            .then((res) => {
              if (res) {
                return res;
              } else {
                return [];
              }
            })
            .catch((error) => {
              return [];
            }),
        ),
      );
      setBomArrays(newBomArray);
    };

    if (items.length > 0) fetchBomData();
  }, [items]);

  function separateBomItemIDs(bom_arrays) {
    const pcbaIds = [];
    const assemblyIds = [];
    const partIds = [];

    bom_arrays.forEach((bom, index) => {
      if (!Array.isArray(bom)) {
        toast.error(`BOM at index ${index} is not an array:`, bom);
        return; // Skip this iteration if bom is not an array
      }

      bom.forEach((item) => {
        if (item.pcba) {
          pcbaIds.push(item.pcba);
        } else if (item.assembly) {
          assemblyIds.push(item.assembly);
        } else if (item.part) {
          partIds.push(item.part);
        }
      });
    });

    return { pcbaIds, assemblyIds, partIds };
  }

  useEffect(() => {
    if (bom_arrays.length === 0) {
      return;
    }

    // if the arrays in bom arrays are empty, set the parts, assemblies, and pcbas to empty arrays
    if (bom_arrays.every((bom) => bom.length === 0)) {
      return;
    }

    // gather all part ids, pcba ids, and assembly ids from the bom arrays
    const { pcbaIds, assemblyIds, partIds } = separateBomItemIDs(bom_arrays);

    // fetch the linked parts
    getLinkedParts(assemblyIds, partIds, pcbaIds).then((res) => {
      setParts(res?.parts || []);
      setAssemblies(res?.asms || []);
      setPcbas(res?.pcbas || []);
    });
  }, [bom_arrays]);

  useEffect(() => {
    // Create a new array to store the updated BOMs
    const updatedBomArrays = bom_arrays.map((bom) =>
      buildBomObject(bom, parts, pcbas, assemblies),
    );

    // Update the state with the new array
    setMappedBomArrays(updatedBomArrays);
  }, [bom_arrays, parts, pcbas, assemblies]); // Include all dependencies here

  function renderCheckboxes() {
    return (
      <Container fluid>
        <table className="table">
          <tbody>
            <tr>
              {sortedItems.map((item, index) => {
                let cellStyle = {};
                if (index === currentRevisionIndex) {
                  cellStyle = { backgroundColor: "#C0C0C0" }; // Grayed out for current revision
                } else if (index === comparisonRevisionIndex) {
                  cellStyle = { backgroundColor: "#E4F8F5" }; // Highlighted color for selected revision
                }

                return (
                  <td
                    key={item.id}
                    style={cellStyle}
                    onClick={() => {
                      if (index !== currentRevisionIndex) {
                        handleCheckboxChange(index);
                      }
                    }}
                    className={
                      index !== currentRevisionIndex
                        ? "selectable-revision"
                        : ""
                    }
                  >
                    {item.full_part_number}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </Container>
    );
  }

  function handleCheckboxChange(index) {
    setComparisonRevisionIndex(index);
  }

  let filteredItems = [
    sortedItems[currentRevisionIndex],
    sortedItems[comparisonRevisionIndex],
  ].filter(Boolean); // Filter out any undefined values

  // Sort the filtered items by revision counters
  filteredItems.sort((a, b) => compareRevisionCounters(a, b));

  function render_headers() {
    return (
      <tr>
        <th scope="col">{designator_header}</th>

        {filteredItems.map((item) => (
          <th scope="col" key={item.id}>
            {(() => {
              
              // Compare using revision counters instead of deprecated revision field
              const isCurrent = 
                item.revision_count_major === sortedItems[currentRevisionIndex]?.revision_count_major &&
                item.revision_count_minor === sortedItems[currentRevisionIndex]?.revision_count_minor;
              
              if (isCurrent) {
                return `${item.formatted_revision} (Current)`;
              } else {
                return item.formatted_revision;
              }
            })()}
          </th>
        ))}
        <th scope="col" />
      </tr>
    );
  }

  function render_body(bom_differences) {
    return Object.entries(bom_differences).map(([designator, differences]) => {
      let rowColor = "";
      if (differences.some((item) => item.change === "part_added")) {
        // Lighter green
        rowColor = "#E4F8F5";
      } else if (differences.some((item) => item.change === "part_removed")) {
        // Lighter red
        rowColor = "#FFC0CB";
      } else if (differences.some((item) => item.change === "part_changed")) {
        // Lighter orange
        rowColor = "#ffe7d3";
      } else if (
        differences.some((item) => item.change === "revision_changed")
      ) {
        // Lighter orange
        rowColor = "#ffe7d3";
      } else if (
        differences.some((item) => item.change === "quantity_changed")
      ) {
        // Lighter yellow
        rowColor = "#fff9e6";
      }

      return (
        <tr
          key={designator}
          className="table-row-hover"
          style={{ backgroundColor: rowColor }}
        >
          <td>{designator}</td>
          {differences.map((item, index) => {
            if (item.item_missing) {
              return <td />;
            } else if (!item.full_part_number) {
              return <td key={index}>Missing part connection</td>;
            } else {
              return (
                <td
                  onClick={() => {
                    if (event.ctrlKey || event.metaKey) {
                      if (item.part) {
                        window.open(`/#/parts/${item.part}/`);
                      } else if (item.assembly) {
                        window.open(`/#/assemblies/${item.assembly}/`);
                      } else if (item.pcba) {
                        window.open(`/#/pcbas/${item.pcba}/`);
                      }
                    }
                  }}
                  onKeyUp={() => {}}
                  key={index}
                >
                  <b>{`${item.full_part_number}:`}</b>{" "}
                  {limit_caracters(item.display_name, 30)}
                </td>
              );
            }
          })}
          <td>
            {/* Add a column for change icons */}
            {differences.some((item) => item.change === "part_added") && (
              <img
                src="../../../static/icons/plus.svg"
                alt="Part added to BOM"
              />
            )}
            {differences.some((item) => item.change === "part_removed") && (
              <img
                src="../../../static/icons/x.svg"
                alt="Part removed from BOM"
              />
            )}
            {differences.some((item) => item.change === "revision_changed") && (
              <>
                {`${differences[0].revision_count_major ?? 0}-${differences[0].revision_count_minor ?? 0}`}
                <img
                  src="../../../static/icons/arrow-right.svg"
                  alt="Revision changed"
                />
                {`${differences[1].revision_count_major ?? 0}-${differences[1].revision_count_minor ?? 0}`}
              </>
            )}
            {differences.some((item) => item.change === "quantity_changed") && (
              <>
                Qty: {differences[0].quantity ?? 1}
                <img
                  src="../../../static/icons/arrow-right.svg"
                  alt="Quantity changed"
                />
                {differences[1].quantity ?? 1}
              </>
            )}
          </td>
        </tr>
      );
    });
  }

  function render_table() {
    let bom_differences = [];
    if (filteredItems.length === 2) {
      bom_differences = compareBoms(
        filteredItems.map((item) => mappedBomArrays[sortedItems.indexOf(item)]),
      );
    }

    return (
      <table
        className="table table-bordered table-sm"
        onMouseOver={() => {}}
        onFocus={() => {}}
      >
        <thead>{render_headers()}</thead>
        <tbody>{render_body(bom_differences)}</tbody>
      </table>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <Row className="mt-2">
        <button
          type="button"
          className="btn dokuly-bg-transparent ml-4 mb-2"
          data-toggle="tooltip"
          data-placement="top"
          title="Add an item to the BOM"
          //disabled={} // TODO: Implement logic for disabling the button
          onClick={() => {
            setShowBomTable(!showBomTable);
            setShowBomDifferenceTable(!showBomTable);
          }}
        >
          <div className="row">
            <img
              className="icon-dark"
              src="../../static/icons/git-compare.svg"
              alt="icon"
            />
            <span className="btn-text">
              {showBomTable ? "Hide BOM Changes" : "Show BOM Changes"}
            </span>
          </div>
        </button>
      </Row>
      {showBomTable && (
        //add margin on the right side of the table
        <div className="card rounded p-3">
          <Row className="ml-3 mr-3 mt-2 mb-2">
            <h5>BOM Comparison</h5>
            {renderCheckboxes()}
            {render_table()}
          </Row>
        </div>
      )}
    </div>
  );
}
