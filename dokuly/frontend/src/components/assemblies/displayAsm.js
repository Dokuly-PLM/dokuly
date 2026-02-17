import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchASM, getRevisions } from "./functions/queries";
import ReferenceDocumentsTable from "../documents/referenceDocuments/referenceDocumentComponent";
import axios from "axios";
import { tokenConfig } from "../../configs/auth";
import AsmNewRevision from "./overViewCards/asmNewRevision";
import { FilesTable } from "./../common/filesTable/filesTable";
import { fetchTestUser } from "../admin/functions/queries";
import { toast } from "react-toastify";
import { AuthContext } from "../App";
import Heading from "../dokuly_components/Heading";
import { Row, Col } from "react-bootstrap";
import AssemblyBom from "./overViewCards/assemblyBom2";
import PartInformationCard from "../dokuly_components/partInfoCard";
import AsmEditForm from "./forms/asmEditForm";
import RevisionNotes from "../dokuly_components/revisionNotes/revisionNotes";
import RevisionsTable from "../dokuly_components/revisionsTable/revisionsTable";
import Errata from "../common/errata/errata";
import TraceabilityTable from "../dokuly_components/traceabilityTable/traceabilityTable";
import PriceCard from "../common/priceCard/priceCard";
import NoPermission from "../dokuly_components/noPermission";
import { updateAsmField } from "./functions/utilities";
import MarkDownNotes from "../common/markDownNotes/markDownNotes";
import useOrganization from "../common/hooks/useOrganization";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import IssuesTable, {
  appToModelName,
} from "../dokuly_components/dokulyIssues/issuesTable";
import NotificationTabItem from "../dokuly_components/dokulyIssues/notificationTabItem";
import useIssues from "../common/hooks/useIssues";
import useBomIssues from "../common/hooks/useBomIssues";
import useLocationEntires from "../common/hooks/useLocationEntires";
import useLocations from "../common/hooks/useLocations";
import InventoryTable from "../dokuly_components/dokulyInventory/inventoryTable";
import WhereUsedTable from "../common/whereUsed/whereUsedTable";
import InventoryStatus from "../dokuly_components/dokulyInventory/inventoryStatus";
import PushToOdooButton from "../common/integrations/pushToOdooButton";

export const getIssueColor = (issue, app) => {
  const closedInField = `closed_in_${appToModelName[app]}`;
  // Only check open issues
  if (issue[closedInField] === null) {
    if (issue.criticality === "Critical") {
      return "red"; // Color for critical issues
    }
    if (issue.criticality === "High") {
      return "#f6c208ff"; // Color for high issues
    }
  }
  return "#54a4daff"; // Default color for low issues
};

/**
 * Component for displaying a ASM entity and its sub components.
 * This is a parent component, its usage can be found in App.js
 * @param {any} props - Any data passed to the component. Data passed here are passed in a redirect,
 * found in assemblyComponent.js, line 650-658 (as of 18.08.2022).
 * @returns {<HTMLDivElement>} - The complete overview of an ASM entity.
 *
* @example
    // import the component
    import DisplayASM from 'somePathTo/DisplayASM.js'
    // Call on the component in a return (render) function
    ...
    // Use the props to pass any data to the component from its parent component, e.g. in App:
    <Router>
      <PrivateRoute
        exact
        path="/assemblies/:id"
        component={DisplayASM}
      />
    </Router>
 */
