import React, { useState, useEffect, useContext } from "react";
import { Row } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import { NavLink } from "react-router-dom";

import { fetchSinglePcba } from "./functions/queries";
import { PcbaFilesTable } from "./overViewTab/pcbaFiles/pcbaFilesTable";
import { PcbRenderViewer } from "./overViewTab/pcbRender";
import Errata from "../common/errata/errata";
import PcbaForm from "./forms/pcbaEditForm2";
import RevisionNotes from "../dokuly_components/revisionNotes/revisionNotes";
import NewRevisionButton from "./forms/newRevisionForm";
import ReferenceDocumentsTable from "../documents/referenceDocuments/referenceDocumentComponent";
import { fetchTestUser } from "../admin/functions/queries";
import { toast } from "react-toastify";
import { AuthContext } from "../App";
import Heading from "../dokuly_components/Heading";

import PartInformationCard from "../dokuly_components/partInfoCard";
import PcbaBom from "./tabs/pcbaBom";
import RevisionsTable from "../dokuly_components/revisionsTable/revisionsTable";
import PriceCard from "../common/priceCard/priceCard";
import TraceabilityTable from "../dokuly_components/traceabilityTable/traceabilityTable";
import NoPermission from "../dokuly_components/noPermission";
import MarkDownNotes from "../common/markDownNotes/markDownNotes";
import { updatePcbaField } from "./functions/utilities";
import useOrganization from "../common/hooks/useOrganization";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import useIssues from "../common/hooks/useIssues";
import NotificationTabItem from "../dokuly_components/dokulyIssues/notificationTabItem";
import IssuesTable from "../dokuly_components/dokulyIssues/issuesTable";
import useBomIssues from "../common/hooks/useBomIssues";
import InventoryTable from "../dokuly_components/dokulyInventory/inventoryTable";
import useLocationEntires from "../common/hooks/useLocationEntires";
import useLocations from "../common/hooks/useLocations";
import InventoryStatus from "../dokuly_components/dokulyInventory/inventoryStatus";
import WhereUsedTable from "../common/whereUsed/whereUsedTable";
import PushToOdooButton from "../common/integrations/pushToOdooButton";

