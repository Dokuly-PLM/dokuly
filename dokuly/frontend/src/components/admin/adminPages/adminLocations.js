import React, { useState, useEffect } from "react";
import {
  basicSkeletonLoaderInfoCard,
  basicSkeletonLoaderTableCard,
} from "../functions/helperFunctions";
import { useSpring } from "react-spring";
import ContainerList from "../adminComponents/locations/containerList";
import LocationsList from "../adminComponents/locations/locationsList";
import { fetchLocations, getLocationTypes } from "../functions/queries";

const AdminLocations = () => {
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(true);
  const [locations, setLocations] = useState([]);
  const [locationTypes, setLocationTypes] = useState([]);

  useEffect(() => {
    if (refresh === true) {
      getLocationTypes().then((res) => {
        if (res.status === 200) {
          setLocationTypes(res.data);
        }

        fetchLocations()
          .then((res) => {
            if (res.status === 200) {
              setLocations(res.data);
            }
          })
          .finally(() => {
            setLoading(false);
            setRefresh(false);
          });
      });
    }
  }, [refresh]);

  const spring = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: "#A9A9A9" }, // Dark gray
      { opacity: 0.1, color: "gray" },
    ],
    from: { opacity: 0.1, color: "#D3D3D3" }, // Light gray
  });

  if (loading) {
    return (
      <div>
        <div className="row">
          <div className="col">
            {basicSkeletonLoaderTableCard(3, 3, spring)}
          </div>
          <div className="col">
            <div className="row">{basicSkeletonLoaderInfoCard(3, spring)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="row justify-content-center mr-5">
        <div className="col-6">
          <ContainerList
            types={locationTypes}
            locations={locations}
            setRefresh={setRefresh}
          />
        </div>
        <div className="col-6">
          <LocationsList
            locations={locations}
            locationTypes={locationTypes}
            setRefresh={setRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLocations;
