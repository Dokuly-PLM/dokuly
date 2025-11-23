import React, { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import DocumentPrefixes from "../adminComponents/documents/documentPrefixes";
import ProtectionLevels from "../adminComponents/documents/protectionLevels";
import DocumentNumberSettings from "../adminComponents/documents/documentNumberSettings";
import {
  basicSkeletonLoaderInfoCard,
  basicSkeletonLoaderTableCard,
} from "../functions/helperFunctions";
import {
  fetchCustomers,
  fetchUsers,
  fetchPrefixes,
  fetchOrg,
} from "../functions/queries";
import { adminGetDocuments } from "../functions/queries";

const AdminDocuments = (props) => {
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [loading3, setLoading3] = useState(true);
  const [loading4, setLoading4] = useState(true);
  const [refresh, setRefresh] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState({});
  const [prefixes, setPrefixes] = useState(null);
  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState(
    props.users !== null && props.users !== undefined ? props.users : null
  );
  const [customers, setCustomers] = useState(
    props.customers !== null && props.customers !== undefined
      ? props.customers
      : null
  );
  const [projects, setProjects] = useState(
    props?.projects !== null && props?.projects !== undefined
      ? props?.projects
      : []
  );
  const [documents, setDocuments] = useState(null);

  const childToParent = (childData) => {
    if (childData?.newSelected) {
      if (childData?.data !== null && childData?.data !== undefined) {
        setSelectedDocument(childData.data);
        setRefresh(true);
      }
    }
    if (childData?.newData) {
      if (childData?.documents !== null && childData?.documents !== undefined) {
        setDocuments(childData?.documents);
        const childRes = {
          newDocuments: true,
          newData: childData.documents,
        };
        props.liftStateUp(childRes);
      }
      if (childData?.deactivated) {
        setSelectedDocument({});
      }
      if (
        childData?.newDocument !== null &&
        childData?.newDocument !== undefined
      ) {
        setSelectedDocument(childData?.newDocument);
      }
      setRefresh(true);
    }
  };

  useEffect(() => {
    let newDocuments = false;
    if (props?.documents !== null && props?.documents !== undefined) {
      newDocuments = true;
      setDocuments(props.documents);
    }
    if (refresh) {
      // Fetch organization data - always refetch when refresh is true
      fetchOrg()
        .then((res) => {
          if (res.status === 200) {
            setOrg(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching organization:", err);
        });

      if (documents == null && !newDocuments) {
        adminGetDocuments()
          .then((res) => {
            if (res.status === 200) {
              setDocuments(res.data);
            } else {
              setDocuments({ id: -1, data: "No data" });
            }
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
      if (customers == null) {
        fetchCustomers()
          .then((res) => {
            if (res.status === 200) {
              setCustomers(res.data);
            } else {
              setCustomers({ id: -1, data: "No data" });
            }
          })
          .finally(() => {
            setLoading2(false);
          });
      } else {
        setLoading2(false);
      }
      if (users == null) {
        fetchUsers()
          .then((res) => {
            if (res.status === 200) {
              setUsers(res.data);
            } else {
              setUsers({ id: -1, data: "No data" });
            }
          })
          .finally(() => {
            setLoading3(false);
          });
      } else {
        setLoading3(false);
      }
      if (prefixes == null) {
        fetchPrefixes()
          .then((res) => {
            setPrefixes(res.data);
          })
          .finally(() => {
            setLoading4(false);
          });
      } else {
        setLoading4(false);
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

  if (loading || loading2 || loading3 || loading4 || documents == null) {
    return (
      <div>
        <div className="row">
          <div className="col">
            <div className="row">
              {basicSkeletonLoaderTableCard(3, 3, spring)}
            </div>
            <div className="row">
              {basicSkeletonLoaderTableCard(5, 4, spring)}
            </div>
          </div>
          <div className="col">
            <div className="row">{basicSkeletonLoaderInfoCard(3, spring)}</div>
            <div className="row">{basicSkeletonLoaderInfoCard(3, spring)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row">
        <div className="col">
          <div className="row">
            <DocumentPrefixes
              users={users}
              projects={projects}
              documents={documents}
              customers={customers}
              childToParent={childToParent}
              setPrefixes={setPrefixes}
              selectedDocument={selectedDocument}
              prefixes={prefixes}
            />
          </div>
          <div className="row">
            <ProtectionLevels />
          </div>
        </div>
      </div>
      <div className="row mt-3">
        <div className="col">
          <DocumentNumberSettings 
            org={org} 
            setRefresh={setRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDocuments;
