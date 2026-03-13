import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { OverlayTrigger, Popover } from "react-bootstrap";
import {
  addIssueToAffectedItem,
  removeIssueFromAffectedItem,
  searchIssues,
} from "../functions/queries";

const getIssuePillColor = (issue) => {
  if (issue.criticality === "Critical") {
    return "red";
  }
  if (issue.criticality === "High") {
    return "#f6c208ff";
  }
  return "#54a4daff"; // Low / default
};

const getIssuePillTextColor = (issue) => {
  if (issue.criticality === "Critical") return "white";
  if (issue.criticality === "High") return "#333";
  return "white";
};

const IssuePills = ({ issues = [], affectedItemId, readOnly = false, onRefresh }) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowAddInput(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      setSearching(true);
      searchIssues(query)
        .then((res) => {
          if (res.status === 200) {
            // Filter out already-attached issues
            const existingIds = new Set(issues.map((i) => i.id));
            setSearchResults(
              res.data.filter((i) => !existingIds.has(i.id))
            );
          }
        })
        .catch(() => {
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    }, 300);
  };

  const handleAddIssue = (issueId) => {
    addIssueToAffectedItem(affectedItemId, issueId)
      .then((res) => {
        if (res.status === 200) {
          onRefresh();
          setSearchQuery("");
          setSearchResults([]);
          setShowAddInput(false);
        }
      })
      .catch(() => toast.error("Failed to add issue"));
  };

  const handleRemoveIssue = (e, issueId) => {
    e.stopPropagation();
    removeIssueFromAffectedItem(affectedItemId, issueId)
      .then((res) => {
        if (res.status === 200) {
          onRefresh();
        }
      })
      .catch(() => toast.error("Failed to remove issue"));
  };

  const handlePillClick = (e, issueId) => {
    if (e.ctrlKey || e.metaKey) {
      window.open(`#/issues/${issueId}`, "_blank");
    }
  };

  // Sort: open issues first, then closed
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.is_closed !== b.is_closed) return a.is_closed ? 1 : -1;
    return a.id - b.id;
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
      {sortedIssues.map((issue) => (
        <OverlayTrigger
          key={issue.id}
          trigger={["hover", "focus"]}
          placement="top"
          delay={{ show: 300, hide: 100 }}
          overlay={
            <Popover id={`issue-peek-${issue.id}`}>
              <Popover.Body>
                <div style={{ minWidth: "250px", maxWidth: "350px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                    #{issue.id}: {issue.title || "Untitled"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "#666",
                      marginBottom: "8px",
                      borderLeft: `2px solid ${getIssuePillColor(issue)}`,
                      paddingLeft: "8px",
                    }}
                  >
                    {issue.criticality || "Low"} criticality
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#888" }}>
                    <span>
                      <strong>Status:</strong> {issue.is_closed ? "Closed" : "Open"}
                    </span>
                  </div>
                </div>
              </Popover.Body>
            </Popover>
          }
        >
        <div
          onClick={(e) => handlePillClick(e, issue.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            backgroundColor: getIssuePillColor(issue),
            color: getIssuePillTextColor(issue),
            opacity: issue.is_closed ? 0.6 : 1,
            textDecoration: issue.is_closed ? "line-through" : "none",
            whiteSpace: "nowrap",
          }}
        >
          #{issue.id}
          {!readOnly && !issue.is_closed && (
            <span
              onClick={(e) => handleRemoveIssue(e, issue.id)}
              title="Remove from ECO"
              style={{
                marginLeft: "2px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "14px",
                lineHeight: 1,
                opacity: 0.8,
              }}
            >
              ×
            </span>
          )}
        </div>
        </OverlayTrigger>
      ))}

      {/* Add issue button/input */}
      {!readOnly && (
        <div ref={dropdownRef} style={{ position: "relative" }}>
          {!showAddInput ? (
            <button
              type="button"
              onClick={() => setShowAddInput(true)}
              title="Add issue"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                border: "1px dashed #adb5bd",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                color: "#6c757d",
                padding: 0,
                lineHeight: 1,
              }}
            >
              +
            </button>
          ) : (
            <div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="#id or title..."
                style={{
                  width: "130px",
                  fontSize: "12px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowAddInput(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 1000,
                    backgroundColor: "white",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    minWidth: "200px",
                    marginTop: "2px",
                  }}
                >
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleAddIssue(result.id)}
                      style={{
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f5f5f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "white")
                      }
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: getIssuePillColor(result),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>#{result.id}</span>
                      <span
                        style={{
                          color: "#6c757d",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {result.title || ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {searching && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    padding: "6px 10px",
                    fontSize: "12px",
                    color: "#6c757d",
                    backgroundColor: "white",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    marginTop: "2px",
                  }}
                >
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssuePills;
