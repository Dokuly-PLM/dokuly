import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Col, Row } from "react-bootstrap";

import { PartNewRevision } from "./partNewRevision";
import { fetchAltParts, fetchPart } from "./functions/queries";
import InventoryCard from "./overViewCards/inventoryCard";

import UpdateBackorder from "./overViewCards/updateBackorder";
import PartSpecs from "./partSpecifications/partSpecs";

import ReferenceDocumentsTable from "../documents/referenceDocuments/referenceDocumentComponent";

import EditPartForm from "./forms/editPartForm";
import AlternativeParts from "./overViewCards/alternativeParts";
import { AuthContext } from "../App";
import Heading from "../dokuly_components/Heading";
import { FilesTable } from "../common/filesTable/filesTable";
import PartInformationCard from "../dokuly_components/partInfoCard";
import RevisionsTable from "../dokuly_components/revisionsTable/revisionsTable";
import RevisionNotes from "../dokuly_components/revisionNotes/revisionNotes";
import PriceCard from "../common/priceCard/priceCard";
import NoPermission from "../dokuly_components/noPermission";
import MarkDownNotes from "../common/markDownNotes/markDownNotes";
import { updatePartField } from "./functions/utilities";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import NotificationTabItem from "../dokuly_components/dokulyIssues/notificationTabItem";
import IssuesTable from "../dokuly_components/dokulyIssues/issuesTable";
import useIssues from "../common/hooks/useIssues";
import useLocations from "../common/hooks/useLocations";
import InventoryTable from "../dokuly_components/dokulyInventory/inventoryTable";
import useLocationEntires from "../common/hooks/useLocationEntires";
import InventoryStatus from "../dokuly_components/dokulyInventory/inventoryStatus";
import WhereUsedTable from "../common/whereUsed/whereUsedTable";
import useOrganization from "../common/hooks/useOrganization";

