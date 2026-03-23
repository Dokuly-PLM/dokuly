import React, { useState, useEffect, useRef } from "react";
import { suggestName } from "../../admin/functions/queries";

const NameSuggestion = ({ draftName, entityType, typeId, onApply, enabled }) => {
  const [suggestion, setSuggestion] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef(null);
  const lastRequestRef = useRef("");

  useEffect(() => {
    if (!enabled || !typeId || !draftName || draftName.length < 3) {
      setSuggestion(null);
      setExplanation("");
      return;
    }

    // Don't re-request if name hasn't changed
    if (draftName === lastRequestRef.current) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      lastRequestRef.current = draftName;
      setLoading(true);
      setError(false);

      suggestName({
        draft_name: draftName,
        entity_type: entityType,
        type_id: typeId,
      })
        .then((res) => {
          if (res.status === 200 && res.data) {
            setSuggestion(res.data.suggestion);
            setExplanation(res.data.explanation || "");
          } else {
            setSuggestion(null);
          }
        })
        .catch(() => {
          setSuggestion(null);
          setError(false); // silently fail
        })
        .finally(() => {
          setLoading(false);
        });
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draftName, entityType, typeId, enabled]);

  if (!enabled || !typeId) return null;

  if (loading) {
    return (
      <div className="mt-1 mb-2">
        <small className="text-muted">
          <span
            className="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
            style={{ width: "12px", height: "12px" }}
          />
          Getting name suggestion...
        </small>
      </div>
    );
  }

  if (!suggestion || suggestion === draftName) return null;

  return (
    <div className="mt-1 mb-2 p-2 border rounded" style={{ backgroundColor: "#f8f9fa", overflow: "hidden" }}>
      <small className="text-muted d-block">AI suggestion:</small>
      <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
        <strong style={{ fontSize: "0.95em" }}>{suggestion}</strong>
      </div>
      {explanation && (
        <small className="text-muted d-block mt-1" style={{ wordBreak: "break-word" }}>{explanation}</small>
      )}
      <button
        type="button"
        className="btn btn-sm btn-outline-primary mt-2"
        onClick={() => onApply(suggestion)}
      >
        Apply
      </button>
    </div>
  );
};

export default NameSuggestion;
