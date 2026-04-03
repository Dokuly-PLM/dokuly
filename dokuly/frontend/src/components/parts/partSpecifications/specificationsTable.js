import React, { useEffect, useRef, useState } from "react";
import { Row } from "react-bootstrap";

import { editPartInformation } from "../functions/queries";
import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import EditableTableCell from "../../dokuly_components/editableTableCell/editableTableCell";
import DeleteButton from "../../dokuly_components/deleteButton";

const SpecificationsTable = (props) => {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const newKeyInputRef = useRef(null);

  const isEditable =
    props.part.release_state !== "Released" &&
    props.part.release_state !== "released";

  const handleSaveKey = async (rowIndex, oldKey, newKey) => {
    const data = {
      action: "edit_key",
      old_key: oldKey,
      new_key: newKey,
    };
    await editPartInformation(props.part.id, data);
    props.setRefresh(true);
  };

  const handleSaveValue = async (key, newValue) => {
    const data = {
      action: "edit",
      key: key,
      value: newValue,
    };
    await editPartInformation(props.part.id, data);
    props.setRefresh(true);
  };

  const handleDelete = (keyToDelete) => {
    if (!confirm(`Are you sure you want to delete ${keyToDelete}?`)) {
      return; // Exit early if the user cancels the confirmation
    }

    const data = {
      action: "delete",
      key: keyToDelete,
    };

    // Call the editPartInformation function with the partId and data
    editPartInformation(props.part.id, data)
      .then((response) => {
        props.setRefresh(true);
      })
      .catch((error) => {
        //console.error("Error deleting part information:", error);
      });
  };

  const handleAddNew = () => {
    if (newKey.trim() !== "" && newValue.trim() !== "") {
      const data = {
        action: "add",
        key: newKey.trim(),
        value: newValue.trim(),
      };

      editPartInformation(props.part.id, data)
        .then((response) => {
          setNewKey("");
          setNewValue("");
          props.setRefresh(true);
          if (newKeyInputRef.current) {
            newKeyInputRef.current.focus();
          }
        })
        .catch((error) => {
          console.error("Error updating part information:", error);
        });
    }
  };



  const handlePaste = async (e, field) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split("\n").map((line) => line.trim()).filter((line) => line);
  
    if (lines.length > 1) {
      // Handle multi-line paste
      const newEntries = {};
      let currentKey = "";
      let expectingValue = false;
  
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect if the line contains a tab or colon for key-value separation
        if (line.includes("\t")) {
          // Handle tab-separated format
          const [key, value] = line.split("\t");
          if (key && value) {
            newEntries[key.trim().replace(/:$/, "")] = value.trim();
          }
        } else if (line.includes(":")) {
          // Handle colon-separated format
          const [key, value] = line.split(":");
          if (key && value) {
            newEntries[key.trim()] = value.trim();
          }
        } else if (!expectingValue) {
          // This line is considered a key
          currentKey = line;
          expectingValue = true;
        } else {
          // This line is considered a value for the current key
          newEntries[currentKey] = line;
          expectingValue = false;
          currentKey = "";
        }
      }
  
      // If there's a key without a value (for lines count mismatch), add it with an empty value
      if (expectingValue && currentKey) {
        newEntries[currentKey] = "";
      }
  
      if (Object.keys(newEntries).length > 0) {
        try {
          await editPartInformation(props.part.id, {
            action: "paste",
            entries: newEntries,
          });
          props.setRefresh(true);
        } catch (error) {
          console.error("Error adding pasted entries:", error);
        }
      }
    } else {
      // Handle single-line paste
      if (field === "key") {
        setNewKey(pastedText.trim().replace(/:$/, ""));
      } else {
        setNewValue(pastedText.trim().replace(/:$/, ""));
      }
    }
  };
  



  const getFilteredPartInfo = (partInformation) => {
    if (!partInformation) return {};

    const excludedKeys = [
      "unit_price",
      "image_link",
      "distributor",
      "currency_price",
      "mpn",
      "part_url",
      "pricing_tiers", // Array of objects, not a simple value
      "source", // Internal metadata
      "digikey_part_number", // Internal metadata
      "digikey_product_id", // Internal metadata
    ];

    return Object.keys(partInformation)
      .filter((key) => {
        // Exclude keys in the excluded list
        if (excludedKeys.includes(key)) return false;
        
        const value = partInformation[key];
        
        // Exclude null, undefined, empty strings
        if (!value && value !== 0 && value !== false) return false;
        
        // Exclude objects and arrays (they can't be rendered directly)
        if (typeof value === 'object' && !Array.isArray(value)) return false;
        if (Array.isArray(value)) return false;
        
        return true;
      })
      .reduce((obj, key) => {
        obj[key] = partInformation[key];
        return obj;
      }, {});
  };

  useEffect(() => {
    if (newKeyInputRef.current) {
      newKeyInputRef.current.focus();
    }
  }, []);

  const filteredPartInformation = getFilteredPartInfo(
    props.part.part_information
  );

  const handleClearAll = () => {
    const entryCount = Object.keys(filteredPartInformation).length;
    
    if (entryCount === 0) {
      return; // No entries to clear
    }

    if (!confirm(`Are you sure you want to delete all ${entryCount} specifications? This action cannot be undone.`)) {
      return; // Exit early if the user cancels the confirmation
    }

    // Clear all specifications with a single API call
    const data = {
      action: "clear_all",
    };

    editPartInformation(props.part.id, data)
      .then(() => {
        props.setRefresh(true);
      })
      .catch((error) => {
        console.error("Error clearing all specifications:", error);
      });
  };

  return (
    <DokulyCard
        isCollapsed={false}
        expandText={""}
      >
        <CardTitle
            titleText={"Technical specifications"}
            optionalHelpText={
              `Part specifications.
              The table supports pasting from web tables. Simply copy the contents from web tables and paste into the key field.`
            }
          />
        
        <Row className="mb-2">
          {isEditable && Object.keys(filteredPartInformation).length > 0 && (
            <DeleteButton
              onDelete={handleClearAll}
              buttonText="Clear All"
              className="ml-4 mb-2"
              fontSize="16px"
              iconWidth="16px"
            />
          )}
        </Row>
      <Row className="mt-1 ml-1 mr-1 align-items-center">
        <table className="table">
          <thead>
            <tr>
              <th>Attribute</th>
              <th>Value</th>
              {isEditable && <th> </th>} {/* Conditional third column header */}
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredPartInformation).map(
              ([key, value], rowIndex) => (
                <tr key={key}>
                  <td>
                    <EditableTableCell
                      value={key}
                      isEditable={isEditable}
                      onSave={(newKey) => handleSaveKey(rowIndex, key, newKey)}
                      placeholder="Attribute"
                      allowEmpty={false}
                      successMessage="Attribute updated"
                      minWidth="8rem"
                    />
                  </td>
                  <td>
                    <EditableTableCell
                      value={value}
                      isEditable={isEditable}
                      onSave={(newValue) => handleSaveValue(key, newValue)}
                      placeholder="Value"
                      allowEmpty={true}
                      successMessage="Value updated"
                      minWidth="8rem"
                    />
                  </td>
                  {isEditable && ( // Conditional delete icon rendering
                    <td>
                      <button
                        type="button"
                        className="btn btn-bg-transparent p-2"
                        onClick={() => handleDelete(key)}
                        title="Delete attribute"
                        style={{ padding: "0.25rem" }}
                      >
                        <img
                          src={".../../static/icons/trash.svg"}
                          alt="Delete"
                          className="icon-dark"
                          style={{
                            width: "20px",
                            height: "20px",
                          }}
                        />
                      </button>
                    </td>
                  )}
                </tr>
              )
            )}

            {isEditable && (
              <tr>
                <td>
                  <input
                    type="text"
                    placeholder="Attribute"
                    ref={newKeyInputRef}
                    value={newKey}
                    onPaste={(e) => handlePaste(e, "key")}
                    onChange={(e) => setNewKey(e.target.value)}
                    onBlur={handleAddNew}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKey.trim() !== "") {
                        handleAddNew();
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px"
                    }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Value"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onBlur={handleAddNew}
                    onPaste={(e) => handlePaste(e, "value")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKey.trim() !== "") {
                        handleAddNew();
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px"
                    }}
                  />
                </td>
                <td> </td> {/* Empty cell for alignment */}
              </tr>
            )}
          </tbody>
        </table>
      </Row>
    </DokulyCard>
  );
};

export default SpecificationsTable;