const DisplayPcba = (props) => {
  const location = useLocation();
  // Field to ensure rerender of children.
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [id, setId] = useState(-1);

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setId(Number.parseInt(split[5]));
  }, [location]);

  const [refresh, setRefresh] = useState(false);
  const [test_user, setTestUser] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingPcba, setLoadingPcba] = useState(true);
  const [pcba, setPcba] = useState(null);
  const [organization, refreshOrganization] = useOrganization();

  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);

  const [revisionList, setRevisionList] = useState(null);
  const [issues, refreshIssues, loadingIssues] = useIssues({
    app: "pcbas",
    dbObjectId: id,
    setIsAuthenticated: setIsAuthenticated,
  });

  const [bomIssues, refreshBomIssues, loadingBomIssues] = useBomIssues({
    app: "pcbas",
    dbObjectId: id,
    setIsAuthenticated: setIsAuthenticated,
  });

  const [locationEntires, refreshLocationEntires, loadingLocationEntires] =
    useLocationEntires({
      app: "pcbas",
      dbObjectId: id,
      setIsAuthenticated: setIsAuthenticated,
    });

  const [locations, refreshLocations, loadingLocations] = useLocations({
    setIsAuthenticated: setIsAuthenticated,
  });

  useEffect(() => {
    if (id != null && id !== -1) {
      fetchSinglePcba(id)
        .then((res) => {
          if (res.status === 200) {
            setPcba(res.data);
          }
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            if (err?.response?.status === 404) {
              setErrorMessage(
                "You do not have access to this pcba, or it does not exist. Contact the project administrator."
              );
            }
            setError(true);
          }
        })
        .finally(() => {
          setLoadingPcba(false);
        });
    }
  }, [id]);

  useEffect(() => {
    if (pcba) {
      document.title = `${pcba?.full_part_number} | Dokuly`;
    }
  }, [pcba]);

  useEffect(() => {
    if (refresh === true) {
      setRefreshCounter(refreshCounter + 1);
      if (id != null && id !== -1) {
        fetchSinglePcba(id)
          .then((res) => {
            if (res.status === 200) {
              setPcba(res.data);
            }
          })
          .catch((err) => {
            if (err?.response) {
              if (err?.response?.status === 401) {
                setIsAuthenticated(false);
              }
              if (err?.response?.status === 404) {
                setErrorMessage(
                  "You do not have access to this pcba, or it does not exist. Contact the project administrator."
                );
              }
              setError(true);
            }
          })
          .finally(() => {
            setLoadingPcba(false);
          });
      }
      if (refresh) {
        setRefresh(false);
      }
    }
  }, [refresh]);

  useEffect(() => {
    fetchTestUser()
      .then((res) => {
        if (res !== undefined) {
          setTestUser(res.data.test_user);
        }
      })
      .catch((err) => {
        if (err?.response) {
          if (err?.response?.status === 401) {
            setIsAuthenticated(false);
          }
        }
      });
  }, []);

  if (error) {
    return <NoPermission errorMessage={errorMessage} />;
  }

  if (loadingPcba) {
    return (
      <div className="d-flex m-5  justify-content-center">
        <div className="spinner-border" role="status" />
      </div>
    );
  }

  const inventoryProps = {
    dbObject: pcba,
    locationEntities: locationEntires?.current_part_stock_list ?? [],
    otherRevisionsStockList: locationEntires?.other_revisions_stock_list ?? [],
    loading: loadingLocationEntires,
    setRefresh: refreshLocationEntires,
    app: "pcbas",
    locations: locations,
    refreshPart: setRefresh,
  };

  const baseTabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          {pcba == null || pcba === undefined ? (
            <div className="d-flex m-5  justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <>
              {" "}
              <Row className="pl-3 pt-1">
                <NewRevisionButton pcba={pcba} />{" "}
                {pcba == null || pcba === undefined ? (
                  ""
                ) : (
                  <PcbaForm
                    pcba_id={pcba.id}
                    pcba={pcba}
                    refreshParent={setRefresh}
                  />
                )}
                <PushToOdooButton 
                  itemType="pcbas" 
                  itemId={pcba?.id} 
                  itemName={pcba?.full_part_number}
                  onSuccess={() => setRefresh(true)}
                />
              </Row>
              <div className="row">
                <div className="col">
                  <div className="row">
                    <PartInformationCard
                      item={pcba}
                      last_updated={pcba?.last_updated}
                      description={pcba?.description}
                      attributes={pcba?.attributes}
                      setRefresh={setRefresh}
                      additional_fields={{
                        "External part number": pcba?.external_part_number,
                      }}
                      app={"pcbas"}
                      updateItemField={updatePcbaField}
                    />
                  </div>

                  <Row>
                    <PriceCard
                      app={"pcbas"}
                      itemId={pcba?.id}
                      price={pcba?.price}
                      currency={pcba?.currency}
                      unit={"pcs"}
                      setRefresh={setRefresh}
                    />
                  </Row>

                  <div className="row">
                    {pcba == null || pcba === undefined ? (
                      <div className="d-flex m-5  justify-content-center">
                        <div className="spinner-border" role="status" />
                      </div>
                    ) : (
                      <PcbaFilesTable
                        pcba_id={pcba.id}
                        pcba={pcba}
                        setRefresh={setRefresh}
                      />
                    )}
                  </div>
                </div>
                <div className="col">
                  <div className="row">
                    {pcba == null || pcba === undefined ? (
                      <div className="d-flex m-5  justify-content-center">
                        <div className="spinner-border" role="status" />
                      </div>
                    ) : (
                      <PcbRenderViewer
                        forceRerender={refreshCounter}
                        pcba={pcba}
                        setRefresh={setRefresh}
                      />
                    )}
                  </div>
                  <div className="row">
                    <RevisionNotes
                      app={"pcbas"}
                      item={pcba}
                      setRefresh={setRefresh}
                    />
                  </div>
                  <Row>
                    {/* <Errata app={"pcbas"} item={pcba} setRefresh={setRefresh} /> */}
                  </Row>
                </div>
              </div>
            </>
          )}
        </>
      ),
    },
    {
      eventKey: "issues",
      title: (
        <NotificationTabItem
          app={"pcbas"}
          dbObject={pcba}
          title={"Issues"}
          issues={issues}
          bomIssues={bomIssues}
        />
      ),
      content: (
        <IssuesTable
          dbObject={pcba}
          issues={issues ?? []}
          app={"pcbas"}
          setRefresh={refreshIssues}
          revisionList={revisionList}
          useBomIssues={true}
          bomIssues={bomIssues}
          refreshBomIssues={refreshBomIssues}
          loadingBomIssues={loadingBomIssues}
        />
      ),
    },
    {
      eventKey: "inventory",
      title: "Inventory",
      hidden: organization?.inventory_is_enabled === false,
      content: (
        <>
          <InventoryStatus {...inventoryProps} />
          <InventoryTable {...inventoryProps} />
        </>
      ),
    },
    {
      eventKey: "bom",
      title: "Bill of Materials",
      content: (
        <PcbaBom
          pcba={pcba}
          organization={organization}
          refreshBomIssues={refreshBomIssues}
        />
      ),
    },
    {
      eventKey: "notes",
      title: "Notes",
      content: (
        <MarkDownNotes
          markdownTextObj={pcba?.markdown_notes}
          onNotesUpdate={(text) =>
            updatePcbaField(pcba.id, "markdown_notes", text, setRefresh)
          }
          projectId={pcba?.project}
          appObject={pcba}
          app="pcbas"
          useTabs={true}
        />
      ),
    },
  ];

  const referenceDocumentsTab = {
    eventKey: "reference-documents",
    title: "Reference documents",
    content: (
      <>
        <div className="row m-3">
          <ReferenceDocumentsTable pcba_id={pcba?.id} />
        </div>
      </>
    ),
  };

  const remainingTabs = [
    {
      eventKey: "revisions",
      title: "Revisions",
      content: (
        <>
          <div className="row m-3">
            <RevisionsTable
              app={"pcbas"}
              item={pcba}
              setRevisionListParent={setRevisionList}
            />
          </div>
        </>
      ),
    },
    {
      eventKey: "traceability",
      title: "Traceability",
      content: (
        <>
          {pcba == null || pcba === undefined ? (
            <div className="d-flex m-5 justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div className="row m-3">
              <TraceabilityTable app={"pcbas"} item={pcba} />
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
            app="pcbas" 
            itemId={id} 
            itemType="PCBA"
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
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NavLink to={"/pcbas"}>
        <img
          className="icon-dark p-2 arrow-back"
          src="../../static/icons/arrow-left.svg"
          alt="icon"
          style={{ cursor: "pointer" }}
        />
      </NavLink>
      <div className="">
        <Heading
          item_number={pcba?.full_part_number}
          display_name={pcba?.display_name}
          revision={pcba?.revision}
          is_latest_revision={pcba?.is_latest_revision}
          app="pcbas"
          organization={pcba?.organization}
          icon_url={pcba?.part_type?.icon_url}
        />
        <DokulyTabs
          tabs={tabs.filter((tab) => !tab.hidden)}
          basePath={`/pcbas/${id}`}
        />
      </div>
    </div>
  );
};

export default DisplayPcba;
