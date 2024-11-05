import React, { useContext, useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Row, Col, Tab, Tabs, Modal, Button } from "react-bootstrap";
import { toast } from "react-toastify";

import { AuthContext } from "../App";
import { formatPDFViewerURL } from "../common/functions";
import { FilesTable } from "./documentFiles/documentFilesTable";
import NewRevision from "./forms/documentNewRevisionForm";
import DocumentEditForm from "./forms/documentsEditForm";
import RevisionNotes from "../dokuly_components/revisionNotes/revisionNotes";
import ReferencedDocumentsTable from "./overviewTabs/referenced_items";
import Heading from "../dokuly_components/Heading";
import PartInformationCard from "../dokuly_components/partInfoCard";
import RevisionsTable from "../dokuly_components/revisionsTable/revisionsTable";
import { fetchProjects } from "../projects/functions/queries";
import { fetchCustomers } from "../customers/funcitons/queries";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import { fetchPrefixes, fetchUsers } from "../admin/functions/queries";
import { getDocument, updateDoc } from "./functions/queries";
import { getFile } from "../common/filesTable/functions/queries";
import NoPermission from "../dokuly_components/noPermission";
import DokulyModal from "../dokuly_components/dokulyModal";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";
import useIssues from "../common/hooks/useIssues";
import NotificationTabItem from "../dokuly_components/dokulyIssues/notificationTabItem";
import IssuesTable from "../dokuly_components/dokulyIssues/issuesTable";
import { updateDocumentField } from "./functions/helperFunctions";

