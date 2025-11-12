import React, { useState, useEffect, useContext } from "react";
import { Dropdown, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { AuthContext } from "../../../App";
import DokulyModal from "../../dokulyModal";
import SubmitButton from "../../submitButton";
import CancelButton from "../../cancelButton";
import DokulyCheckFormGroup from "../../dokulyCheckFormGroup";
import {
  fetchTableViews,
  createTableView,
  updateTableView,
  deleteTableView,
} from "../functions/queries";

/**
 * SavedViews component for saving and loading table views
 * A view includes: column selection, filters, sort order, and sort column
 * Views are stored in the backend and can be personal or shared
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
  const [isShared, setIsShared] = useState(false);
  const [savedViews, setSavedViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingView, setEditingView] = useState(null);
  const { user } = useContext(AuthContext);

  // Load views from backend
  useEffect(() => {
    if (tableName) {
      loadViews();
    }
  }, [tableName]);

  const loadViews = () => {
    setLoading(true);
    fetchTableViews(tableName)
      .then((res) => {
        if (res.status === 200) {
          setSavedViews(res.data);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          toast.error("Not authorized");
        } else {
          console.error("Error loading views:", err);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveCurrentView = () => {
    if (!viewName.trim()) return;

    const viewData = {
      table_name: tableName,
      name: viewName.trim(),
      columns: selectedColumns.map((col) => col.key),
      filters: { ...filters },
      sorted_column: sortedColumn?.key || null,
      sort_order: sortOrder || "asc",
      is_shared: isShared,
    };

    if (editingView) {
      // Update existing view
      updateTableView(editingView.id, viewData)
        .then((res) => {
          if (res.status === 200 || res.status === 201) {
            toast.success("View updated successfully");
            loadViews();
            setViewName("");
            setIsShared(false);
            setEditingView(null);
            setShowSaveModal(false);
            // Transform backend response to frontend format and load the updated view
            const updatedView = {
              id: res.data.id,
              name: res.data.name,
              columns: res.data.columns,
              filters: res.data.filters,
              sortedColumn: res.data.sorted_column,
              sortOrder: res.data.sort_order,
            };
            onLoadView(updatedView);
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            toast.error("Not authorized");
          } else if (err?.response?.status === 400) {
            const errorMsg = err?.response?.data?.name?.[0] || "Failed to update view";
            toast.error(errorMsg);
          } else {
            toast.error("Failed to update view");
          }
        });
    } else {
      // Create new view
      createTableView(viewData)
        .then((res) => {
          if (res.status === 201) {
            toast.success("View saved successfully");
            loadViews();
            setViewName("");
            setIsShared(false);
            setShowSaveModal(false);
            onLoadView(res.data);
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            toast.error("Not authorized");
          } else if (err?.response?.status === 400) {
            toast.error("A view with this name already exists");
          } else {
            toast.error("Failed to save view");
          }
        });
    }
  };

  const deleteView = (viewId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this view?")) {
      deleteTableView(viewId)
        .then((res) => {
          if (res.status === 204) {
            toast.success("View deleted successfully");
            loadViews();
          }
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            toast.error("Not authorized");
          } else {
            toast.error("Failed to delete view");
          }
        });
    }
  };

  const loadView = (view) => {
    // Transform backend view format to frontend format
    const transformedView = {
      id: view.id,
      name: view.name,
      columns: view.columns,
      filters: view.filters,
      sortedColumn: view.sorted_column,
      sortOrder: view.sort_order,
    };
    onLoadView(transformedView);
  };

  const handleEditView = (view, e) => {
    e.stopPropagation();
    // Store the full view object for editing
    setEditingView({
      id: view.id,
      name: view.name,
      is_shared: view.is_shared,
      columns: view.columns,
      filters: view.filters,
      sorted_column: view.sorted_column,
      sort_order: view.sort_order,
    });
    setViewName(view.name);
    setIsShared(view.is_shared || false);
    setShowSaveModal(true);
  };

  const handleNewView = () => {
    setEditingView(null);
    setViewName("");
    setIsShared(false);
    setShowSaveModal(true);
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
          {loading ? (
            <Dropdown.Item disabled>Loading views...</Dropdown.Item>
          ) : savedViews.length > 0 ? (
            savedViews.map((view) => (
              <Dropdown.Item
                key={view.id}
                onClick={(e) => {
                  // Only load view if click wasn't on edit/delete buttons
                  if (!e.target.closest('button')) {
                    loadView(view);
                  }
                }}
                className="d-flex justify-content-between align-items-center"
                style={{ paddingRight: "40px" }}
              >
                <div className="d-flex align-items-center" style={{ flex: 1 }}>
                  <span>{view.name}</span>
                  {view.is_shared && (
                    <span className="badge bg-secondary ms-2" style={{ fontSize: "10px" }}>
                      Shared
                    </span>
                  )}
                </div>
                {(() => {
                  // Check if user owns this view - handle both number and string IDs
                  // Also check if view.user is an object with id property
                  const viewUserId = typeof view.user === 'object' ? view.user?.id : view.user;
                  const currentUserId = user?.id || user?.pk;
                  
                  const userOwnsView = user && (
                    viewUserId === currentUserId ||
                    viewUserId === user.id ||
                    viewUserId === user.pk ||
                    String(viewUserId) === String(currentUserId) ||
                    String(viewUserId) === String(user.id) ||
                    String(viewUserId) === String(user.pk)
                  );
                  
                  // Debug logging
                  if (process.env.NODE_ENV === 'development') {
                    console.log('=== VIEW OWNERSHIP DEBUG ===');
                    console.log('View name:', view.name);
                    console.log('view.user (raw):', view.user, 'type:', typeof view.user);
                    console.log('viewUserId (extracted):', viewUserId);
                    console.log('Current user:', user);
                    console.log('user.id:', user?.id, 'user.pk:', user?.pk);
                    console.log('currentUserId:', currentUserId);
                    console.log('userOwnsView result:', userOwnsView);
                    console.log('Comparisons:');
                    console.log('  viewUserId === currentUserId:', viewUserId === currentUserId);
                    console.log('  viewUserId === user.id:', viewUserId === user?.id);
                    console.log('  viewUserId === user.pk:', viewUserId === user?.pk);
                    console.log('  String(viewUserId) === String(currentUserId):', String(viewUserId) === String(currentUserId));
                    console.log('  String(viewUserId) === String(user.id):', String(viewUserId) === String(user?.id));
                    console.log('  String(viewUserId) === String(user.pk):', String(viewUserId) === String(user?.pk));
                    console.log('================================');
                  }
                  
                  // TEMPORARILY: Always show buttons to verify they render
                  // TODO: Change back to userOwnsView once we fix the comparison
                  const shouldShowButtons = true; // Change to userOwnsView
                  
                  return shouldShowButtons ? (
                    <div 
                      className="d-flex gap-1 align-items-center" 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                      }}
                      role="group"
                    >
                      <button
                        type="button"
                        className="btn dokuly-btn-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleEditView(view, e);
                        }}
                        aria-label="Edit view"
                        title="Edit view"
                        style={{
                          padding: "4px 8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <img
                          className="icon-dark"
                          src="../../../static/icons/edit.svg"
                          alt="edit"
                        />
                      </button>
                      <button
                        type="button"
                        className="btn dokuly-btn-transparent"
                        style={{ 
                          fontSize: "14px",
                          padding: "4px 8px",
                          color: "#dc3545",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          deleteView(view.id, e);
                        }}
                        aria-label="Delete view"
                        title="Delete view"
                      >
                        ×
                      </button>
                    </div>
                  ) : null;
                })()}
              </Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>No saved views</Dropdown.Item>
          )}
          <Dropdown.Divider />
          <Dropdown.Item onClick={handleNewView}>
            Save Current View...
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <DokulyModal
        show={showSaveModal}
        onHide={() => {
          setShowSaveModal(false);
          setEditingView(null);
          setViewName("");
          setIsShared(false);
        }}
        title={editingView ? "Edit View" : "Save View"}
        size="md"
      >
        <div style={{ fontSize: textSize }}>
          <div className="mx-3 mb-3">
            <label className="form-label" style={{ fontSize: textSize, fontWeight: "500" }}>
              View Name
            </label>
            <input
              type="text"
              className="form-control dokuly-form-input"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              placeholder="Enter view name..."
              style={{ fontSize: textSize }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && viewName.trim()) {
                  saveCurrentView();
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
          <DokulyCheckFormGroup
            label="Share with all users"
            value={isShared}
            onChange={setIsShared}
            id="isSharedCheck"
            showToolTip={false}
          />
          <div className="text-muted mx-3 mb-3" style={{ fontSize: textSize }}>
            When shared, this view will be visible to all users
          </div>
          <div className="d-flex justify-content-end gap-2 mx-3 mb-3">
            <CancelButton
              onClick={() => {
                setShowSaveModal(false);
                setEditingView(null);
                setViewName("");
                setIsShared(false);
              }}
              style={{ fontSize: textSize }}
            >
              Cancel
            </CancelButton>
            <SubmitButton
              onClick={saveCurrentView}
              disabled={!viewName.trim()}
              disabledTooltip="Please enter a view name"
              style={{ fontSize: textSize }}
              type="button"
            >
              {editingView ? "Update" : "Save"}
            </SubmitButton>
          </div>
        </div>
      </DokulyModal>
    </>
  );
};

export default SavedViews;

