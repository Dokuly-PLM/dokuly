import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import DokulyImage from "../../dokuly_components/dokulyImage";
import { formatCloudImageUri } from "../../pcbas/functions/productionHelpers";
import { releaseStateFormatter } from "../../dokuly_components/formatters/releaseStateFormatter";
import ThumbnailHoverZoom from "../../dokuly_components/formatters/thumbnailHoverZoom";
import { getDownstreamImpact, addAffectedItem, editAffectedItem } from "../functions/queries";

const ItemPeek = ({ item, onClick, onAdd, isLocked }) => {
  const imageSrc = item.thumbnail
    ? formatCloudImageUri(item.thumbnail)
    : null;

  return (
    <div
      className="card"
      style={{
        width: "100%",
        padding: "10px",
        border: "1px solid #e0e0e0",
        borderRadius: "6px",
        position: "relative",
      }}
    >
      {!isLocked && onAdd && (
        <button
          type="button"
          className="btn btn-sm"
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            padding: "0 4px",
            lineHeight: "1",
            fontSize: "16px",
            color: "#28a745",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            zIndex: 1,
          }}
          title="Add to ECO affected items"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(item);
          }}
        >
          <img
            src="../../static/icons/plus.svg"
            alt="Add"
            style={{ width: "16px", height: "16px" }}
          />
        </button>
      )}
      <div
        className="d-flex flex-column align-items-center"
        style={{ gap: "6px", cursor: onClick ? "pointer" : "default" }}
        onClick={onClick}
      >
        <ThumbnailHoverZoom>
          <div
            style={{
              width: "60px",
              height: "60px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f8f8f8",
              borderRadius: "4px",
            }}
          >
            {imageSrc ? (
              <DokulyImage
                src={imageSrc}
                alt="Thumbnail"
                style={{
                  maxWidth: "60px",
                  maxHeight: "60px",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <span style={{ fontSize: "11px", color: "#bbb" }}>No image</span>
            )}
          </div>
        </ThumbnailHoverZoom>
        <div style={{ textAlign: "center", width: "100%", minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: "12px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.full_part_number || "-"}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#666",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.display_name || "-"}
          </div>
          {item.release_state && (
            <div style={{ marginTop: "2px" }}>
              {releaseStateFormatter({ release_state: item.release_state })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DownstreamImpactCard = ({ ecoId, affectedItems = [], isReleased = false, readOnly = false, onItemAdded = null }) => {
  const navigate = useNavigate();
  const [impactData, setImpactData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingItem, setAddingItem] = useState(null);

  const isLocked = isReleased || readOnly;

  const fetchImpact = () => {
    if (!ecoId) return;
    const hasLinkedItems = affectedItems.some(
      (item) => item.part || item.pcba || item.assembly
    );
    if (!hasLinkedItems) {
      setImpactData([]);
      return;
    }

    setLoading(true);
    getDownstreamImpact(ecoId)
      .then((res) => {
        if (res.status === 200) {
          setImpactData(res.data);
        }
      })
      .catch(() => {
        toast.error("Failed to load downstream impact");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchImpact();
  }, [ecoId, affectedItems]);

  const navigateToItem = (item) => {
    const type = item.item_type;
    if (type === "assembly" || type === "assemblies") {
      navigate(`/assemblies/${item.id}`);
    } else if (type === "pcba" || type === "pcbas") {
      navigate(`/pcbas/${item.id}`);
    } else if (type === "parts") {
      navigate(`/parts/${item.id}`);
    }
  };

  const handleAddToEco = (item) => {
    if (!ecoId || addingItem) return;
    setAddingItem(`${item.item_type}-${item.id}`);

    const fieldMap = {
      assembly: "assembly_id",
      pcba: "pcba_id",
      part: "part_id",
    };
    const field = fieldMap[item.item_type];
    if (!field) return;

    addAffectedItem(ecoId)
      .then((res) => {
        if (res.status === 201) {
          const newItemId = res.data.id;
          return editAffectedItem(newItemId, { [field]: item.id });
        }
      })
      .then((res) => {
        if (res?.status === 200) {
          toast.success(`Added ${item.full_part_number} to ECO`);
          if (onItemAdded) onItemAdded();
          fetchImpact();
        }
      })
      .catch(() => {
        toast.error("Failed to add item to ECO");
      })
      .finally(() => {
        setAddingItem(null);
      });
  };

  if (!impactData.length && !loading) {
    return null;
  }

  return (
    <DokulyCard>
      <CardTitle
        titleText="Downstream Items"
        optionalHelpText="Shows all assemblies and PCBAs that use any of the affected items in their BOM. Only their latest revision is considered."
      />
      {loading ? (
        <div className="d-flex justify-content-center p-3">
          <div className="spinner-border spinner-border-sm text-secondary" role="status" />
        </div>
      ) : (
        <div style={{ padding: "0 15px" }}>
          {impactData.map((group, idx) => (
            <div key={idx} style={{ marginBottom: "20px" }}>
              <div
                className="d-flex align-items-center"
                style={{
                  marginBottom: "10px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #eee",
                  gap: "8px",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  {group.affected_item.full_part_number}
                </span>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {group.affected_item.display_name}
                </span>
                <span
                  className="badge bg-light text-dark"
                  style={{ fontSize: "11px", marginLeft: "auto" }}
                >
                  {group.downstream.length} downstream
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                  gap: "10px",
                }}
              >
                {group.downstream.map((item) => (
                  <ItemPeek
                    key={`${item.item_type}-${item.id}`}
                    item={item}
                    onClick={() => navigateToItem(item)}
                    onAdd={handleAddToEco}
                    isLocked={isLocked || addingItem === `${item.item_type}-${item.id}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DokulyCard>
  );
};

export default DownstreamImpactCard;