const DisplayASM = (props) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [organization, refreshOrganization] = useOrganization();

  const [refresh, setRefresh] = useState(true);
  const [currentASMID, setCurrentASMID] = useState(-1);

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setCurrentASMID(Number.parseInt(split[5]));
  }, [location]);

  // Compute return to list URL - search will be restored from localStorage
  const returnToList = "/assemblies";

  // Read searchTerm from localStorage for this table
  const [searchTerm] = useState(() => {
    try {
      return localStorage.getItem("search_assemblies") || "";
    } catch {
      return "";
    }
  });

  const [test_user, setTestUser] = useState(false);
  useEffect(() => {
    fetchTestUser().then((res) => {
      if (res !== undefined) {
        setTestUser(res.data.test_user);
      }
    });
  }, []);

  const [asmDetailed, setASMDetailed] = useState(
    props?.location?.state?.asm !== undefined
      ? props?.location?.state?.asm
      : null,
  );
  const [loading, setLoading] = useState(
    props?.location?.state?.asm === undefined,
  );
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);
  const [bom, setBom] = useState({});

  const [profiles, setProfiles] = useState(null);
  const [revision_list, setRevisionList] = useState(null);

  const [issues, refreshIssues, loadingIssues] = useIssues({
    app: "assemblies",
    dbObjectId: currentASMID,
    setIsAuthenticated: setIsAuthenticated,
  });

  const [bomIssues, refreshBomIssues, loadingBomIssues] = useBomIssues({
    app: "assemblies",
    dbObjectId: currentASMID,
    setIsAuthenticated: setIsAuthenticated,
  });

  const [locationEntires, refreshLocationEntires, loadingLocationEntires] =
    useLocationEntires({
      app: "assemblies",
      dbObjectId: currentASMID,
      setIsAuthenticated: setIsAuthenticated,
    });

  const [locations, refreshLocations, loadingLocations] = useLocations({
    setIsAuthenticated: setIsAuthenticated,
  });

  const liftUpState = (childData) => {
    if (childData?.refetchRevisions === true) {
      setLoading3(true);
      getRevisions(currentASMID)
        .then((res) => {
          setRevisionList(res.data);
        })
        .finally(() => {
          setLoading3(false);
        });
    }
    if (childData?.newAsm === true) {
      if (childData?.newData !== undefined && childData?.newData !== null) {
        setASMDetailed(childData?.newData);
      }
    }
    if (childData !== null && childData !== undefined) {
      setRefresh(true);
    }
  };

  useEffect(() => {
    if (currentASMID === -1) {
      return;
    }

    fetchASM(currentASMID)
      .then((res) => {
        if (res.status === 200) {
          setASMDetailed(res.data);
        }
      })
      .catch((err) => {
        if (err !== null) {
          if (err?.response?.status === 401) {
            setIsAuthenticated(false);
          }
          if (err?.response?.status === 404) {
            setErrorMessage(
              "You do not have access to this assembly, or it does not exist. Contact the project administrator.",
            );
          }
          setError(true);
        }
      });
  }, [currentASMID]);

  useEffect(() => {
    if (currentASMID === -1) {
      return;
    }
    if (refresh) {
      fetchASM(currentASMID)
        .then((res) => {
          if (res.status === 200) {
            setASMDetailed(res.data);
          }
        })
        .catch((err) => {
          if (err !== null) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            if (err?.response?.status === 404) {
              setErrorMessage(
                "You do not have access to this assembly, or it does not exist. Contact the project administrator.",
              );
            }
            setError(true);
          }
        });
    }
    localStorage.setItem("updatedAsm", JSON.stringify(false));
    if (asmDetailed == null || currentASMID !== asmDetailed?.id) {
      fetchASM(currentASMID)
        .then((res) => {
          if (res.status === 200) {
            // Dont load archived assemblies.
            if (res.data.is_archived !== true) {
              setASMDetailed(res.data);
              setLoading(false);
            }
          }
        })
        .catch((err) => {
          if (err !== null) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            if (err?.response?.status === 404) {
              setErrorMessage(
                "You do not have access to this assembly, or it does not exist. Contact the project administrator.",
              );
            }
            setError(true);
          }
        });
    }
    if (revision_list == null) {
      getRevisions(currentASMID)
        .then((res) => {
          setRevisionList(res.data);
        })
        .catch((err) => {
          if (err !== null) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            if (err?.response?.status === 404) {
              setErrorMessage(
                "You do not have access to this assembly, or it does not exist. Contact the project administrator.",
              );
            }
            setError(true);
          }
        })
        .finally(() => {
          setLoading3(false);
        });
    }
    if (profiles == null) {
      axios
        .get("api/profiles", tokenConfig())
        .then((res) => {
          setProfiles(res.data);
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
    }
    setRefresh(false);
  }, [refresh, currentASMID]);

  useEffect(() => {
    if (asmDetailed) {
      document.title = `${asmDetailed.full_part_number} | Dokuly`;
    }
  }, [asmDetailed]);

  if (error) {
    return <NoPermission errorMessage={errorMessage} />;
  }

  if (loading || loading2 || loading3 || !asmDetailed) {
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
    dbObject: asmDetailed,
    locationEntities: locationEntires?.current_part_stock_list ?? [],
    otherRevisionsStockList: locationEntires?.other_revisions_stock_list ?? [],
    loading: loadingLocationEntires,
    setRefresh: refreshLocationEntires,
    app: "assemblies",
    locations: locations,
    refreshPart: setRefresh,
  };

  const baseTabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <>
          <Row>
            <AsmNewRevision
              asm={asmDetailed}
              profiles={profiles}
              liftUpState={liftUpState}
            />
            {asmDetailed.release_state !== "Released" && (
              <AsmEditForm asm={asmDetailed} setRefresh={setRefresh} />
            )}
            <PushToOdooButton
              itemType="assemblies"
              itemId={asmDetailed?.id}
              itemName={asmDetailed?.full_part_number}
              onSuccess={() => setRefresh(true)}
            />
          </Row>
          <Row>
            <Col>
              <Row>
                <PartInformationCard
                  item={asmDetailed}
                  last_updated={asmDetailed?.last_updated}
                  description={asmDetailed?.description}
                  setRefresh={setRefresh}
                  additional_fields={{
                    "External part number": asmDetailed?.external_part_number,
                  }}
                  app={"assemblies"}
                  updateItemField={updateAsmField}
                />
              </Row>
              <Row>
                <PriceCard
                  app={"assemblies"}
                  itemId={asmDetailed?.id}
                  price={asmDetailed?.price}
                  currency={asmDetailed?.currency}
                  unit={"pcs"}
                  setRefresh={setRefresh}
                />
              </Row>
              <Row>
                <FilesTable
                  file_id_list={asmDetailed?.files}
                  app="Assembly"
                  objectId={asmDetailed?.id}
                  setRefresh={setRefresh}
                  release_state={asmDetailed?.release_state}
                />
              </Row>
            </Col>
            <Col>
              <Row>
                <RevisionNotes
                  app={"assemblies"}
                  item={asmDetailed}
                  setRefresh={setRefresh}
                />
              </Row>
              <Row>
                {/* <Errata
                  app={"assemblies"}
                  item={asmDetailed}
                  setRefresh={setRefresh}
                /> */}
              </Row>
            </Col>
          </Row>
        </>
      ),
    },
    {
      eventKey: "issues",
      title: (
        <NotificationTabItem
          app={"assemblies"}
          dbObject={asmDetailed}
          title={"Issues"}
          issues={issues}
          bomIssues={bomIssues}
        />
      ),
      content: (
        <IssuesTable
          dbObject={asmDetailed}
          issues={issues ?? []}
          app={"assemblies"}
          setRefresh={refreshIssues}
          revisionList={revision_list}
          setRefreshBomIssues={refreshBomIssues}
          loadingBomIssues={loadingBomIssues}
          bomIssues={bomIssues}
          useBomIssues
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
        <AssemblyBom
          assembly={asmDetailed}
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
          markdownTextObj={asmDetailed?.markdown_notes}
          onNotesUpdate={(text) =>
            updateAsmField(asmDetailed.id, "markdown_notes", text, setRefresh)
          }
          projectId={asmDetailed?.project}
          appObject={asmDetailed}
          app="assemblies"
          useTabs={true}
        />
      ),
    },
  ];

  const referenceDocumentsTab = {
    eventKey: "reference-documents",
    title: "Reference documents",
    content: (
      <ReferenceDocumentsTable asm_id={currentASMID} asm={asmDetailed} />
    ),
  };

  const remainingTabs = [
    {
      eventKey: "revisions",
      title: "Revisions",
      content: (
        <div className="row m-3">
          <RevisionsTable app={"assemblies"} item={asmDetailed} />
        </div>
      ),
    },
    {
      eventKey: "traceability",
      title: "Traceability",
      content: (
        <>
          {asmDetailed == null || asmDetailed === undefined ? (
            <div className="d-flex m-5 justify-content-center">
              <div className="spinner-border" role="status" />
            </div>
          ) : (
            <div className="row m-3">
              <TraceabilityTable app={"assemblies"} item={asmDetailed} />
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
            app="assemblies"
            itemId={currentASMID}
            itemType="Assembly"
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
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <img
          className="icon-dark p-2 arrow-back"
          onClick={() => navigate(returnToList)}
          src="../../static/icons/arrow-left.svg"
          alt="arrow left"
        />
        <Heading
          item_number={asmDetailed?.full_part_number}
          display_name={asmDetailed?.display_name}
          revision={asmDetailed?.revision}
          is_latest_revision={asmDetailed?.is_latest_revision}
          app="assemblies"
          organization={asmDetailed?.organization}
          icon_url={asmDetailed?.part_type?.icon_url}
        />
        <DokulyTabs
          tabs={tabs.filter((tab) => !tab.hidden)}
          basePath={`/assemblies/${currentASMID}`}
        />
      </div>
    </React.Fragment>
  );
};

export default DisplayASM;
