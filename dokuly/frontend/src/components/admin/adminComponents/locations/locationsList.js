import React, { useState, useEffect } from "react";
import { useSpring } from "react-spring";
import { basicSkeletonLoaderTableCard } from "../../functions/helperFunctions";
import { Card } from "react-bootstrap";
import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import LocationForm from "./locationForm";
import EditLocationForm from "./editLocationForm";
import { paginationOptions } from "../../functions/constants";

const LocationsList = (props) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (props?.locations) {
      setLocations(props.locations);
    }
    setLoading(false);
  }, [props.locations]);

  const nameFormatter = (cell, row) => {
    if (row?.container_type_archived) {
      return (
        <span>
          <img
            src="../../../../static/icons/alert-circle.svg"
            style={{
              filter:
                "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
            }}
            className="ml-1"
            width="30px"
            height="30px"
            alt="Archived"
          />
          {row.name}
        </span>
      );
    }
    return row.name;
  };

  const editFormatter = (cell, row) => {
    let rowToEdit =
      props.locations.find((location) => location.id === row.id) || {};
    return (
      <EditLocationForm
        location={rowToEdit}
        locationTypes={props.locationTypes}
        setRefresh={props.setRefresh}
      />
    );
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      formatter: (row, col) => nameFormatter(null, row),
    },
    {
      key: "container_type_custom",
      header: "Container Type",
    },
    {
      key: "notes",
      header: "Notes",
    },
    {
      key: "edit",
      header: "Edit",
      formatter: (row, col) => editFormatter(null, row),
      includeInCsv: false,
    },
  ];

  const springProps = useSpring({
    to: [{ opacity: 1 }, { opacity: 0 }],
    from: { opacity: 0 },
    config: { duration: 1000 },
    loop: true,
  });

  if (loading) {
    return (
      <Card className="rounded p-5">
        {basicSkeletonLoaderTableCard(10, 4, springProps)}
      </Card>
    );
  }

  return (
    <Card className="rounded p-3 mt-2 shadow-none">
      <Card.Body>
        <Card.Title>Locations</Card.Title>
        <div className="mb-3">
          <LocationForm
            locationTypes={props.locationTypes}
            setOpen={setOpen}
            setRefresh={props.setRefresh}
          />
        </div>

        <Card className="rounded p-3 mt-2 shadow-none">
          <Card.Body>
            <DokulyTable
              data={locations}
              columns={columns}
              itemsPerPage={paginationOptions(25).sizePerPageList[0].text}
              showPagination={true}
              showSearch={true}
            />
          </Card.Body>
        </Card>

        <small>
          Locations describe the physical storage of parts and can have various
          types such as shelves, containers, and feeders. Each location is
          associated with a location type and can have additional details such
          as row and column numbers or notes.
        </small>
      </Card.Body>
    </Card>
  );
};

export default LocationsList;
