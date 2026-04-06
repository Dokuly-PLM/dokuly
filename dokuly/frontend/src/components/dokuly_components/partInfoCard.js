import React, { useEffect, useState } from "react";
import moment from "moment";
import { releaseStateFormatter } from "./formatters/releaseStateFormatter";
import { useNavigate } from "react-router";
import { attribute_icons } from "./attributeIcons";
import { getProfile } from "../profiles/functions/queries";
import { getProjectWithCustomer } from "../projects/functions/queries";
import { fetchProtectionLevels } from "../admin/functions/queries";
import ThumbnailDisplay from "./thumbnailDisplay";
import DokulyImage from "./dokulyImage";
import DokulyCard from "./dokulyCard";
import CardTitle from "./cardTitle";
import { getName } from "country-list";
import ReactCountryFlag from "react-country-flag";
import DokulyTags from "./dokulyTags/dokulyTags";
import useItemEcos from "../common/hooks/useItemEcos";
import { EcoPillList } from "./ecoPill/ecoPill";
import { copyToClipboard } from "./funcitons/copyToClipboard";

import AddToEcoButton from "./addToEcoButton/addToEcoButton";
import PushToOdooButton from "../common/integrations/pushToOdooButton";

import "./partInfoCard.css";

/**
 * A single field row: label + value.
 * If copyValue is provided, clicking the value copies it to clipboard.
 */
const InfoField = ({ label, children, copyValue }) => {
  if (!children) return null;
  return (
    <div className="info-card__field">
      <span className="info-card__label">{label}</span>
      <span
        className={`info-card__value${copyValue ? " info-card__value--copyable" : ""}`}
        onClick={copyValue ? () => copyToClipboard(copyValue) : undefined}
        title={copyValue ? "Click to copy" : undefined}
      >
        {children}
        {copyValue && (
          <img
            className="info-card__copy-icon"
            src="../../static/icons/copy.svg"
            alt="Copy"
          />
        )}
      </span>
    </div>
  );
};

/**
 * Section divider.
 */
const SectionDivider = () => <hr className="info-card__divider" />;

/**
 * Section label.
 */
const SectionLabel = ({ text }) => (
  <div className="info-card__section-label">{text}</div>
);

/**
 * Component for displaying common part information (pcba/asm/document).
 */
