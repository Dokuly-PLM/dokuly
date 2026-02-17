import React, { useEffect, Fragment, useState } from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  BrowserRouter,
  HashRouter,
  useLocation,
  useNavigate,
  createBrowserRouter,
  Navigate,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot } from "react-dom/client";
import TopHeader from "./layout/TopHeader";
import Login from "./accounts/Login";
import ProjectsDashboard from "./projects/ProjectsDashboard";
import DisplayProject from "./projects/displayProject";
import TimetrackingDashboard from "./timetracking/timetrackingDashboard";
import CustomersDashboard from "./customers/customerDashboard";
import TimesheetAdminDashboard from "./timesheetAdmin/timesheetAdminDashboard";
import ProfileDashboard from "./profiles/profileDashboard";
import PartsDahboard from "./parts/PartsDashboard";
import AssemblyDashboard from "./assemblies/assemblyDashboard";
import DocumentsDashboard from "./documents/documentsDashboard";
import DisplayDocument from "./documents/displayDocument2";
import PcbaDashboard from "./pcbas/pcbaOverviewDashboard";
import TestUserSetup from "./admin/adminComponents/general/testUser";
import SuppliersDashboard from "./suppliers/suppliersDashboard";
import DisplayPcba from "./pcbas/displayPcba";
import DisplayPart from "./parts/displayPart";
import DisplayASM from "./assemblies/displayAsm";
import AdminDash from "./admin/adminDash";
import Sidebar from "./layout/Sidebar";
import ResetPassword from "./accounts/ResetPassword";
import RequireAuth from "./common/requireAuth";
import PurchasingDashboard from "./purchasing/purchasingDashboard";
import DisplayPurchaseOrder from "./purchasing/displayPurchaseOrder";
import HomepageDashboard from "./homepage/homepageDashboard";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { getUser, checkOrganizationSubscription } from "./common/queries";
import { resetPassword } from "./admin/functions/queries";
import ProductionDashBoard from "./production/productionDashboard";
import DisplayProducedItem from "./production/dispayProducedItem/displayProducedItem";
import clearLocalStorageData from "./dokuly_components/funcitons/clearLocalStorageData";
import RequirementDashboard from "./requirements/requirementDashboard";
import DisplayRequirementSet from "./requirements/displayRequirementSet";
import DisplayRequirement from "./requirements/displayRequirement";
import DisplaySupplier from "./suppliers/displaySupplier";
import DisplayIssue from "./dokuly_components/dokulyIssues/displayIssue";
import DisplayLot from "./production/lots/displayLot";
import EcoDashboard from "./eco/ecoDashboard";
import DisplayEco from "./eco/displayEco";

// Component to track page views

