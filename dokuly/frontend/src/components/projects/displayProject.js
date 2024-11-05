import React, { useState, useEffect, useContext } from "react";
import {
  Link,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Col, Container, Row } from "react-bootstrap";

import TaskManager from "./projectTimeline/taskManager";
import {
  createGantt,
  fetchGantt,
  getProject,
  getProjectTasks,
} from "./functions/queries";
import Information from "./overViewTab/information";
import ErrorBoundary from "../common/errorBoundaries";
import DisplayGantt from "./gantt/displayGantt";
import { loadingSpinner } from "../admin/functions/helperFunctions";
import { AuthContext } from "../App";

import NoPermission from "../dokuly_components/noPermission";
import Heading from "../dokuly_components/Heading";
import ProjectDescription from "./projectDescription";

import useProfile from "../common/hooks/useProfile";
import { checkProfileIsAllowedToEdit } from "../common/functions";
import DokulyTabs from "../dokuly_components/dokulyTabs/dokulyTabs";

const DisplayProject = () => {
  const { id } = useParams(); // Use params to get the project ID from the URL
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState(null);
  const [ganttTasks, setGanttTasks] = useState(null);
  const [gantt, setGantt] = useState(-1);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [profile, refreshProfile] = useProfile();
  const [readOnly, setReadOnly] = useState(false);
  useEffect(() => {
    if (profile === null || profile === undefined) {
      return;
    }
    const isAllowed = checkProfileIsAllowedToEdit(profile?.role);
    setReadOnly(!isAllowed);
  }, [profile]);

  useEffect(() => {
    if (id) {
      // Fetch project details
      getProject(id)
        .then((res) => {
          if (res.status === 200) {
            setProject(res.data);
          } else {
            setError(true);
            setErrorMessage("Project not found or you do not have access.");
          }
        })
        .catch(() => {
          setError(true);
          setErrorMessage("Error fetching project details.");
        })
        .finally(() => setLoading(false));

      // Fetch project tasks
      getProjectTasks(id)
        .then((res) => {
          setTasks(res.data);
        })
        .catch(() => setTasks([]));

      // Fetch Gantt chart data
      fetchGantt(id)
        .then((res) => {
          setGantt(res.data.gantt);
          setGanttTasks(res.data.tasks || []);
        })
        .catch(() => setGanttTasks([]));
    }
  }, [id]);

  useEffect(() => {
    if (refresh) {
      // Fetch Gantt chart data
      fetchGantt(id)
        .then((res) => {
          setGantt(res.data.gantt);
          setGanttTasks(res.data.tasks || []);
        })
        .catch(() => setGanttTasks([]));

      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    if (project) {
      document.title = `Projects | ${project?.title ?? "Dokuly"}`;
    }
  }, [project]);

  // Define the tabs and their contents
  const tabs = [
    {
      eventKey: "overview",
      title: "Overview",
      content: (
        <Container fluid>
          <Row>
            <Col>
              <Information
                project={project}
                setRefresh={setRefresh}
                readOnly={readOnly}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <ProjectDescription
                item={project}
                setRefresh={setRefresh}
                readOnly={readOnly}
              />
            </Col>
          </Row>
        </Container>
      ),
    },
    {
      eventKey: "task-manager",
      title: "Task Manager",
      content: (
        <Container fluid>
          <TaskManager
            refresh={refresh}
            setRefresh={setRefresh}
            tasks={tasks}
            project={project}
          />
        </Container>
      ),
    },
    {
      eventKey: "gantt-manager",
      title: "Gantt Diagram",
      content: (
        <Container fluid>
          <DisplayGantt
            refresh={refresh}
            setRefresh={setRefresh}
            tasks={ganttTasks ?? []}
            gantt={gantt}
            project={project}
          />
        </Container>
      ),
    },
  ];

  if (loading) return loadingSpinner();
  if (error) return <NoPermission errorMessage={errorMessage} />;

  return (
    <React.Fragment>
      <div
        className="container-fluid mt-2 mainContainerWidth"
        style={{ paddingBottom: "1rem", maxWidth: "87.77vw" }}
      >
        <NavLink to={"/projects"}>
          <img
            // width="15px"
            className="icon-tabler-dark"
            src="../../static/icons/arrow-left.svg"
            alt="icon"
          />
        </NavLink>
        <div>
          <Heading
            item_number={project?.full_number}
            display_name={project?.title}
            app="projects"
          />
        </div>
        <ErrorBoundary>
          <DokulyTabs tabs={tabs} basePath={`/projects/${id}`} />
        </ErrorBoundary>
      </div>
    </React.Fragment>
  );
};

export default DisplayProject;
