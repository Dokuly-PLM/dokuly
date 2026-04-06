import React, { useState } from "react";
import { toast } from "react-toastify";
import DokulyModal from "../dokulyModal";
import { getOpenEcos, addItemToEco } from "../../eco/functions/queries";

const getPillColor = (releaseState) => {
  switch (releaseState) {
    case "Review":
      return "#f6c208";
    case "Draft":
    default:
      return "#108e82";
  }
};

const getTextColor = (releaseState) => {
  switch (releaseState) {
    case "Review":
      return "#000000";
    default:
      return "#ffffff";
  }
};

const AddToEcoButton = ({ app, itemId, itemName, onSuccess, variant = "toolbar" }) => {
  const [showModal, setShowModal] = useState(false);
  const [ecos, setEcos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEcoId, setSelectedEcoId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const handleOpen = () => {
    setShowModal(true);
    setSelectedEcoId(null);
    setSearchFilter("");
    setLoading(true);
    getOpenEcos()
      .then((res) => {
        setEcos(res.data || []);
      })
      .catch(() => {
        toast.error("Failed to load ECOs");
        setEcos([]);
      })
      .finally(() => setLoading(false));
  };

  const handleConfirm = () => {
    if (!selectedEcoId) return;
    setSubmitting(true);
    addItemToEco(selectedEcoId, app, itemId)
      .then(() => {
        toast.success(`Added ${itemName || "item"} to ECO-${selectedEcoId}`);
        setShowModal(false);
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        if (err?.response?.status === 409) {
          toast.warning("This item is already in the selected ECO.");
        } else if (err?.response?.status === 400) {
          toast.error(
            err?.response?.data || "Cannot modify a released ECO."
          );
        } else {
          toast.error("Failed to add item to ECO.");
        }
      })
      .finally(() => setSubmitting(false));
  };

  const filteredEcos = ecos.filter((eco) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      String(eco.id).includes(q) ||
      (eco.display_name || "").toLowerCase().includes(q) ||
      (eco.project_name || "").toLowerCase().includes(q)
    );
  });

  const triggerButton =
    variant === "inline" ? (
      <span
        className="info-card__icon-link"
        onClick={handleOpen}
        style={{ cursor: "pointer" }}
      >
        <img src="../../static/icons/circle-plus.svg" alt="Add to ECO" />
        Add to ECO
      </span>
    ) : (
      <button
        type="button"
        className="btn btn-bg-transparent"
        onClick={handleOpen}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/circle-plus.svg"
            alt="Add to ECO"
          />
          <span className="btn-text">Add to ECO</span>
        </div>
      </button>
    );

  return (
    <>
      {triggerButton}

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Add to ECO"
        size="md"
      >
        <div>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Search ECOs by name, ID, or project..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />

          {loading ? (
            <div className="d-flex justify-content-center p-4">
              <div className="spinner-border" role="status" />
            </div>
          ) : filteredEcos.length === 0 ? (
            <div className="text-muted text-center p-4">
              {ecos.length === 0
                ? "No open ECOs found. Create an ECO first."
                : "No ECOs match your search."}
            </div>
          ) : (
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {filteredEcos.map((eco) => (
                <div
                  key={eco.id}
                  onClick={() => setSelectedEcoId(eco.id)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    borderLeft:
                      selectedEcoId === eco.id
                        ? "3px solid #165216"
                        : "3px solid transparent",
                    backgroundColor:
                      selectedEcoId === eco.id ? "#f9fafb" : "transparent",
                    borderBottom: "1px solid #E5E5E5",
                    transition: "background-color 0.1s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEcoId !== eco.id) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEcoId !== eco.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center" style={{ gap: "8px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor: getPillColor(eco.release_state),
                          color: getTextColor(eco.release_state),
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ECO-{eco.id}
                      </span>
                      <span style={{ fontWeight: "500" }}>
                        {eco.display_name || "Untitled"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#888",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {eco.affected_items_count} item
                      {eco.affected_items_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {eco.project_name && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#888",
                        marginTop: "2px",
                        marginLeft: "3px",
                      }}
                    >
                      {eco.project_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="d-flex justify-content-end mt-3" style={{ gap: "8px" }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm dokuly-bg-primary text-white"
              onClick={handleConfirm}
              disabled={!selectedEcoId || submitting}
              style={{ fontWeight: 600 }}
            >
              {submitting ? "Adding..." : "Add to ECO"}
            </button>
          </div>
        </div>
      </DokulyModal>
    </>
  );
};

export default AddToEcoButton;
