import React, { useEffect, useMemo, useState } from "react";
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

    if (selectedReferences[0]?.document_id === selectedOption.value) {
      return;
    }

    const nextReferences = [
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

  const handleRemoveDocument = (documentId) => {
    const nextReferences = selectedReferences.filter(
      (reference) => reference.document_id !== documentId
    );
    setSelectedReferences(nextReferences);
    persistReferences(nextReferences);
  };

  const handlePageNumberSave = (documentId, value) => {
    const normalizedPageNumber = Number.isFinite(value) && value >= 1 ? value : null;
    const nextReferences = selectedReferences.map((reference) => {
      if (reference.document_id !== documentId) {
        return reference;
      }
      return {
        ...reference,
        page_number: normalizedPageNumber,
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
          placeholder="Type to search, then press Enter"
          isDisabled={readOnly}
          isClearable
          noOptionsMessage={() => "Type and press Enter to search documents"}
        />
      )}

      <div style={{ marginTop: "12px" }}>
        {selectedReferences.length === 0 ? (
          <small className="text-muted">No references added.</small>
        ) : (
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
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
                        setNumber={(value) => handlePageNumberSave(reference.document_id, value)}
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
                            handleRemoveDocument(reference.document_id);
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
        )}
      </div>
    </div>
  );
};

export default RequirementDocumentReferenceSelector;