import React, { useEffect, useRef, useState } from "react";
import { editPartInformation } from "../functions/queries";

const SpecificationsTable = (props) => {
  const [editingValue, setEditingValue] = useState("");
  const [inputVisible, setInputVisible] = useState(false);
  const [inputPosition, setInputPosition] = useState({ row: -1, col: -1 });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const newKeyInputRef = useRef(null);

  const isEditable =
    props.part.release_state !== "Released" &&
    props.part.release_state !== "released";

  const handleEdit = (rowIndex, colIndex, value) => {
    if (isEditable) {
      setInputVisible(true);
      setInputPosition({
        row: rowIndex,
        col: colIndex,
      });
      setEditingValue(value);
    }
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
          setInputVisible(false);
          setEditingValue("");
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

  const handleSave = () => {
    if (editingValue) {
      let data;
      if (inputPosition.col === 0) {
        // If the column being edited is the key (Attribute)
        const originalKey = Object.keys(filteredPartInformation)[
          inputPosition.row
        ];
        data = {
          action: "edit_key",
          old_key: originalKey,
          new_key: editingValue,
        };
      } else if (inputPosition.col === 1) {
        // If the column being edited is the value
        const key = Object.keys(filteredPartInformation)[inputPosition.row];
        data = {
          action: "edit",
          key: key,
          value: editingValue,
        };
      }

      // Call the editPartInformation function with the partId and data
      editPartInformation(props.part.id, data)
        .then((response) => {
          setInputVisible(false);
          setEditingValue("");
          props.setRefresh(true);
        })
        .catch((error) => {
          //console.error("Error updating part information:", error);
        });
    }
  };

  const handlePaste = async (e, field) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const lines = pastedText.split("\n");

    if (lines.length > 1) {
      // Handle multi-line paste
      const newEntries = {};
      let currentKey = "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          if (line.includes("\t")) {
            // Handle tab-separated format
            const [key, value] = line.split("\t");
            if (key && value) {
              newEntries[key.trim()] = value.trim();
            }
          } else if (!line.startsWith(" ") && !line.startsWith("\t")) {
            // This is a key
            currentKey = trimmedLine.replace(":", "").trim();
          } else if (currentKey) {
            // This is a value for the current key
            newEntries[currentKey] = trimmedLine;
            currentKey = "";
          }
        }
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
        setNewKey(pastedText.trim());
      } else {
        setNewValue(pastedText.trim());
      }
    }
  };

  const renderEditableCell = (value) => (
    <input
      type="text"
      value={editingValue}
      onChange={(e) => setEditingValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.target.blur();
        }
      }}
      style={{
        maxWidth: "200px",
        boxSizing: "border-box",
        width: "100%",
      }}
    />
  );

  const getFilteredPartInfo = (partInformation) => {
    if (!partInformation) return {};

    const excludedKeys = [
      "unit_price",
      "image_link",
      "distributor",
      "currency_price",
      "mpn",
      "part_url",
    ];

    return Object.keys(partInformation)
      .filter((key) => !excludedKeys.includes(key) && partInformation[key])
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

  return (
    <div className="col-md-auto mb-2">
      <h5>
        <b>Technical specifications</b>
      </h5>
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
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <td onClick={() => handleEdit(rowIndex, 0, key)}>
                  {inputVisible &&
                  inputPosition.row === rowIndex &&
                  inputPosition.col === 0
                    ? renderEditableCell(key)
                    : key}
                </td>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                <td onClick={() => handleEdit(rowIndex, 1, value)}>
                  {inputVisible &&
                  inputPosition.row === rowIndex &&
                  inputPosition.col === 1
                    ? renderEditableCell(value)
                    : value}
                </td>
                {isEditable && ( // Conditional delete icon rendering
                  <td>
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                    <img
                      src={".../../static/icons/trash.svg"}
                      alt="Delete"
                      style={{
                        cursor: "pointer",
                        width: "20px",
                        height: "20px",
                      }}
                      onClick={() => handleDelete(key)}
                    />
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
                />
              </td>
              <td> </td> {/* Empty cell for alignment */}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SpecificationsTable;