export const AuthContext = React.createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState("Free"); // Free, Projects, Professional
  const [user, setUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getUser()
      .then((res) => {
        if (res.status === 200) {
          setIsAuthenticated(true);
          setUser(res.data);
          checkOrganizationSubscription().then((res) => {
            setSubscriptionType(res.data);
          });
        } else {
          setIsAuthenticated(false);
          clearLocalStorageData();
        }
      })
      .catch((err) => {
        if (err) {
          if (location.pathname.toString().includes("/passwordRecovery")) {
            if (localStorage.getItem("token")) {
              localStorage.removeItem("token");
              localStorage.removeItem("token_created");
            }
          }
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        setLoadingApp(false);
      });
  }, []);

  useEffect(() => {
    // This useEffect forces the login path if user is not logged in
    // it also makes login not possible to access if the user already is authenticated
    if (!loadingApp) {
      if (
        location.pathname !== "/login" &&
        !location.pathname.toString().includes("/passwordRecovery") &&
        !isAuthenticated
      ) {
        navigate("/login");
        document.title = "Login | Dokuly";
      }
      if (location.pathname === "/login" && isAuthenticated) {
        if (localStorage.getItem("prevPath")) {
          navigate(localStorage.getItem("prevPath").toString(""));
          const pathname = localStorage
            .getItem("prevPath")
            .toString("")
            .split("/")[1];
          const firstChar = pathname.charAt(0).toUpperCase();
          const newString = firstChar + pathname.slice(1, pathname.length);
          document.title = `${newString} | Dokuly`;
        } else {
          navigate("/");
          document.title = "Timesheet | Dokuly";
        }
      }
    }
  }, [location, navigate, isAuthenticated, loadingApp]);

  if (loadingApp) {
    return (
      <TopHeader
        isAuthenticated={isAuthenticated}
        user={user}
        setIsAuthenticated={setIsAuthenticated}
      />
      // TODO create a nice loading thingy here
    );
  }

  if (!isAuthenticated) {
    clearLocalStorageData();
    return (
      <AuthContext.Provider
        value={{
          isAuthenticated,
          setIsAuthenticated,
          subscriptionType,
          setSubscriptionType,
          user,
        }}
      >
        <ToastContainer
          position="top-right"
          autoClose={5000}
          limit={5}
          hideProgressBar
          newestOnTop={false}
          transition={Slide}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <TopHeader
          isAuthenticated={isAuthenticated}
          user={user}
          setIsAuthenticated={setIsAuthenticated}
        />
        <Routes>
          <Route
            exact={true}
            path="/login"
            element={<Login setUser={setUser} />}
          />
          <Route
            path="/passwordRecovery/:id/:id"
            element={
              <ResetPassword
                setUser={setUser}
                isAuthenticated={isAuthenticated}
              />
            }
          />
        </Routes>
      </AuthContext.Provider>
    );
  }

  const adminPaths = [
    "/adminPage",
    "/adminPage/general",
    "/adminPage/users",
    "/adminPage/projects",
    "/adminPage/documents",
    "/adminPage/parts",
    "/adminPage/releaseManagement",
    "/adminPage/locations",
    "/adminPage/api",
    "/adminPage/rules",
    "/adminPage/integrations",
    // add other paths as needed
  ];

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        subscriptionType,
        setSubscriptionType,
      }}
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        limit={5}
        hideProgressBar
        newestOnTop={false}
        transition={Slide}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Fragment>
        <TopHeader
          isAuthenticated={isAuthenticated}
          user={user}
          setIsAuthenticated={setIsAuthenticated}
        />
        <div id="parentWrapper">
          <div id="sidebarWrapper">
            <Sidebar
              isAuthenticated={isAuthenticated}
              user={user}
              subscriptionType={subscriptionType}
              setSubscriptionType={setSubscriptionType}
            />
          </div>
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-12">
                <main role="main">
                  <div>
                    <DndProvider backend={HTML5Backend}>
                      <Routes>
                        <Route
                          element={
                            <RequireAuth
                              isAuthenticated={isAuthenticated}
                              user={user}
                              setIsAuthenticated={setIsAuthenticated}
                            />
                          }
                        >
                          <Route path="/" element={<HomepageDashboard />} />
                          <Route path="/home" element={<HomepageDashboard />} />

                          {adminPaths.map((path) => (
                            <Route
                              key={path}
                              exact={true}
                              path={path}
                              element={<AdminDash />}
                            />
                          ))}

                          <Route
                            exact={true}
                            path="/issues/:id"
                            element={<DisplayIssue />}
                          />

                          <Route
                            exact={true}
                            path="/assemblies/:id/*"
                            element={<DisplayASM />}
                          />

                          <Route
                            exact={true}
                            path="/assemblies"
                            element={<AssemblyDashboard />}
                          />

                          <Route
                            exact={true}
                            path="/adminPage/testUser/"
                            element={<TestUserSetup />}
                          />
                          <Route
                            exact={true}
                            path="/profile"
                            element={<ProfileDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/timesheet"
                            element={<TimetrackingDashboard />}
                          />

                          <Route
                            exact={true}
                            path="/projects"
                            element={<ProjectsDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/projects/:id/*"
                            element={<DisplayProject />}
                          />
                          <Route
                            exact={true}
                            path="/customers"
                            element={<CustomersDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/timeReport"
                            element={<TimesheetAdminDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/parts"
                            element={<PartsDahboard />}
                          />
                          <Route
                            exact={true}
                            path="/parts/:id/*"
                            element={<DisplayPart />}
                          />

                          <Route
                            exact={true}
                            path="/documents"
                            element={<DocumentsDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/documents/:id/*"
                            element={<DisplayDocument />}
                          />
                          <Route
                            exact={true}
                            path="/pcbas"
                            element={<PcbaDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/procurement"
                            element={<PurchasingDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/procurement/:id/*"
                            element={<DisplayPurchaseOrder />}
                          />
                          <Route
                            exact={true}
                            path="/suppliers"
                            element={<SuppliersDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/suppliers/:id"
                            element={<DisplaySupplier />}
                          />
                          <Route
                            exact={true}
                            path="/pcbas/:id/*"
                            element={<DisplayPcba />}
                          />

                          <Route
                            exact={true}
                            path="/requirements"
                            element={<RequirementDashboard />}
                          />

                          <Route
                            exact={true}
                            path="/requirement/:id"
                            element={<DisplayRequirement />}
                          />

                          <Route
                            exact={true}
                            path="/requirements/set/:id"
                            element={<DisplayRequirementSet />}
                          />

                          <Route
                            exact={true}
                            path="/production"
                            element={<ProductionDashBoard />}
                          />
                          <Route
                            exact={true}
                            path="/production/:id"
                            element={<DisplayProducedItem />}
                          >
                            <Route
                              path="overview"
                              element={<DisplayProducedItem />}
                            />
                            <Route
                              path="notes"
                              element={<DisplayProducedItem />}
                            />
                          </Route>
                          <Route
                            exact={true}
                            path="/production/lot/:id/*"
                            element={<DisplayLot />}
                          />

                          <Route
                            exact={true}
                            path="/eco"
                            element={<EcoDashboard />}
                          />
                          <Route
                            exact={true}
                            path="/eco/:id/*"
                            element={<DisplayEco />}
                          />
                        </Route>
                      </Routes>
                    </DndProvider>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    </AuthContext.Provider>
  );
}

export default App;
