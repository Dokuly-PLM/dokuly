import React, { useState, useEffect } from "react";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import { basicSkeletonLoaderTableCard } from "../../functions/helperFunctions";
import ProjectForm from "./projectForm";
import { useSpring } from "react-spring";

const ProjectList = (props) => {
  const [data, setData] = useState(
    props.data !== null && props.data !== undefined ? props.data : []
  );
  const [refresh, setRefresh] = useState(false);
  const [users, setUsers] = useState(
    props.users !== null && props.users !== undefined ? props.users : []
  );
  const [loading, setLoading] = useState(true);
  const [refetch, setRefetch] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState(
    props.customers !== null && props.customers !== undefined
      ? props.customers
      : false
  );
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const filterCustomer = (arr, customer) => {
    const filteredProjects = [];
    let id = -1;
    if (customer?.id !== null && customer?.id !== undefined) {
      id = customer?.id;
    } else {
      id = customer;
    }
    if (id !== -1) {
      if (arr !== null && arr !== undefined && arr.length > 0) {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].customer === parseInt(id)) {
            filteredProjects.push(arr[i]);
          }
        }
      }
    }
    return filteredProjects;
  };

  useEffect(() => {
    setSelectedProject(props?.selectedProject);
  }, [props?.selectedProject]);

  const loadStates = () => {
    if (props?.data !== (null || undefined)) {
      if (showInactive) {
        setData(props.data);
      } else {
        const filteredProjects = props.data.filter(
          (project) => project.is_active === true
        );
        setData(filteredProjects);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (showInactive) {
      setData(props.data);
    } else {
      const filteredProjects = props.data.filter(
        (project) => project.is_active === true
      );
      setData(filteredProjects);
    }
  }, [showInactive]);

  useEffect(() => {
    if (!refresh && !refetch) {
      loadStates();
    }
    setRefresh(false);
    setRefetch(false);
  }, [props, refresh]);

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  if (loading) {
    return basicSkeletonLoaderTableCard(12, 5, spring);
  }

  const numberFormatter = (row) => {
    if (row?.full_number) {
      return <span>{row.full_number}</span>;
    }
    return <span>{row.project_number}</span>;
  };

  const titleFormatter = (row) => {
    return <span>{row.title}</span>;
  };

  const customerFormatter = (row) => {
    for (let i = 0; i < customers.length; i++) {
      if (parseInt(row.customer) == parseInt(customers[i].id)) {
        return <span>{customers[i].name}</span>;
      }
    }
  };

  const columns = [
    {
      key: "project_number",
      header: "Project number",
      includeInCsv: true,
      formatter: numberFormatter,
    },
    {
      key: "title",
      header: "Title",
      includeInCsv: true,
      formatter: titleFormatter,
    },

    {
      key: "customer",
      header: "Customer",
      includeInCsv: true,
      formatter: customerFormatter,
    },
    {
      key: "is_active",
      header: "Active",
      includeInCsv: false,
      formatter: (row, column) => {
        if (row.is_active) {
          return <span>Yes</span>;
        } else {
          return <span>No</span>;
        }
      },
    },
  ];

  const handleRowClick = (index) => {
    const selectedRow = data[index];

    setSelectedProject(selectedRow);
    setIsModalOpen(true);
    setSelectedProjectIndex(selectedRow.id);
  };

  if (loading) {
    return basicSkeletonLoaderTableCard(
      12,
      5,
      useSpring({
        loop: true,
        to: [{ opacity: 1, color: "#A9A9A9" }],
        from: { opacity: 0.1, color: "#D3D3D3" },
      })
    );
  }

  return (
    <>
      <div className="card-body bg-white m-3 card rounded">
        <div className="row mt-3 ml-1">
          <div className="col-12 p-2 d-flex align-items-center">
            <input
              className="dokuly-checkbox ml-2"
              type="checkbox"
              checked={showInactive}
              onChange={() => setShowInactive(!showInactive)}
            />
            <label className="form-check-label ml-1" htmlFor="flexCheckDefault">
              Show inactive projects
            </label>
          </div>
        </div>

        <DokulyTable
          data={data}
          columns={columns}
          onRowClick={handleRowClick}
          selectedRowIndex={selectedProjectIndex}
          showCsvDownload={false}
          showPagination={true}
          showSearch={true}
          itemsPerPage={25}
        />
      </div>
      <ProjectForm
        show={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        project={selectedProject}
        users={users}
        setRefresh={props.setRefresh}
      />
    </>
  );
};

export default ProjectList;
