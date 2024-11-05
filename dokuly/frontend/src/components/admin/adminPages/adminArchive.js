import React, { useState, useEffect } from "react";
import { twoCardSkeletonLoader4ColTableLeftInfoTableRight } from "../functions/helperFunctions";
import { useSpring } from "react-spring";
import { domains } from "../functions/constants";
import {
  fetchArchivedDocuments,
  fetchArchivedImages,
  fetchArchivedLocations,
  fetchArchivedPrefixes,
  fetchArchivedProjects,
} from "../functions/queries";

const AdminArchive = (props) => {
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState(
    props.users !== null && props.users !== undefined ? props.users : []
  );
  const [customers, setCustomers] = useState(
    props.customers !== null && props.customers !== undefined
      ? props.customers
      : []
  );
  const [projects, setProjects] = useState(
    props.projects !== null && props.projects !== undefined
      ? props.projects
      : []
  );
  const [columns, setColumns] = useState(
    domains(props.users, props.projects, props.customers)
  );
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [data, setData] = useState(null);
  const [column, setColumn] = useState(null);

  const childToParent = (childData) => {
    if (childData.archived !== null && childData.archived !== undefined) {
      setData(childData.archived);
    }
    if (childData.prefixes !== null && childData.prefixes !== undefined) {
      const childRes = {
        newPrefixes: true,
        newData: childData.prefixes,
      };
      props.liftStateUp(childRes);
    }
    if (childData.projects !== null && childData.projects !== undefined) {
      const childRes = {
        newProjects: true,
        newData: childData.projects,
      };
      props.liftStateUp(childRes);
    }
    if (childData.documents !== null && childData.documents !== undefined) {
      const childRes = {
        newDocuments: true,
        newData: childData.documents,
      };
      props.liftStateUp(childRes);
    }
    if (childData.locations !== null && childData.locations !== undefined) {
      const childRes = {
        newLocations: true,
        newData: childData.locations,
      };
      props.liftStateUp(childRes);
    }
    if (
      childData.locationsTypes !== null &&
      childData.locationsTypes !== undefined
    ) {
      const childRes = {
        newLocationsTypes: true,
        newData: childData.locationsTypes,
      };
      props.liftStateUp(childRes);
    }
    setRefresh(true);
  };

  useEffect(() => {
    let fetched = false;
    if (refresh) {
      if (selectedDomain === "Projects" && !fetched) {
        fetchArchivedProjects().then((res) => {
          setData(res.data);
        });
        fetched = true;
      }
      if (selectedDomain === "Documents" && !fetched) {
        fetchArchivedDocuments().then((res) => {
          setData(res.data);
        });
        fetched = true;
      }
      if (selectedDomain === "Document Prefixes" && !fetched) {
        fetchArchivedPrefixes().then((res) => {
          setData(res.data);
        });
        fetched = true;
      }

      if (selectedDomain === "Locations" && !fetched) {
        fetchArchivedLocations().then((res) => {
          setData(res.data);
        });
        fetched = true;
      }
      if (selectedDomain === "Images" && !fetched) {
        fetchArchivedImages().then((res) => {
          setData(res.data);
        });
        fetched = true;
      }
    }
    setRefresh(false);
  }, [props, refresh]);

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  if (loading || loading2) {
    return twoCardSkeletonLoader4ColTableLeftInfoTableRight(12, spring);
  }

  return (
    <div>
      <div className="row">
        <div className="col">
          <div className="row card-body bg-white m-3 card rounded shadow">
            <div className="dropdown">
              <button
                className="btn btn-info dropdown-toggle"
                style={{ marginBottom: "1rem", marginLeft: "1rem" }}
                type="button"
                id="dropdownMenuButton"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {selectedDomain !== null ? selectedDomain : "Select A Category"}
              </button>
              <div
                className="dropdown-menu"
                aria-labelledby="dropdownMenuButton"
              >
                {columns.map((col, index) => {
                  return (
                    <a
                      className="dropdown-item"
                      key={index}
                      onClick={() => {
                        setSelectedDomain(col.domainName);
                        setColumn(col);
                        setRefresh(true);
                      }}
                    >
                      {col.domainName}
                    </a>
                  );
                })}
                <div className="dropdown-divider"></div>
                <a
                  className="dropdown-item"
                  onClick={() => {
                    setSelectedDomain(null);
                    setColumn(null);
                    setRefresh(true);
                  }}
                >
                  Deselect
                </a>
              </div>
            </div>
            <ArchiveList
              cols={column}
              data={data}
              childToParent={childToParent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminArchive;
