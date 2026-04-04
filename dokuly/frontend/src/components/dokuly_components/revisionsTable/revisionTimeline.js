import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";

import DokulyCard from "../dokulyCard";
import CardTitle from "../cardTitle";
import DokulyDateFormat from "../formatters/dateFormatter";
import DokulyMarkdown from "../dokulyMarkdown/dokulyMarkdown";
import { getRevisions } from "../../common/bom/functions/queries";
import { getEcosForItem } from "../../eco/functions/queries";
import { EcoPillList } from "../ecoPill/ecoPill";
import { ReleaseStateBadge } from "../formatters/releaseStateBadge";

import "./revisionTimeline.css";

/**
 * Derive display status from revision fields.
 */
function deriveStatus(rev) {
  if (rev.release_state === "Draft") return "draft";
  if (rev.release_state === "Review") return "review";
  if (rev.release_state === "Obsolete") return "obsolete";
  if (rev.release_state === "Released") {
    return rev.is_latest_revision ? "active" : "released";
  }
  return "draft";
}

/**
 * Map status to human-readable state label for the meta line.
 */
function stateLabel(status) {
  const map = {
    active: "Released",
    released: "Released",
    draft: "Draft",
    review: "In Review",
    obsolete: "Obsolete",
  };
  return map[status] || "";
}

/**
 * Status badge for the timeline.
 * Uses the centralized ReleaseStateBadge for standard states,
 * plus a "Latest" badge unique to the timeline.
 */
const StatusBadge = ({ status, releaseState }) => {
  if (status === "active") {
    // Show "Latest" badge (timeline-specific) alongside the Released badge
    return (
      <>
        <span className="revision-timeline__badge revision-timeline__badge--latest">
          Latest
        </span>
        <ReleaseStateBadge state="Released" />
      </>
    );
  }
  return <ReleaseStateBadge state={releaseState} />;
};

/**
 * Truncated notes with expand/collapse toggle.
 */
const TruncatedNotes = ({ notes, clampLines = 2 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!notes) return null;

  const clampClass =
    clampLines === 1
      ? "revision-timeline__notes--clamped-1"
      : "revision-timeline__notes--clamped";

  return (
    <div className="revision-timeline__notes">
      <div className={expanded ? "" : clampClass}>
        <DokulyMarkdown markdownText={notes} />
      </div>
      {notes.length > 100 && (
        <button
          type="button"
          className="revision-timeline__expand-btn"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

/**
 * Sort revisions by major then minor revision count, descending.
 */
function sortRevisions(revisions) {
  return [...revisions].sort((a, b) => {
    const majorA = a.revision_count_major ?? 0;
    const majorB = b.revision_count_major ?? 0;
    if (majorA !== majorB) return majorB - majorA;
    const minorA = a.revision_count_minor ?? 0;
    const minorB = b.revision_count_minor ?? 0;
    return minorB - minorA;
  });
}

/**
 * RevisionTimeline component.
 *
 * @param {Object} props
 * @param {Object} props.item - The current item (part, pcba, assembly, or document)
 * @param {string} props.app - "parts" | "pcbas" | "assemblies" | "documents"
 * @param {"full"|"embedded"} [props.variant="full"] - Display variant
 * @param {string} [props.basePath] - Base path for "View all" link in embedded mode
 * @param {Function} [props.setRevisionListParent] - Optional callback to share revision list with parent
 */
const RevisionTimeline = ({
  item,
  app,
  variant = "full",
  basePath = "",
  setRevisionListParent = () => {},
}) => {
  const navigate = useNavigate();
  const [revisionList, setRevisionList] = useState([]);
  const [revisionEcos, setRevisionEcos] = useState({});

  useEffect(() => {
    if (item != null && item !== undefined) {
      getRevisions(app, item.id).then((res) => {
        if (res) {
          const sorted = sortRevisions(res);
          setRevisionList(sorted);
          setRevisionListParent(sorted);

          if (variant === "full" && sorted.length > 0) {
            fetchEcosForRevisions(sorted);
          }
        }
      });
    }
  }, [item, app]);

  const fetchEcosForRevisions = async (revisions) => {
    const ecosMap = {};
    const promises = revisions.map(async (rev) => {
      try {
        const response = await getEcosForItem(app, rev.id);
        if (response.status === 200 && response.data && response.data.length > 0) {
          ecosMap[rev.id] = response.data;
        }
      } catch (err) {
        // Silently ignore errors for individual items
      }
    });
    await Promise.all(promises);
    setRevisionEcos(ecosMap);
  };

  const handleEntryClick = (rev) => {
    navigate(`/${app}/${rev.id}`);
  };

  const isEmbedded = variant === "embedded";
  const displayRevisions = isEmbedded ? revisionList.slice(0, 5) : revisionList;
  const hasMore = isEmbedded && revisionList.length > 5;

  const nodeClass = (rev, status) => {
    // Currently viewed revision gets solid filled node
    if (item && rev.id === item.id) {
      return "revision-timeline__node--current";
    }
    const map = {
      active: "revision-timeline__node--active",
      released: "revision-timeline__node--released",
      review: "revision-timeline__node--review",
      draft: "revision-timeline__node--draft",
      obsolete: "revision-timeline__node--obsolete",
    };
    return map[status] || "";
  };

  const content = (
    <div className={`revision-timeline${isEmbedded ? " revision-timeline--embedded" : ""}`}>
      <div className="revision-timeline__line" />
      {displayRevisions.map((rev) => {
        const status = deriveStatus(rev);
        const revLabel = rev.formatted_revision || rev.revision || "—";
        return (
          <div
            key={rev.id}
            className="revision-timeline__entry"
            onClick={() => handleEntryClick(rev)}
          >
            <div className={`revision-timeline__node ${nodeClass(rev, status)}`} />
            <div className="revision-timeline__content">
              {/* Line 1: "Revision X" + badge */}
              <div className="revision-timeline__header">
                <span className="revision-timeline__revision-id">
                  Revision {revLabel}
                </span>
                <StatusBadge status={status} releaseState={rev.release_state} />
              </div>
              {/* Line 2: "Released: date" or "Draft" etc. */}
              <div className="revision-timeline__meta">
                {rev.released_date ? (
                  <>
                    {stateLabel(status)}:{" "}
                    <DokulyDateFormat date={rev.released_date} />
                  </>
                ) : (
                  stateLabel(status)
                )}
              </div>
              {/* Line 3: Notes */}
              {variant === "full" && (
                <TruncatedNotes notes={rev.revision_notes} clampLines={2} />
              )}
              {isEmbedded && rev.revision_notes && (
                <TruncatedNotes notes={rev.revision_notes} clampLines={1} />
              )}
              {/* ECO pills */}
              {variant === "full" && revisionEcos[rev.id] && (
                <div className="revision-timeline__ecos">
                  <EcoPillList ecos={revisionEcos[rev.id]} size="sm" />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && basePath && (
        <span
          className="revision-timeline__view-all"
          onClick={() => navigate(`${basePath}?tab=revisions`)}
        >
          View all {revisionList.length} revisions
        </span>
      )}
    </div>
  );

  if (isEmbedded) {
    return (
      <DokulyCard>
        <CardTitle
          titleText="Revisions"
          style={{ paddingLeft: "15px", paddingTop: "15px" }}
        />
        {content}
      </DokulyCard>
    );
  }

  return (
    <DokulyCard>
      <CardTitle
        titleText="Revisions"
        style={{ paddingLeft: "15px", paddingTop: "15px" }}
      />
      <Card.Body>{content}</Card.Body>
    </DokulyCard>
  );
};

export default RevisionTimeline;
