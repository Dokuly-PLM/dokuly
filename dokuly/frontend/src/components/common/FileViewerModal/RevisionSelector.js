import React, { useState, useEffect } from "react";
import { getRevisions } from "../bom/functions/queries";
import { toast } from "react-toastify";
import GenericDropdownSelector from "../../dokuly_components/dokulyTable/components/genericDropdownSelector";

export default function RevisionSelector({
  parentEntityType,
  parentEntityId,
  currentEntityId,
  onRevisionSelect,
}) {
  const [revisions, setRevisions] = useState([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize entity type to plural lowercase (e.g., "Part" -> "parts", "PCBA" -> "pcbas")
  const normalizeEntityType = (type) => {
    if (!type) return type;
    const lower = type.toLowerCase();
    // Map singular/capitalized forms to plural API endpoints
    const mapping = {
      "part": "parts",
      "parts": "parts",
      "pcba": "pcbas",
      "pcbas": "pcbas",
      "assembly": "assemblies",
      "assemblies": "assemblies",
      "document": "documents",
      "documents": "documents",
    };
    return mapping[lower] || lower;
  };

  useEffect(() => {
    if (parentEntityType && parentEntityId) {
      setLoading(true);
      const normalizedEntityType = normalizeEntityType(parentEntityType);
      getRevisions(normalizedEntityType, parentEntityId)
        .then((data) => {
          if (Array.isArray(data)) {
            // Filter out current revision and archived revisions
            const filteredRevisions = data.filter(
              (rev) => rev.id !== currentEntityId && !rev.is_archived
            );
            setRevisions(filteredRevisions);
          } else {
            console.error("Unexpected response format:", data);
            toast.error("Failed to load revisions: Invalid response format.");
          }
          setLoading(false);
        })
        .catch((error) => {
          const normalizedEntityType = normalizeEntityType(parentEntityType);
          console.error("Error fetching revisions:", error);
          console.error("Error details:", {
            message: error?.message,
            response: error?.response,
            status: error?.response?.status,
            data: error?.response?.data,
            originalParentEntityType: parentEntityType,
            normalizedEntityType: normalizedEntityType,
            parentEntityId,
          });
          let errorMessage = "Failed to load revisions.";
          if (error?.response?.status === 404) {
            errorMessage = "Revisions endpoint not found. This entity may not support revisions.";
          } else if (error?.response?.status === 403) {
            errorMessage = "You don't have permission to view revisions.";
          } else if (error?.response?.status === 401) {
            errorMessage = "Your session has expired. Please log in again.";
          } else if (error?.response?.data) {
            errorMessage = `Failed to load revisions: ${JSON.stringify(error.response.data)}`;
          } else if (error?.message) {
            errorMessage = `Failed to load revisions: ${error.message}`;
          }
          toast.error(errorMessage);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [parentEntityType, parentEntityId, currentEntityId]);

  const handleRevisionSelect = (revisionId) => {
    setSelectedRevisionId(revisionId);
    if (revisionId && onRevisionSelect) {
      const selectedRevision = revisions.find((r) => r.id === revisionId);
      if (selectedRevision) {
        onRevisionSelect(selectedRevision);
      }
    }
  };
  
  // Format revisions for dropdown
  const revisionOptions = revisions.map((revision) => ({
    label: `${revision.formatted_revision || revision.revision || `Rev ${revision.id}`}${revision.is_latest_revision ? " (Latest)" : ""}`,
    value: revision.id,
  }));

  if (loading) {
    return <div style={{ fontSize: "12px", color: "#666" }}>Loading revisions...</div>;
  }

  if (revisions.length === 0) {
    return <div style={{ fontSize: "12px", color: "#666" }}>No other revisions available for comparison.</div>;
  }

  return (
    <GenericDropdownSelector
      state={selectedRevisionId}
      setState={handleRevisionSelect}
      dropdownValues={revisionOptions.length > 0 ? revisionOptions : [
        { 
          label: "No revisions available", 
          value: null,
          isDisabled: true
        }
      ]}
      placeholder="Select revision to compare"
      borderIfPlaceholder={true}
      textSize="12px"
    />
  );
}

