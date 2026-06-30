import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Row, Col } from "react-bootstrap";

import DokulySelect from "../../dokuly_components/dokulySelect";
import {
  searchRequirementReferenceDocuments,
  updateRequirementDocumentReferences,
} from "../functions/queries";

const toOption = (document) => ({
  value: document.id,
  label: [
    document.full_doc_number,
    document.title,
  ]
    .filter(Boolean)
    .join(" - "),
  document,
});

const RequirementDocumentReferenceSelector = ({
  requirement,
  readOnly = false,
  setRefresh = () => {},
  selectedDocumentId = null,
  onSelectReference = () => {},
}) => {
  const isStateLocked = ["Approved", "Rejected"].includes(requirement?.state);
  const [options, setOptions] = useState([]);
  const [selectedReferences, setSelectedReferences] = useState([]);

  const mappedSelectedReferences = useMemo(
    () =>
      (requirement?.statement_references || []).map((ref) =>
        ({
          id: ref.id,
          document_id: ref.document_id,
          full_doc_number: ref.full_doc_number,
          title: ref.title,
          page_number: ref.page_number,
        })
      ),
    [requirement?.statement_references]
  );

  useEffect(() => {
    setSelectedReferences(mappedSelectedReferences);
  }, [mappedSelectedReferences]);

  const fetchOptions = (query = "") => {
    if (!requirement?.id) {
      return;
    }

    searchRequirementReferenceDocuments(requirement.id, query)
      .then((res) => {
        if (res.status === 200) {
          const fetchedOptions = res.data.map(toOption);
          const selectedOptions = mappedSelectedReferences.map((ref) =>
            toOption({
              id: ref.document_id,
              full_doc_number: ref.full_doc_number,
              formatted_revision: ref.formatted_revision,
              title: ref.title,
            })
          );
          const merged = [...selectedOptions, ...fetchedOptions].filter(
            (option, index, arr) =>
              arr.findIndex((candidate) => candidate.value === option.value) === index
          );
          setOptions(merged);
        }
      })
      .catch((error) => {
        toast.error(
          error?.response?.data || error?.message || "Failed to search documents"
        );
      });
  };

  const persistReferences = (references) => {
    updateRequirementDocumentReferences(
      requirement.id,
      references.map((reference) => ({
        document_id: reference.document_id,
        page_number: reference.page_number,
      }))
    )
      .then((res) => {
        if (res.status === 200) {
          setRefresh(true);
        }
      })
      .catch((error) => {
        toast.error(
          error?.response?.data || error?.message || "Failed to update referenced documents"
        );
      });
  };

  const handleAddDocument = (selectedOption) => {
    if (!selectedOption) {
      return;
    }

    const alreadyAdded = selectedReferences.some(
      (reference) => reference.document_id === selectedOption.value
    );
    if (alreadyAdded) {
      return;
    }

    const nextReferences = [
      ...selectedReferences,
      {
        id: `new-${selectedOption.value}`,
        document_id: selectedOption.value,
        full_doc_number: selectedOption.document.full_doc_number,
        formatted_revision: selectedOption.document.formatted_revision,
        title: selectedOption.document.title,
        page_number: null,
      },
    ];
    setSelectedReferences(nextReferences);
    onSelectReference(nextReferences[nextReferences.length - 1]);
    persistReferences(nextReferences);
  };

  const handleRemoveDocument = (documentId) => {
    const nextReferences = selectedReferences.filter(
      (reference) => reference.document_id !== documentId
    );
    setSelectedReferences(nextReferences);
    persistReferences(nextReferences);
  };

  const handlePageNumberChange = (documentId, value) => {
    const nextReferences = selectedReferences.map((reference) =>
      reference.document_id === documentId
        ? {
            ...reference,
            page_number: value,
          }
        : reference
    );
    setSelectedReferences(nextReferences);
    if (selectedDocumentId === documentId) {
      const updatedReference = nextReferences.find(
        (reference) => reference.document_id === documentId
      );
      if (updatedReference) {
        onSelectReference(updatedReference);
      }
    }
  };

  const handlePageNumberBlur = (documentId) => {
    const nextReferences = selectedReferences.map((reference) => {
      if (reference.document_id !== documentId) {
        return reference;
      }

      const pageValue = reference.page_number;
      if (pageValue === "" || pageValue === null || pageValue === undefined) {
        return { ...reference, page_number: null };
      }

      const parsed = Number.parseInt(pageValue, 10);
      return {
        ...reference,
        page_number: Number.isNaN(parsed) ? null : parsed,
      };
    });
    setSelectedReferences(nextReferences);
    if (selectedDocumentId === documentId) {
      const updatedReference = nextReferences.find(
        (reference) => reference.document_id === documentId
      );
      if (updatedReference) {
        onSelectReference(updatedReference);
      }
    }
    persistReferences(nextReferences);
  };

  const renderDocumentLine = (reference) => {
    const segments = [
      reference.full_doc_number || "Unnamed document",
      reference.formatted_revision ? `Rev ${reference.formatted_revision}` : null,
      reference.title || "Untitled",
      reference.page_number ? `Page ${reference.page_number}` : "Page -",
    ].filter(Boolean);

    return segments.join(" | ");
  };

  return (
    <div>
      {!isStateLocked && (
        <DokulySelect
          value={null}
          options={options}
          onChange={handleAddDocument}
          onInputChange={(inputValue, actionMeta) => {
            if (actionMeta?.action === "input-change") {
              fetchOptions(inputValue);
            }
          }}
          onFocus={() => {
            if (options.length === 0) {
              fetchOptions("");
            }
          }}
          placeholder="Search documents to add"
          isDisabled={readOnly}
          isClearable
          noOptionsMessage={() => "Type to search documents"}
        />
      )}

      <div style={{ marginTop: "12px" }}>
        {selectedReferences.length === 0 ? (
          <small className="text-muted">No statement references added.</small>
        ) : (
          selectedReferences.map((reference) => (
            <div
              key={`${reference.document_id}-${reference.id}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectReference(reference)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectReference(reference);
                }
              }}
              style={{
                border:
                  selectedDocumentId === reference.document_id
                    ? "2px solid #1f6feb"
                    : "1px solid #e5e5e5",
                borderRadius: "4px",
                padding: "10px 12px",
                marginBottom: "8px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
            >
              <Row className="align-items-center g-2">
                <Col style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      color: "#222",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={renderDocumentLine(reference)}
                  >
                    {renderDocumentLine(reference)}
                  </div>
                </Col>
                <Col className="col-12 col-md-auto">
                  <div className="d-flex align-items-center justify-content-md-end gap-2">
                    <small className="text-muted">Page</small>
                    <input
                      className="form-control form-control-sm"
                      style={{ width: "92px" }}
                      type="number"
                      min="1"
                      value={reference.page_number ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        handlePageNumberChange(reference.document_id, e.target.value)
                      }
                      onBlur={() => handlePageNumberBlur(reference.document_id)}
                      disabled={readOnly}
                      placeholder="Optional"
                    />
                  </div>
                </Col>
                {!readOnly && (
                  <Col className="col-12 col-md-auto">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDocument(reference.document_id);
                      }}
                    >
                      Remove
                    </button>
                  </Col>
                )}
              </Row>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RequirementDocumentReferenceSelector;