import React, { useState, useEffect } from "react";
import {
  basicSkeletonLoaderInfoCard,
  basicSkeletonLoaderTableCard,
} from "../functions/helperFunctions";
import { useSpring } from "react-spring";

const AdminAsm = (props) => {
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [data, setData] = useState(
    props.data !== null && props.data !== undefined ? props.data : null
  );

  useEffect(() => {
    if (data == null) {
      // refetch
    }
    setLoading(false);
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
          <div className="row"></div>
          <div className="row"></div>
        </div>
        <div className="col">
          <div className="row"></div>
          <div className="row"></div>
        </div>
      </div>
    </div>
  );
};

export default AdminAsm;
