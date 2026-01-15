import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { pushToOdoo } from "../../admin/functions/queries";
import { fetchIntegrationSettings } from "../../admin/functions/queries";
import DokulyModal from "../../dokuly_components/dokulyModal";

/**
 * Reusable Push to Odoo button component
 * Shows button only if Odoo integration is enabled
 * For assemblies, shows a modal to ask if BOM should be included
 */
const PushToOdooButton = ({ itemType, itemId, itemName, onSuccess }) => {
  const [odooEnabled, setOdooEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);

  useEffect(() => {
    // Check if Odoo integration is enabled
    fetchIntegrationSettings()
      .then((res) => {
        if (res.status === 200 && res.data) {
          setOdooEnabled(res.data.odoo_enabled || false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching integration settings:", err);
        setLoading(false);
      });
  }, []);

  const handlePushClick = () => {
    if (itemType === "assemblies") {
      // Show modal to ask about BOM
      setShowBomModal(true);
    } else {
      // Direct push for parts and pcbas
      performPush(false);
    }
  };

  const performPush = (includeBom) => {
    setPushing(true);
    setShowBomModal(false);

    pushToOdoo(itemType, itemId, includeBom)
      .then((res) => {
        if (res.status === 200 && res.data.success) {
          const message = res.data.message || "Successfully pushed to Odoo";
          toast.success(message);
          
          // Show warning if BOM was not created due to missing components
          if (res.data.bom_not_created && res.data.missing_components && res.data.missing_components.length > 0) {
            const missingParts = res.data.missing_components.map(c => c.part_number).join(', ');
            const warningMsg = `BOM was not uploaded. The following components must be pushed to Odoo first: ${missingParts}`;
            toast.warning(warningMsg, { autoClose: 10000 });
          }
          
          if (onSuccess) {
            onSuccess(res.data);
          }
        } else {
          const errorMsg = res.data.message || "Failed to push to Odoo";
          toast.error(errorMsg);
        }
      })
      .catch((err) => {
        console.error("Error pushing to Odoo:", err);
        const errorMsg = 
          err.response?.data?.error || 
          err.response?.data?.message || 
          "Failed to push to Odoo";
        toast.error(errorMsg);
      })
      .finally(() => {
        setPushing(false);
      });
  };

  // Don't render if Odoo is not enabled or still loading
  if (loading || !odooEnabled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-bg-transparent"
        onClick={handlePushClick}
        disabled={pushing}
      >
        <div className="row">
          <img
            className="icon-dark"
            src="../../static/icons/upload.svg"
            alt="Push to Odoo"
          />
          <span className="btn-text">
            {pushing ? "Pushing..." : "Push to Odoo"}
          </span>
        </div>
      </button>

      {/* BOM Modal for assemblies */}
      <DokulyModal
        show={showBomModal}
        onHide={() => setShowBomModal(false)}
        title="Push Assembly to Odoo"
        size="md"
      >
        <div className="p-4">
          <p className="mb-3">
            Do you want to include the Bill of Materials (BOM) when pushing <strong>{itemName}</strong> to Odoo?
          </p>
          <div className="alert alert-info mb-3">
            <small>
              <strong>Note:</strong> If you include the BOM, multi-level BOMs will be automatically flattened.
              Sub-assemblies will be expanded to show only parts and PCBAs.
            </small>
          </div>
          <div className="alert alert-warning mb-3">
            <small>
              <strong>Important:</strong> All BOM components must already exist in Odoo. 
              If any components are missing, the BOM will not be created and you'll receive a list of missing items.
            </small>
          </div>
          <div className="d-flex justify-content-end mt-4">
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setShowBomModal(false)}
              style={{ marginRight: "8px" }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => performPush(false)}
              style={{ marginRight: "8px" }}
            >
              Without BOM
            </button>
            <button
              type="button"
              className="btn btn-sm dokuly-bg-primary"
              onClick={() => performPush(true)}
            >
              With BOM
            </button>
          </div>
        </div>
      </DokulyModal>
    </>
  );
};

export default PushToOdooButton;
