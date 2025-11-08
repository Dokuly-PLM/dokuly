import React, { useState } from "react";
import { Dropdown, Form, Modal, Button as BootstrapButton } from "react-bootstrap";

/**
 * SavedViews component for saving and loading table views
 * A view includes: column selection, filters, sort order, and sort column
 */
const SavedViews = ({
  tableName,
  currentView,
  onLoadView,
  columns,
  selectedColumns,
  filters,
  sortedColumn,
  sortOrder,
  textSize = "16px",
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewName, setViewName] = useState("");
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const stored = localStorage.getItem(`tableViews_${tableName}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveCurrentView = () => {
    if (!viewName.trim()) return;

    const view = {
      id: Date.now().toString(),
      name: viewName.trim(),
      columns: selectedColumns.map((col) => col.key),
      filters: { ...filters },
      sortedColumn: sortedColumn?.key || null,
      sortOrder: sortOrder || "asc",
      createdAt: new Date().toISOString(),
    };

    const updatedViews = [...savedViews, view];
    setSavedViews(updatedViews);
    localStorage.setItem(`tableViews_${tableName}`, JSON.stringify(updatedViews));
    setViewName("");
    setShowSaveModal(false);
    onLoadView(view);
  };

  const deleteView = (viewId, e) => {
    e.stopPropagation();
    const updatedViews = savedViews.filter((v) => v.id !== viewId);
    setSavedViews(updatedViews);
    localStorage.setItem(`tableViews_${tableName}`, JSON.stringify(updatedViews));
  };

  const loadView = (view) => {
    onLoadView(view);
  };

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-secondary"
          size="sm"
          className="dokuly-btn-transparent"
          style={{ fontSize: textSize, borderColor: "#dee2e6" }}
        >
          Views
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ fontSize: textSize }}>
          <Dropdown.Item
            onClick={() => {
              const defaultView = {
                columns: columns
                  .filter((col) => col.defaultShowColumn !== false)
                  .map((col) => col.key),
                filters: {},
                sortedColumn: null,
                sortOrder: "asc",
              };
              loadView(defaultView);
            }}
          >
            Default View
          </Dropdown.Item>
          <Dropdown.Divider />
          {savedViews.length > 0 ? (
            savedViews.map((view) => (
              <Dropdown.Item
                key={view.id}
                onClick={() => loadView(view)}
                className="d-flex justify-content-between align-items-center"
              >
                <span>{view.name}</span>
                <button
                  type="button"
                  className="btn-close"
                  style={{ fontSize: "8px", marginLeft: "8px" }}
                  onClick={(e) => deleteView(view.id, e)}
                  aria-label="Delete view"
                />
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>No saved views</Dropdown.Item>
          )}
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => setShowSaveModal(true)}>
            Save Current View...
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: textSize }}>Save View</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label style={{ fontSize: textSize }}>View Name</Form.Label>
            <Form.Control
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter view name..."
              style={{ fontSize: textSize }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveCurrentView();
                }
              }}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <BootstrapButton
            variant="secondary"
            size="sm"
            onClick={() => setShowSaveModal(false)}
            style={{ fontSize: textSize }}
          >
            Cancel
          </BootstrapButton>
          <BootstrapButton
            variant="primary"
            size="sm"
            onClick={saveCurrentView}
            disabled={!viewName.trim()}
            style={{ fontSize: textSize }}
          >
            Save
          </BootstrapButton>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SavedViews;

