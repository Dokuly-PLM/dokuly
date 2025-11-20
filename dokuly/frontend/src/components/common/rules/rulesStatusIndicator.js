import React, { useEffect, useState } from "react";
import { checkAssemblyRules, checkPcbaRules, checkPartRules, checkDocumentRules } from "./queries";

/**
 * Component to display rules validation status
 * Shows status circles indicating whether rules are passed or not
 * 
 * @param {string} itemType - Type of item: 'assembly', 'pcba', 'part', 'document'
 * @param {number} itemId - ID of the item to check
 * @param {number} projectId - Project ID (optional, will use org rules if not provided)
 * @param {function} onStatusChange - Optional callback when rules status changes
 */
const RulesStatusIndicator = ({ itemType, itemId, projectId = null, onStatusChange }) => {
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
            <strong>Note:</strong> {rulesStatus.override_permission} or higher can override these rules during release.
          </small>
        </div>
      )}
    </div>
  );
};

export default RulesStatusIndicator;