const PartInformationCard = ({
  item,
  app = "",
  thumbnail_url = "",
  git_link = "",
  datasheet_url = "",
  description = "",
  last_updated = "",
  additional_fields = {},
  attributes = {},
  setRefresh,
  updateItemField = () => {},
}) => {
  const navigate = useNavigate();

  const [created_by, setCreatedBy] = useState(null);
  const [quality_assurance, setQualityAssurance] = useState(null);
  const [project, setProject] = useState(null);
  const [protectionLevel, setProtectionLevel] = useState(null);

  const { ecos: itemEcos, refetch: refetchEcos } = useItemEcos(app, item?.id);

  useEffect(() => {
    if (item?.created_by !== null && item?.created_by !== undefined) {
      getProfile(item.created_by).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setCreatedBy(res.data);
        }
      });
    }
  }, [item?.created_by]);

  useEffect(() => {
    if (
      item?.quality_assurance !== null &&
      item?.quality_assurance !== undefined
    ) {
      getProfile(item.quality_assurance).then((res) => {
        if (res.data !== null && res.data !== undefined) {
          setQualityAssurance(res.data);
        }
      });
    }
  }, [item?.quality_assurance]);

  useEffect(() => {
    if (item?.project != null && item?.project !== undefined) {
      getProjectWithCustomer(item.project).then((res) => {
        if (res.status === 200) {
          setProject(res.data);
        }
      });
    } else {
      setProject({ id: 0 });
    }
  }, [item?.project]);

  useEffect(() => {
    if (app === "documents" && item?.protection_level !== null && item?.protection_level !== undefined) {
      fetchProtectionLevels().then((res) => {
        if (res.status === 200) {
          const level = res.data.find(pl => pl.id === item.protection_level);
          if (level) {
            setProtectionLevel(level);
          }
        }
      });
    }
  }, [app, item?.protection_level]);

  const changeField = (key, value) => {
    if (item?.id == null) return;
    if (key == null) return;
    updateItemField(item.id, key, value);
    setTimeout(() => {
      setRefresh(true);
    }, 300);
  };

  const handleTagsChange = (newTags) => {
    changeField("tags", newTags);
  };

  const hasDetails =
    Object.values(additional_fields).some((v) => v !== "" && v != null) ||
    item?.country_of_origin ||
    (datasheet_url && datasheet_url !== "") ||
    (git_link && git_link !== "") ||
    (app === "documents" && protectionLevel);

  const hasPeople = created_by || quality_assurance;

  return (
    <DokulyCard>
      <CardTitle titleText={"Information"} />

      {/* Thumbnail area — hidden for apps that don't support thumbnails */}
      {(thumbnail_url || app === "parts" || app === "pcbas" || app === "assemblies") && (
        <div className="info-card__thumbnail-area">
          {thumbnail_url && thumbnail_url !== "" ? (
            <DokulyImage
              src={thumbnail_url}
              alt="Item thumbnail"
            />
          ) : (
            <ThumbnailDisplay
              item_id={item.id}
              app={app}
              releaseState={item.release_state}
              setRefresh={setRefresh}
              thumbnailId={item?.thumbnail}
            />
          )}
        </div>
      )}

      {/* Identity section */}
      <div className="info-card__section">
        <InfoField label="State">
          {releaseStateFormatter(item)}
        </InfoField>

        {item?.formatted_revision && (
          <InfoField label="Revision" copyValue={item.formatted_revision}>
            {item.formatted_revision}
          </InfoField>
        )}

        {project && project.id > 0 && (
          <InfoField label="Project">
            <span
              className="info-card__value--link"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              {project.title}
            </span>
          </InfoField>
        )}

        {description && description !== "" && description !== "No description" && (
          <InfoField label="Description" copyValue={description}>
            {description}
          </InfoField>
        )}
      </div>

      {/* Details section */}
      {hasDetails && (
        <>
          <SectionDivider />
          <div className="info-card__section">
            <SectionLabel text="Details" />

            {Object.entries(additional_fields)
              .filter(([, value]) => value !== "" && value != null)
              .map(([key, value]) => (
                <InfoField key={key} label={key} copyValue={value.toString()}>
                  {value.toString()}
                </InfoField>
              ))}

            {item?.country_of_origin && (
              <InfoField label="Country of Origin">
                <span className="d-inline-flex align-items-center gap-1">
                  <ReactCountryFlag
                    countryCode={item.country_of_origin}
                    svg
                    style={{ marginRight: "0.375rem" }}
                  />
                  {getName(item.country_of_origin) ?? item.country_of_origin}
                </span>
              </InfoField>
            )}

            {app === "documents" && protectionLevel && (
              <InfoField label="Protection Level">
                <span title={protectionLevel.description || ""}>
                  {protectionLevel.name}
                </span>
              </InfoField>
            )}

            {datasheet_url && datasheet_url !== "" && (
              <InfoField label="Datasheet">
                <a
                  className="info-card__icon-link"
                  href={datasheet_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="../../static/icons/pdf.svg"
                    alt="PDF"
                  />
                  Open datasheet
                </a>
              </InfoField>
            )}

            {git_link && git_link !== "" && (
              <InfoField label="Repository">
                <a
                  className="info-card__icon-link"
                  href={git_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src="../../static/icons/git-merge.svg"
                    alt="Git"
                  />
                  Open repository
                </a>
              </InfoField>
            )}
          </div>
        </>
      )}

      {/* People section */}
      {hasPeople && (
        <>
          <SectionDivider />
          <div className="info-card__section">
            <SectionLabel text="People" />

            {created_by && (
              <InfoField label="Created by">
                {`${created_by.first_name} ${created_by.last_name}`}
              </InfoField>
            )}

            {quality_assurance && (
              <InfoField label="Approved by">
                {`${quality_assurance.first_name} ${quality_assurance.last_name}`}
              </InfoField>
            )}
          </div>
        </>
      )}

      {/* Metadata section */}
      <SectionDivider />
      <div className="info-card__section">
        <div className="info-card__section-header">
          <SectionLabel text="Metadata" />
          <div className="info-card__actions">
            {item?.release_state !== "Released" && (
              <AddToEcoButton
                app={app}
                itemId={item?.id}
                itemName={item?.full_part_number || item?.full_doc_number}
                onSuccess={() => {
                  setRefresh(true);
                  refetchEcos();
                }}
                variant="inline"
              />
            )}
            <PushToOdooButton
              itemType={app}
              itemId={item?.id}
              itemName={item?.full_part_number || item?.full_doc_number}
              onSuccess={() => setRefresh(true)}
              variant="inline"
            />
          </div>
        </div>

        {last_updated && last_updated !== "" && (
          <InfoField label="Last modified">
            {moment(last_updated).format("MMM D, YYYY [at] HH:mm")}
          </InfoField>
        )}

        {attributes && Object.keys(attributes).length > 0 && (
          <InfoField label="Attributes">
            {attribute_icons(attributes)}
          </InfoField>
        )}

        {itemEcos && itemEcos.length > 0 && (
          <InfoField label="ECO">
            <EcoPillList ecos={itemEcos} size="sm" />
          </InfoField>
        )}

        <SectionDivider />

        <div className="info-card__tags">
          <DokulyTags
            tags={item?.tags ?? []}
            onChange={handleTagsChange}
            readOnly={false}
            project={project}
            setRefresh={setRefresh}
            variant="inline"
            actionsPosition="header"
          />
        </div>
      </div>
    </DokulyCard>
  );
};

export default PartInformationCard;
