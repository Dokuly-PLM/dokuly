import React from "react";

export function attribute_icons(attributes) {
  // Object that maps attribute keys to icon names and descriptions
  const attributeIcons = {
    "Critical Stackup": {
      icon: "critical-stackup.svg",
      description:
        "The stackup of the PCB is integral to it working as designed.",
    },
    "Controlled Impedance": {
      icon: "controlled-impedance.svg",
      description:
        "Certain tracks in the PCBA must have a specified impedance to work as designed.",
    },
    "Flex PCB": {
      icon: "flex-pcb.svg",
      description: "The PCBA consists of a Flex PCB.",
    },
  };

  // Filter the attributes object to get only true attributes
  const trueAttributes = Object.entries(attributes || {})
    .filter(([attribute, value]) => value === true)
    .map(([attribute]) => attribute);

  // Map the true attributes to icon elements
  const iconElements = trueAttributes.map((attribute) => {
    const { icon, description } = attributeIcons[attribute];
    return (
      <div key={attribute} className="d-inline-block mr-2" title={description}>
        <img src={`../../static/icons/PCB/${icon}`} alt={attribute} />
      </div>
    );
  });

  // Render the icon elements
  return <>{iconElements}</>;
}