const DisplayPart = (props) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || ""
  );

  // Url logic
  const [currentPartID, setCurrentPartID] = useState(-1);

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setCurrentPartID(Number.parseInt(split[5]));
  }, [location]);

  // Basic states
  const [refetch, setRefetch] = useState(true);
  const [loading, setLoading] = useState(
    props?.location?.state?.part === undefined
  );
  const [loading2, setLoading2] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Basic part data
  const [part, setPart] = useState(
    props?.location?.state?.part !== undefined
      ? props?.location?.state?.part
      : null
  );

  const [partAlts, setPartAlts] = useState(null);
  const [stockArr, setStockArr] = useState(
    props?.location?.state?.stock !== undefined
      ? props?.location?.state?.stock
      : null
  );

  // Edit part states
  const [refresh, setRefresh] = useState(false);
  const [revisionList, setRevisionList] = useState(null);
  const navigate = useNavigate();

  const [issues, refreshIssues, loadingIssues] = useIssues({
    app: "parts",
    dbObjectId: currentPartID,
    setIsAuthenticated: setIsAuthenticated,
  });

  const [locationEntires, refreshLocationEntires, loadingLocationEntires] =
    useLocationEntires({
      app: "parts",
      dbObjectId: currentPartID,
      setIsAuthenticated: setIsAuthenticated,
    });

  const [locations, refreshLocations, loadingLocations] = useLocations({
    setIsAuthenticated: setIsAuthenticated,
  });

  const [organization, refreshOrganization] = useOrganization();

  useEffect(() => {
    if (refresh || part == null || currentPartID !== part?.id) {
      if (currentPartID !== -1) {
        fetchPart(currentPartID)
          .then((res) => {
            // console.log(res.data);
            if (res.data === "") {
              setErrorMessage(
                "You do not have access to this part, or it does not exist. Contact the project administrator."
              );
              setError(true);
              setPart(null);
            } else {
              setPart(res.data);
            }

            if (
              res?.data?.alternative_parts != null &&
              res?.data?.alternative_parts !== undefined &&
              res?.data?.alternative_parts.length !== 0
            ) {
              fetchAltParts(res?.data?.alternative_parts)
                .then((res2) => {
                  setPartAlts(res2.data);
                })
                .catch((err) => {
                  if (err?.response) {
                    if (err?.response?.status === 401) {
                      setIsAuthenticated(false);
                    }
                  }
                })
                .finally(() => {
                  setLoading2(false);
                });
            } else {
              setPartAlts([-1]);
              setLoading2(false);
            }
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
              if (err?.response?.status === 404) {
                setErrorMessage(
                  "You do not have access to this part, or it does not exist. Contact the project administrator."
                );
                setError(true);
                setPart(null);
              }
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else {
      document.title = (() => {
        // full_part_number already contains the properly formatted part number with revision
        return part?.full_part_number;
      })();
      if (
        part.alternative_parts != null &&
        part.alternative_parts !== undefined &&
        part.alternative_parts.length !== 0
      ) {
        fetchAltParts(part.alternative_parts)
          .then((res) => {
            setPartAlts(res.data);
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
            }
          })
          .finally(() => {
            setLoading2(false);
          });
      } else {
        setPartAlts([-1]);
        setLoading2(false);
      }
    }
    setRefetch(false);
    if (refresh) {
      setRefresh(false);
    }
  }, [currentPartID, part, refresh]);

  const checkForLoading = () => {
    if (
      refetch === true ||
      loading2 === true ||
      loading === true ||
      part === null ||
      partAlts === null
    ) {
      return true;
    }
    return false;
  };

  if (error) {
    return <NoPermission errorMessage={errorMessage} />;
  }

  if (checkForLoading()) {
    return (
      <div
        style={{ margin: "5rem" }}
        className="d-flex m-5 dokuly-primary justify-content-center"
      >
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  const inventoryProps = {
    dbObject: part,
    locationEntities: locationEntires?.current_part_stock_list ?? [],
    otherRevisionsStockList: locationEntires?.other_revisions_stock_list ?? [],
    loading: loadingLocationEntires,
    setRefresh: refreshLocationEntires,
    app: "parts",
    locations: locations,
    refreshPart: setRefresh,
  };

  const baseTabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          <div className="row pl-3 pt-1">
            <EditPartForm part={part} setRefresh={setRefresh} />
            <PartNewRevision part={part} />
          </div>
          <div className="row">
            <div className="col">
              <div className="row">
                <PartInformationCard
                  item={part}
                  last_updated={part?.last_updated}
                  description={part?.description}
                  thumbnail_url={part?.image_url}
                  datasheet_url={part?.datasheet}
                  git_link={part?.git_link}
                  additional_fields={{
                    MPN: part?.mpn,
                    Manufacturer: part?.manufacturer,
                    "External part number": part?.external_part_number,
                  }}
                  setRefresh={setRefresh}
                  app={"parts"}
                  updateItemField={updatePartField}
                />
              </div>
              <div className="row">
                <PriceCard
                  app={"parts"}
                  itemId={part?.id}
                  price={part?.price}
                  currency={part?.currency}
                  supplier={part?.supplier}
                  unit={part?.unit}
                  setRefresh={setRefresh}
                  refresh={refresh}
                />
              </div>
              <div className="row">
                <AlternativeParts
                  part={part}
                  alternativeParts={partAlts}
                  setRefresh={setRefresh}
                />
              </div>
              <Row>
                <FilesTable
                  file_id_list={part?.files}
                  app="Part"
                  objectId={part?.id}
                  setRefresh={setRefresh}
                  release_state={part?.release_state}
                />
              </Row>
            </div>
            <div className="col">
              <React.Fragment>
                <div className="row">
                  <RevisionNotes
                    app={"parts"}
                    item={part}
                    setRefresh={setRefresh}
                  />
                </div>
                <Row>
                  {/* <Errata item={part} app={"parts"} setRefresh={setRefresh} /> */}
                </Row>
              </React.Fragment>
              {/* <div className="row">
                <InventoryCard part={part} stock={stockArr} />
              </div> */}
            </div>
          </div>
        </>
      ),
    },
    {
      eventKey: "issues",
      title: (
        <NotificationTabItem
          app={"parts"}
          dbObject={part}
          title={"Issues"}
          issues={issues}
          bomIssues={[]}
        />
      ),
      content: (
        <IssuesTable
          dbObject={part}
          issues={issues ?? []}
          app={"parts"}
          setRefresh={refreshIssues}
          revisionList={revisionList}
          useBomIssues={false}
          bomIssues={[]}
        />
      ),
    },
    {
      eventKey: "inventory",
      title: "Inventory",
      content: (
        <>
          <InventoryStatus {...inventoryProps} />
          <InventoryTable {...inventoryProps} />
        </>
      ),
    },
    {
      eventKey: "notes",
      title: "Notes",
      content: (
        <MarkDownNotes
          markdownTextObj={part?.markdown_notes}
          onNotesUpdate={(text) =>
            updatePartField(part.id, "markdown_notes", text, setRefresh)
          }
          projectId={part?.project}
          appObject={part}
          app="parts"
          useTabs={true}
        />
      ),
    },
  ];

  const referenceDocumentsTab = {
    eventKey: "reference-documents",
    title: "Reference Documents",
    content: <ReferenceDocumentsTable part_id={currentPartID} />,
  };

  const remainingTabs = [
    {
      eventKey: "specs",
      title: "Specifications",
      content: (
        <div className="container">
          <PartSpecs part={part} setRefresh={setRefresh} />
        </div>
      ),
    },
    {
      eventKey: "revisions",
      title: "Revisions",
      content: (
        <>
          {part == null || part === undefined ? (
            <div className="d-flex m-5 justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div className="row m-3">
              <RevisionsTable
                app={"parts"}
                item={part}
                setRevisionListParent={setRevisionList}
              />
            </div>
          )}
        </>
      ),
    },
    {
      eventKey: "where-used",
      title: "Where Used",
      content: (
        <div className="row m-3">
          <WhereUsedTable 
            app="parts" 
            itemId={currentPartID} 
            itemType="Part"
          />
        </div>
      ),
    },
  ];

  const tabs = [
    ...baseTabs,
    ...(organization?.document_is_enabled ? [referenceDocumentsTab] : []),
    ...remainingTabs,
  ];

  return (
    <React.Fragment>
      <div
        className="container-fluid mt-2 mainContainerWidth"
        style={{ paddingBottom: "1rem" }}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: No need for btn here */}
        <img
          className="icon-dark p-2 arrow-back"
          onClick={() => navigate(`/parts?search=${searchTerm}`)}
          src="../../static/icons/arrow-left.svg"
          alt="Arrow Icon"
        />

        <Heading
          item_number={part?.full_part_number}
          display_name={part?.display_name}
          revision={part?.revision}
          is_latest_revision={part?.is_latest_revision}
          app="parts"
          organization={part?.organization}
        />
        <DokulyTabs tabs={tabs} basePath={`/parts/${currentPartID}`} />
      </div>
    </React.Fragment>
  );
};

export default DisplayPart;
