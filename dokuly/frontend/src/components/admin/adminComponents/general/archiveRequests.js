import React, { useState, useEffect } from "react";
import { useSpring, animated, config } from "react-spring";
import { basicSkeletonLoaderTableCard } from "../../functions/helperFunctions";
import { testEmail } from "../../functions/queries";

const ArchiveRequests = (props) => {
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
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
    return basicSkeletonLoaderTableCard(3, 10, spring);
  }

  return (
    <div className="card-body card rounded bg-white m-3-sm rounded">
      <div className="row">
        <div className="col">
          <h5>
            <b>Archive Requests</b>
          </h5>
        </div>
        <div className="col">
          <a>Coming soon!</a>
        </div>
      </div>
    </div>
  );
};

export default ArchiveRequests;
