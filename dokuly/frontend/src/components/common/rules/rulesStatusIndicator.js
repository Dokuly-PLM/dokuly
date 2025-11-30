import React, { useEffect, useState } from "react";
import { checkAssemblyRules, checkPcbaRules, checkPartRules, checkDocumentRules, checkEcoRules } from "./queries";

/**
 * Component to display rules validation status
 * Shows status circles indicating whether rules are passed or not
 * 
 * @param {string} itemType - Type of item: 'assembly', 'pcba', 'part', 'document'
 * @param {number} itemId - ID of the item to check
 * @param {number} projectId - Project ID (optional, will use org rules if not provided)
 * @param {function} onStatusChange - Optional callback when rules status changes
 * @param {function} setOverride - Callback to set override state in parent component
 */
const RulesStatusIndicator = ({ itemType, itemId, projectId = null, onStatusChange, setOverride }) => {
  const [loading, setLoading] = useState(true);
  const [rulesStatus, setRulesStatus] = useState(null);

  useEffect(() => {
    if (itemId) {
      checkRules();
    }
  }, [itemId, itemType, projectId]);

  const checkRules = () => {
    setLoading(true);
    
    let checkFunction;
    switch (itemType) {
      case 'assembly':
        checkFunction = checkAssemblyRules;
        break;
      case 'pcba':
        checkFunction = checkPcbaRules;
        break;
      case 'part':
        checkFunction = checkPartRules;
        break;
      case 'document':
        checkFunction = checkDocumentRules;
        break;
      case 'eco':
        checkFunction = checkEcoRules;
        break;
      default:
        console.error(`Unknown item type: ${itemType}`);
        setLoading(false);
        return;
    }

    checkFunction(itemId, projectId)
      .then((res) => {
        if (res.status === 200 && res.data) {
          setRulesStatus(res.data);
          if (onStatusChange) {
            onStatusChange(res.data);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error checking rules:", err);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="mt-3">
        <small className="text-muted">Checking rules...</small>
      </div>
    );
  }

  if (!rulesStatus) {
    return null;
  }

  // If no rules are active, don't show anything
  if (!rulesStatus.has_active_rules) {
    return null;
  }

  const handleOverride = (checked) => {
    if (setOverride) {
      setOverride(checked);
    }
  };

  return (
    <div className="mt-3 p-3 border rounded bg-light">
      <h6 className="mb-3">Active Rules</h6>
      
      {rulesStatus.rules_checks && rulesStatus.rules_checks.map((check, index) => (
        <div key={index} className="d-flex align-items-center mb-2">
          <div 
            className="me-3"
            style={{ 
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: check.passed ? 'green' : '#FF5733',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            {check.passed ? '✓' : '!'}
          </div>
          <div style={{ width: '10px' }} />
          <small style={{ color: '#6c757d' }}>
            {check.description}</small>
        </div>
      ))}

      {!rulesStatus.all_rules_passed && (
        <div className="alert alert-warning mt-3 mb-0" role="alert">
          <small>
            {rulesStatus.can_override ? (
              <div className="d-flex align-items-center">
                <input
                  className="form-check-input dokuly-checkbox me-2"
                  type="checkbox"
                  onChange={(e) => handleOverride(e.target.checked)}
                  id="override-rules-checkbox"
                />
                <label className="form-check-label mb-0" htmlFor="override-rules-checkbox">
                  <strong>Override rules</strong> and allow release anyway
                </label>
              </div>
            ) : (
              <span>
                <strong>Note:</strong> {rulesStatus.override_permission} or higher can override these rules during release.
              </span>
            )}
          </small>
        </div>
      )}
    </div>
  );
};

export default RulesStatusIndicator;