const DisplayDocument = (props) => {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const [projects, setProjects] = useState(null);
  const [customers, setCustomers] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [prefixes, setPrefixes] = useState(null);
  const [profiles, setProfiles] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingDocument, setLoadingDocument] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPrefixes, setLoadingPrefixes] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [refetchingDoc, setRefetchingDoc] = useState(false);
  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || ""
  );
  const [fileContent, setFileContent] = useState(null);

  const [documentId, setDocumentId] = useState(-1);
  const [error, setError] = useState(false); // Error state
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const [showModal, setShowModal] = useState(false); // Modal state

  const [revisionList, setRevisionList] = useState([]);

  const navigate = useNavigate();

  const titleRef = useRef(null);

  useEffect(() => {
    const resizeFont = () => {
      if (!titleRef.current || !selectedDocument) return;

      const minWidth = 400;
      const maxWidth = window.innerWidth - 350;
      const actualWidth = titleRef.current.scrollWidth;

      let actualFontSize = window
        .getComputedStyle(titleRef.current, null)
        .getPropertyValue("font-size");

      actualFontSize = Number.parseFloat(actualFontSize);
      const minFontSize = 14;
      const maxFontSize = 32;

      let newSize;

      if (actualWidth > maxWidth) {
        newSize = (maxWidth / actualWidth) * actualFontSize;
        newSize = Math.max(newSize, minFontSize);
      } else {
        const ratio = (window.innerWidth - 350) / maxWidth;
        newSize = minFontSize + (maxFontSize - minFontSize) * ratio;
        newSize = Math.min(newSize, maxFontSize);
        newSize = Math.max(newSize, minFontSize);
      }

      titleRef.current.style.fontSize = `${newSize}px`;

      // Toggle 'no-wrap' class
      if (newSize <= minFontSize) {
        titleRef.current.classList.remove("no-wrap");
      } else {
        titleRef.current.classList.add("no-wrap");
      }
    };

    resizeFont();

    window.addEventListener("resize", resizeFont);

    return () => {
      window.removeEventListener("resize", resizeFont);
    };
  }, [selectedDocument]);

  // Tabs
  const [key, setKey] = useState("overview");

  useEffect(() => {
    const url = window.location.href.toString();
    const split = url.split("/");
    setDocumentId(Number.parseInt(split[5]));
    setRefresh(true);
  }, [location]);

  const [issues, refreshIssues, loadingIssues] = useIssues({
    app: "documents",
    dbObjectId: documentId,
    setIsAuthenticated: setIsAuthenticated,
  });

  useEffect(() => {
    setRefresh(true);
  }, [documentId]);

  useEffect(() => {
    if (documentId === -1) {
      return;
    }
    if (projects == null || refresh) {
      fetchProjects()
        .then((res) => {
          setProjects(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
    if (customers == null || refresh) {
      fetchCustomers()
        .then((res) => {
          setCustomers(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingCustomers(false);
        });
    }
    if (prefixes == null || refresh) {
      fetchPrefixes()
        .then((res) => {
          setPrefixes(res.data);
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        })
        .finally(() => {
          setLoadingPrefixes(false);
        });
    }
    if (profiles == null || refresh) {
      fetchUsers()
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
          setLoadingProfiles(false);
        });
    }
    if (selectedDocument == null || refresh) {
      setRefetchingDoc(true);
      getDocument(documentId)
        .then((res) => {
          setSelectedDocument(res.data);
          document.title = `${res.data?.full_doc_number} - ${res.data?.title} | Dokuly`;
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
            if (err?.response?.status === 400) {
              setErrorMessage(
                "You do not have access to this document, or it does not exist. Contact the project administrator."
              );
              setError(true);
            }
          }
        })
        .finally(() => {
          setLoadingDocument(false);
          setRefetchingDoc(false);
        });
    }

    setRefresh(false);
  }, [props, refresh]);

  useEffect(() => {
    if (selectedDocument) {
      const url = formatPDFViewerURL(selectedDocument.id, "pdf");
      getFile(url).then((blob) => {
        const url = URL.createObjectURL(blob);
        setFileContent(url);
      });
    }
  }, [selectedDocument]);

  if (error) {
    return <NoPermission errorMessage={errorMessage} />;
  }

  if (
    loadingCustomers ||
    loadingDocument ||
    loadingProjects ||
    loadingPrefixes ||
    loadingProfiles
  ) {
    return loadingSpinner();
  }

  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <Row>
          <Col>
            <Row>
              {" "}
              <NewRevision
                document={selectedDocument}
                setRefresh={setRefresh}
                setLoadingDocument={setLoadingDocument}
              />
              {selectedDocument.release_state === "Released" ? (
                ""
              ) : (
                <DocumentEditForm
                  document={selectedDocument}
                  setRefresh={setRefresh}
                />
              )}
            </Row>
            <Row>
              <PartInformationCard
                item={selectedDocument}
                last_updated={selectedDocument?.last_updated}
                description={selectedDocument?.description}
                setRefresh={setRefresh}
                app={"documents"}
                updateItemField={updateDocumentField}
              />
            </Row>
            <Row />
            <Row>
              <FilesTable
                db_item={selectedDocument}
                refresh={refresh}
                loading={loadingDocument}
              />
            </Row>
            <Row>
              {/* <Errata
                  item={selectedDocument}
                  app={"documents"}
                  setRefresh={setRefresh}
                /> */}
            </Row>

            <Row>
              <RevisionNotes
                app={"documents"}
                item={selectedDocument}
                setRefresh={setRefresh}
              />
            </Row>
          </Col>
          <Col>
            {selectedDocument.pdf != null && !refetchingDoc ? (
              <div>
                <button
                  type="button"
                  className="btn btn-bg-transparent"
                  onClick={() => setShowModal(true)}
                >
                  <img
                    className="icon-dark"
                    src="../../static/icons/arrows-maximize.svg"
                    alt="icon"
                  />
                  Fullscreen
                </button>
                <iframe
                  id="iframepdf"
                  src={fileContent}
                  width="100%"
                  height="1150px"
                  title="pdf"
                />
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <small className="text-muted">
                  When a file is uploaded to this document, a preview of that
                  file will be displayed here.
                </small>
              </div>
            )}
          </Col>
        </Row>
      ),
    },
    {
      eventKey: "issues",
      title: (
        <NotificationTabItem
          app={"documents"}
          dbObject={selectedDocument}
          title={"Issues"}
          issues={issues}
          bomIssues={[]}
        />
      ),
      content: (
        <IssuesTable
          dbObject={selectedDocument}
          issues={issues ?? []}
          app={"documents"}
          setRefresh={refreshIssues}
          revisionList={revisionList}
          useBomIssues={false}
          bomIssues={[]}
        />
      ),
    },
    {
      eventKey: "references",
      title: "References",
      content: (
        <div className="container mt-3">
          <ReferencedDocumentsTable document={selectedDocument} />
        </div>
      ),
    },
    {
      eventKey: "revisions",
      title: "Revisions",
      content: (
        <div className="container mt-3">
          <RevisionsTable
            app={"documents"}
            item={selectedDocument}
            setRevisionListParent={setRevisionList}
          />
        </div>
      ),
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <NavLink to={`/documents?search=${searchTerm}`}>
        <img
          // width="15px"
          className="icon-dark p-2 arrow-back"
          src="../../static/icons/arrow-left.svg"
          alt="icon"
        />
      </NavLink>
      <div className="">
        <Heading
          item_number={selectedDocument?.full_doc_number}
          display_name={selectedDocument?.title}
          is_latest_revision={selectedDocument?.is_latest_revision}
          app="documents"
        />
      </div>

      <DokulyTabs tabs={tabs} basePath={`/documents/${documentId}`} />

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="PDF Viewer"
        size="full-screen"
      >
        <iframe
          id="iframepdf-fullscreen"
          src={`${fileContent}#zoom=150`} // Set the zoom level to 150%
          width="100%"
          height="100%"
          title="pdf-fullscreen"
          style={{ border: "none" }}
        />
      </DokulyModal>
    </div>
  );
};

export default DisplayDocument;
