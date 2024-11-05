import React from "react";

function LegacyCustomSpecifications({ part }) {
  if (!part.customSpecs || part.customSpecs.length === 0) {
    return null;
  }

  return (
    <div className="col-md-auto mb-2">
      <h5>
        <b>Custom Specifications</b>
      </h5>
      <ul className="list-group list-group-flush">
        {part.customSpecs.map((spec, index) => {
          const split = spec.split(",");
          const name = split[0];
          const display_value = split[1];
          return (
            <li key={name + index} className="list-group-item">
              {name}: {display_value}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default LegacyCustomSpecifications;
