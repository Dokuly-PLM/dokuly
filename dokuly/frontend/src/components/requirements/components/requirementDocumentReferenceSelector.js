import React, { useEffect, useMemo, useState, memo, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { Row, Col, Table } from "react-bootstrap";

import DokulySelect from "../../dokuly_components/dokulySelect";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";
import NumericFieldEditor from "../../dokuly_components/dokulyTable/components/numericFieldEditor";
import {
  searchRequirementReferenceDocuments,
  updateRequirementDocumentReferences,
} from "../functions/queries";

const toOption = (document) => ({
  value: document.id,
  label: [
    document.full_doc_number,
    document.formatted_revision ? `Rev ${document.formatted_revision}` : null,
    document.title,
  ]
    .filter(Boolean)
    .join(" - "),
  document,
});

const ReferenceTable = memo(({ selectedReferences, selectedDocumentId, readOnly, onSelectReference, onRemove, onPageSave }) => {
  if (selectedReferences.length === 0) {
    return <small className="text-muted">No references added.</small>;
  }
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: "4px", overflow: "hidden" }}>
      <Table className="mb-0" hover responsive>
        <thead>
          <tr>
            <th style={{ width: "96px" }} />
            <th>Document Number</th>
            <th>Title</th>
            <th style={{ width: "120px" }}>Page</th>
            {!readOnly && <th style={{ width: "120px" }} />}
          </tr>
        </thead>
        <tbody>
          {selectedReferences.map((reference) => (
            <tr
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
                cursor: "pointer",
                boxShadow:
                  selectedDocumentId === reference.document_id
                    ? "inset 0 0 0 2px #165216"
                    : "none",
              }}
            >
              <td>
                <ThumbnailFormatter thumbnail={reference.thumbnail} />
              </td>
              <td style={{ whiteSpace: "nowrap" }}>
                {reference.full_doc_number || "Unnamed"}
              </td>
              <td>{reference.title || "Untitled"}</td>
              <td onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                <NumericFieldEditor
                  number={reference.page_number ?? ""}
                  setNumber={(value) => onPageSave(reference.document_id, value)}
                  disabled={readOnly}
                />
              </td>
              {!readOnly && (
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(reference.document_id);
                    }}
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
});

const RequirementDocumentReferenceSelector = ({
  requirement,
  readOnly = false,
  setRefresh = () => {},
  selectedDocumentId = null,
  onSelectReference = () => {},
  referenceField = "statement_references",
  referenceType = "statement",
}) => {
  const [options, setOptions] = useState([]);
  const [selectedReferences, setSelectedReferences] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef(null);

  const mappedSelectedReferences = useMemo(
    () =>
      (requirement?.[referenceField] || []).map((ref) =>
        ({
          id: ref.id,
          document_id: ref.document_id,
          pdf_print_id: ref.pdf_print_id,
          full_doc_number: ref.full_doc_number,
          thumbnail: ref.thumbnail,
          formatted_revision: ref.formatted_revision,
          title: ref.title,
          page_number: ref.page_number,
        })
      ),
    [requirement, referenceField]
  );

  useEffect(() => {
    const prevIds = new Set(selectedReferences.map((r) => r.document_id));
    const newIds = new Set(mappedSelectedReferences.map((r) => r.document_id));
    const changed =
      prevIds.size !== newIds.size || [...newIds].some((id) => !prevIds.has(id));
    if (changed) {
      setSelectedReferences(mappedSelectedReferences);
    }
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
              thumbnail: ref.thumbnail,
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
      })),
      referenceType,
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

    // Skip if already in the list
    if (selectedReferences.some((r) => r.document_id === selectedOption.value)) {
      return;
    }

    const nextReferences = [
      ...selectedReferences,
      {
        id: `new-${selectedOption.value}`,
        document_id: selectedOption.value,
        pdf_print_id: selectedOption.document.pdf_print_id,
        full_doc_number: selectedOption.document.full_doc_number,
        thumbnail: selectedOption.document.thumbnail,
        formatted_revision: selectedOption.document.formatted_revision,
        title: selectedOption.document.title,
        page_number: null,
      },
    ];
    setSelectedReferences(nextReferences);
    setSearchInput("");
    setOptions([]);
    onSelectReference(nextReferences[nextReferences.length - 1]);
    persistReferences(nextReferences);
  };

  const handleRemoveDocument = useCallback((documentId) => {
    setSelectedReferences((prev) => {
      const next = prev.filter((r) => r.document_id !== documentId);
      persistReferences(next);
      return next;
    });
  }, [persistReferences]);

  const handlePageNumberSave = useCallback((documentId, value) => {
    const normalizedPageNumber = Number.isFinite(value) && value >= 1 ? value : null;
    setSelectedReferences((prev) => {
      const next = prev.map((r) =>
        r.document_id !== documentId ? r : { ...r, page_number: normalizedPageNumber }
      );
      if (selectedDocumentId === documentId) {
        const updated = next.find((r) => r.document_id === documentId);
        if (updated) onSelectReference(updated);
      }
      persistReferences(next);
      return next;
    });
  }, [persistReferences, selectedDocumentId, onSelectReference]);

  return (
    <div>
      {!readOnly && (
        <DokulySelect
          value={null}
          options={options}
          onChange={handleAddDocument}
          onInputChange={(inputValue, actionMeta) => {
            if (actionMeta?.action === "input-change") {
              setSearchInput(inputValue);
              setOptions([]);
              // Auto-search after 3+ characters with debounce
              if (debounceRef.current) clearTimeout(debounceRef.current);
              if (inputValue.trim().length >= 3) {
                debounceRef.current = setTimeout(() => {
                  fetchOptions(inputValue.trim());
                }, 350);
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const query = searchInput.trim();
              if (query.length === 0) {
                setOptions([]);
                return;
              }
              fetchOptions(query);
            }
          }}
          placeholder="Search documents"
          isDisabled={readOnly}
          isClearable
          noOptionsMessage={() => searchInput.trim().length >= 3 ? "No documents found" : "Type at least 3 characters to search"}
        />
      )}

      <div style={{ marginTop: "12px" }}>
        <ReferenceTable
          selectedReferences={selectedReferences}
          selectedDocumentId={selectedDocumentId}
          readOnly={readOnly}
          onSelectReference={onSelectReference}
          onRemove={handleRemoveDocument}
          onPageSave={handlePageNumberSave}
        />
      </div>
    </div>
  );
};

export default RequirementDocumentReferenceSelector;