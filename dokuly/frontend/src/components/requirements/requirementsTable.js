import React, { useState, useRef, useEffect } from "react";
import { Col, Form, Row, OverlayTrigger, Popover } from "react-bootstrap";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import {
  createSubRequirement,
  editRequirement,
  createRequirement,
} from "./functions/queries";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import GenericDropdownSelector from "../dokuly_components/dokulyTable/components/genericDropdownSelector";
import TextFieldEditor from "../dokuly_components/dokulyTable/components/textFieldEditor";
import {
  REQRUIREMENT_STATES,
  REQUIREMENT_TYPES,
  VERIFICATION_CLASSES,
} from "./modelConstants";
import DokulyTags from "../dokuly_components/dokulyTags/dokulyTags";
import AddButton from "../dokuly_components/AddButton";
import CheckBox from "../dokuly_components/checkBox";
import { DEFAULT_REQUIREMENT_SET_SETTINGS } from "./modelConstants";
import { renderExternalId } from "./functions/externalIdUtils";

const RequirementsTable = ({
  requirements = [],
  set_id = -1,
  parent_requirement_id = -1,
  readOnly = false,
  setRefresh,
  refresh,
  profile,
  requirementSetSettings = DEFAULT_REQUIREMENT_SET_SETTINGS,
}) => {
  const navigate = useNavigate();
  const [tableTextSize, setTableTextSize] = useState("14px");

  const TYPE_OPTIONS = REQUIREMENT_TYPES.map((type) => ({
    value: type,
    label: type,
  }));
  const VERIFICATION_CLASS_OPTIONS = VERIFICATION_CLASSES.map((vc) => ({
    value: vc,
    label: vc,
  }));
  const STATE_OPTIONS = REQRUIREMENT_STATES.map((state) => ({
    value: state?.state,
    label: state?.state,
  }));

  function hide_verification_cells(requirement) {
    return (requirement?.superseded_by !== null || 
      requirement?.state === "Rejected"
      // TODO hide for reqs. with subrequirements 
    );
  }


  const [showRejected, setShowRejected] = useState(false);
  const [showSuperseded, setShowSuperseded] = useState(false);

  const filteredRequirements = requirements.filter((req) => {
    if (!showRejected && req.state === "Rejected") {
      return false;
    }
    if (!showSuperseded && req.superseded_by !== null) {
      return false;
    }
    return true;
  });


  const renderFilters = (
    <div 
      className="d-flex align-items-center gap-3"
      style={{ gap: "1.5rem" }}
    >
      <CheckBox
        id="showRejected"
        checked={showRejected}
        onChange={(e) => setShowRejected(e.target.checked)}
        label="Show rejected requirements"
        divClassName="me-3"
      />
      <CheckBox
        id="showSuperseded"
        checked={showSuperseded}
        onChange={(e) => setShowSuperseded(e.target.checked)}
        label="Show superseded requirements"
      />
    </div>
  );

  const handleAddClick = () => {
    if (parent_requirement_id !== -1) {
      createSubRequirement(parent_requirement_id, set_id).then(
        (result) => {
          if (result.status === 201) {
            toast.success("Subrequirement created");
            setRefresh(true); // Set refresh to trigger a re-fetch or update
          }
        },
        (error) => {
          toast.error(error); // Handle error
        }
      );
    } else if (set_id !== -1) {
      createRequirement(set_id).then(
        (result) => {
          if (result.status === 201) {
            toast.success("Subrequirement created");
            setRefresh(true); // Set refresh to trigger a re-fetch or update
          }
        },
        (error) => {
          toast.error(error); // Handle error
        }
      );
    }
  };

  const changeField = (id, key, value) => {
    if (id == null || value == null || key == null) {
      return;
    }

    if (key === "external_requirement_id") {
      const normalizedValue = value.trim().toLowerCase();
      if (normalizedValue) {
        const duplicateExists = requirements.some(
          (req) =>
            req.id !== id &&
            (req.external_requirement_id || "").trim().toLowerCase() === normalizedValue
        );
        if (duplicateExists) {
          toast.warning(
            "Warning: This external requirement ID already exists in this requirement set."
          );
        }
      }
    }

    const data = { [key]: value };
    editRequirement(id, data).then(
      (result) => {
        if (result.status === 200) {
          setRefresh(true);
        }
      },
      (error) => {
        const message = error?.response?.data || error?.message || error;
        if (
          error?.response?.status === 400 &&
          typeof message === "string" &&
          message.includes("External requirement ID already exists")
        ) {
          toast.warning(message);
          return;
        }
        toast.error(message);
      }
    );
  };

  const rowEvents = (rowIndex, row) => {
    if (event.ctrlKey || event.metaKey) {
      window.open(`/#/requirement/${row.id}`);
    } else {
      //window.location.href = `/#/requirement/${row.id}`;
    }
  };

  const onNavigate = (row) => {
    if (row.id === null || row.id === -1) {
      return;
    }
    navigate(`/requirement/${row.id}`);
  };

  const columns = [
    {
      key: "id", // Some ID to be created upon requirement creation.
      header: "ID",
      maxWidth: "35px",
      formatter: (row) => {
        return (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/requirement/${row.id}`)}
          >
            {row.id}
          </div>
        );
      },
      csvFormatter: (row) => (row?.id ? `${row?.id}` : ""),
    },
    {
      key: "external_requirement_id",
      header: "External ID",
      maxWidth: "140px",
      formatter: (row) => {
        const fullId = row?.external_requirement_id || "";
        const isLocked = readOnly || row?.state === "Rejected" || row?.state === "Approved";

        // Inline component so we can use hooks for edit toggling + width measurement
        const ColoredExternalIdCell = () => {
          const [editing, setEditing] = useState(false);
          const [value, setValue] = useState(fullId);
          const [maxChars, setMaxChars] = useState(null);
          const inputRef = useRef(null);
          const containerRef = useRef(null);

          // ~7px per monospace char at default font size
          const CHAR_WIDTH_PX = 7;

          useEffect(() => { setValue(fullId); }, []);
          useEffect(() => {
            if (!containerRef.current) return;
            const observer = new ResizeObserver(([entry]) => {
              const width = entry.contentRect.width;
              setMaxChars(Math.max(3, Math.floor(width / CHAR_WIDTH_PX)));
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
          }, []);
          useEffect(() => {
            if (editing && inputRef.current) {
              inputRef.current.focus();
              const len = inputRef.current.value.length;
              inputRef.current.setSelectionRange(len, len);
            }
          }, [editing]);

          const commit = () => {
            changeField(row.id, "external_requirement_id", value);
            setEditing(false);
          };

          if (editing) {
            return (
              <input
                ref={inputRef}
                className="input-edit"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") { setValue(fullId); setEditing(false); }
                }}
                style={{ maxWidth: "130px" }}
              />
            );
          }

          return (
            <OverlayTrigger
              trigger={["hover", "focus"]}
              placement="top"
              overlay={
                fullId ? (
                  <Popover id={`ext-id-popover-${row.id}`} style={{ maxWidth: "none" }}>
                    <Popover.Body style={{ padding: "6px 10px" }}>
                      <span style={{ fontFamily: "monospace", whiteSpace: "nowrap", display: "block" }}>
                        {renderExternalId(fullId)}
                      </span>
                    </Popover.Body>
                  </Popover>
                ) : <></>
              }
              delay={{ show: 200, hide: 100 }}
            >
              <span
                ref={containerRef}
                style={{ whiteSpace: "nowrap", fontFamily: "monospace", cursor: isLocked ? "default" : "pointer", display: "block", overflow: "hidden" }}
                onClick={() => !isLocked && setEditing(true)}
              >
                {fullId
                  ? renderExternalId(fullId, { maxChars: maxChars ?? 9999 })
                  : <span style={{ color: "#D1D5DB" }}>—</span>}
              </span>
            </OverlayTrigger>
          );
        };

        return <ColoredExternalIdCell />;
      },
      csvFormatter: (row) =>
        row?.external_requirement_id ? `${row?.external_requirement_id}` : "",
    },
    {
      key: "parent_requirement",
      header: "Parent",
      formatter: (row) => {
        return (
          <div
            style={{ cursor: "pointer" }}
            onClick={() =>
              navigate(`/requirement/${row.parent_requirement || ""}`)
            }
          >
            {row.parent_requirement ? row.parent_requirement : "-"}
          </div>
        );
      },
      csvFormatter: (row) =>
        row?.parent_requirement ? `${row?.parent_requirement}` : "",
      defaultShowColumn: false,
    },
    {
      key: "derived_from",
      header: "Derived From",
      formatter: (row) => {
        const derivedFrom =
          row.derived_from && Array.isArray(row.derived_from)
            ? row.derived_from.join(", ")
            : "-";

        return (
          <div
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/requirement/${derivedFrom || ""}`)}
          >
            {derivedFrom}
          </div>
        );
      },
      csvFormatter: (row) => {
        return row?.derived_from && Array.isArray(row.derived_from)
          ? row.derived_from.join(", ")
          : "-";
      },
      defaultShowColumn: false,
    },
    {
      key: "type",
      header: "Type",
      formatter: (row) => {
        return (
          <GenericDropdownSelector
            state={row?.type}
            setState={(newVal) => changeField(row.id, "type", newVal)}
            dropdownValues={TYPE_OPTIONS}
            textSize={tableTextSize}
            placeholder="Select"
            borderIfPlaceholder={true}
            readOnly={readOnly || row?.state === "Rejected" || row?.state === "Approved"}
          />
        );
      },
      csvFormatter: (row) => (row?.type ? `${row?.type}` : ""),
      defaultShowColumn: false,
    },
    {
      key: "obligation_level",
      header: "Obligation",
      maxWidth: "65px",
      formatter: (row) => {
        return (
          <GenericDropdownSelector
            state={row?.obligation_level}
            setState={(newVal) =>
              changeField(row.id, "obligation_level", newVal)
            }
            dropdownValues={[
              { value: "Shall", label: "Shall" },
              { value: "Should", label: "Should" },
            ]}
            textSize={tableTextSize}
            placeholder="Select"
            borderIfPlaceholder={true}
            readOnly={readOnly || row?.state === "Rejected" || row?.state === "Approved"}
          />
        );
      },
      csvFormatter: (row) =>
        row?.obligation_level ? `${row?.obligation_level}` : "",
    },
    {
      key: "state",
      header: "State",
      maxWidth: "70px",
      formatter: (row) => {
        return (
          <GenericDropdownSelector
            state={row?.state}
            setState={(newVal) => changeField(row.id, "state", newVal)}
            dropdownValues={STATE_OPTIONS}
            textSize={tableTextSize}
            placeholder="Select"
            borderIfPlaceholder={true}
            readOnly={readOnly}
          />
        );
      },
      csvFormatter: (row) => (row?.state ? `${row?.state}` : ""),
    },
    {
      key: "tags",
      header: "Tags",
      maxWidth: "140px",
      searchValue: (row) => {
        const tags = row?.tags ?? [];
        return tags?.length > 0 ? tags.map((tag) => tag.name).join(" ") : "";
      },
      formatter: (row) => {
        return <DokulyTags tags={row?.tags ?? []} readOnly={true} />;
      },
      csvFormatter: (row) => (row?.tags ? row.tags : ""),
      defaultShowColumn: true,
    },
    {
      key: "rationale",
      header: "Rationale",
      //maxWidth: "70px",
      formatter: (row, column, searchString) => (
        <TextFieldEditor
          text={row?.rationale}
          setText={(newText) => changeField(row.id, "rationale", newText)}
          multiline={true}
          searchString={searchString}
          readOnly={readOnly || row?.state === "Rejected" || row?.state === "Approved"}
        />
      ),
      csvFormatter: (row) => (row?.rationale ? `${row?.rationale}` : ""),
      defaultShowColumn: false,
    },
    {
      key: "statement",
      header: "Statement ",
      formatter: (row, column, searchString) => (
        <TextFieldEditor
          text={row?.statement}
          setText={(newText) => changeField(row.id, "statement", newText)}
          multiline={true}
          searchString={searchString}
          readOnly={readOnly || row?.state === "Rejected" || row?.state === "Approved"}
        />
      ),
      csvFormatter: (row) => {
        return row.statement ? row.statement : "";
      },
    },
    {
      key: "verification_class",
      header: "Verification",
      maxWidth: "70px",
      formatter: (row) => {
        return hide_verification_cells(row) ? null : (
          <GenericDropdownSelector
            state={row?.verification_class}
            setState={(newVal) =>
              changeField(row.id, "verification_class", newVal)
            }
            dropdownValues={VERIFICATION_CLASS_OPTIONS}
            textSize={tableTextSize}
            placeholder="Select"
            borderIfPlaceholder={true}
            readOnly={readOnly || row?.state === "Rejected" || row?.state === "Approved"}
          />
        );
      },
      csvFormatter: (row) =>(
        hide_verification_cells(row) 
          ? "" 
          : (row?.verification_class ? `${row?.verification_class}` : "")
      ),
    },
    {
      key: "is_verified",
      header: "Verification Status",
      maxWidth: "70px",
      formatter: (row) => {
        return hide_verification_cells(row) ? null : (
            <Col className="d-flex align-items-center justify-content-center">
            <Form.Group>
              <span
                title="Open the requirement to add verification documentation and sign off verification."
                style={{ display: "inline-block" }}
              >
              <Form.Check
                type="checkbox"
                id={row?.id}
                className="dokuly-checkbox"
                checked={row?.is_verified}
                disabled={readOnly}
                onChange={(e) => {
                  const data = {
                    is_verified: e.target.checked,
                    verified_by: profile?.id,
                  };
                  editRequirement(id, data).then(
                    (res) => {
                      if (res.status === 200) {
                        setRefresh(true);
                      }
                    },
                    (error) => {
                      toast.error(error);
                    }
                  );
                }}
              />
              </span>
            </Form.Group>
          </Col>
        )
      },
      csvFormatter: (row) => (
        hide_verification_cells(row) 
          ? "" 
          : (row?.is_verified ? "Verified" : "Not Verified")
      ),
    },
    {
      key: "verification_method",
      header: "Verification Method",
      formatter: (row, column, searchString) => {
        return hide_verification_cells(row) ? null : (
          <TextFieldEditor
            text={row?.verification_method}
            setText={(newText) =>
              changeField(row.id, "verification_method", newText)
            }
            multiline={true}
            searchString={searchString}
            readOnly={readOnly}
          />
        )
      },
      csvFormatter: (row) => (
        hide_verification_cells(row) 
          ? "" 
          : (row?.verification_method ? `${row?.verification_method}` : "")
      ),
      defaultShowColumn: false,
    },
    {
      key: "verification_results",
      header: "Verification Results",
      formatter: (row, column, searchString) => {
        return hide_verification_cells(row) ? null : (
          <TextFieldEditor
            text={row?.verification_results}
            setText={(newText) =>
              changeField(row.id, "verification_results", newText)
            }
            multiline={true}
            searchString={searchString}
            readOnly={readOnly}
          />
        );
      },
      csvFormatter: (row) =>(
        hide_verification_cells(row)
          ? "" 
          : (row?.verification_results ? `${row?.verification_results}` : "")
      ),
      defaultShowColumn: false,
    },
  ];

  const allColumns = [
    { key: "id", col: columns.find((c) => c.key === "id") },
    { key: "external_requirement_id", col: columns.find((c) => c.key === "external_requirement_id"), setting: "external_requirement_id_is_enabled" },
    { key: "parent_requirement", col: columns.find((c) => c.key === "parent_requirement"), setting: "hierarchical_requirements_is_enabled" },
    { key: "derived_from", col: columns.find((c) => c.key === "derived_from"), setting: "derived_from_enabled" },
    { key: "type", col: columns.find((c) => c.key === "type"), setting: "requirement_type_is_enabled" },
    { key: "obligation_level", col: columns.find((c) => c.key === "obligation_level") },
    { key: "state", col: columns.find((c) => c.key === "state") },
    { key: "tags", col: columns.find((c) => c.key === "tags") },
    { key: "rationale", col: columns.find((c) => c.key === "rationale") },
    { key: "statement", col: columns.find((c) => c.key === "statement") },
    { key: "verification_class", col: columns.find((c) => c.key === "verification_class"), setting: "verification_class_is_enabled" },
    { key: "is_verified", col: columns.find((c) => c.key === "is_verified") },
    { key: "verification_method", col: columns.find((c) => c.key === "verification_method"), setting: "verification_method_markdown_is_enabled" },
    { key: "verification_results", col: columns.find((c) => c.key === "verification_results"), setting: "verification_results_markdown_is_enabled" },
  ];

  const visibleColumns = allColumns
    .filter(({ setting }) => !setting || requirementSetSettings[setting] !== false)
    .map(({ col }) => col)
    .filter(Boolean);

  return (
    <React.Fragment>
      {!readOnly && (
        <Row>
          <AddButton
            buttonText={
              parent_requirement_id === -1
                ? "Add requirement"
                : "Add subrequirement"
            }
            disabled={false}
            onClick={handleAddClick}
            style={{ paddingLeft: "30px" }}
          />
        </Row>
      )}

      {filteredRequirements.length > 0 && (
        <Row>
          <DokulyTable
            key={`RequirementsTable-${readOnly}`} // Force rerender to ensure readOnly state is updated
            tableName="RequirementsTable"
            data={filteredRequirements}
            columns={visibleColumns}
            itemsPerPage={50}
            onRowClick={rowEvents}
            defaultSort={{ columnNumber: 0, order: "asc" }}
            navigateColumn={true}
            onNavigate={onNavigate}
            showColumnSelector={true}
            renderChildrenNextToSearch={renderFilters}
            textSize={tableTextSize}
            setTextSize={setTableTextSize}
            showTableSettings={true}
          />
        </Row>
      )}
    </React.Fragment>
  );
};

export default RequirementsTable;
