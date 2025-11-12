import React from "react";
import { Card, Table } from "react-bootstrap";
import { manageActiveModules } from "../../functions/queries";

const ActiveModules = ({ org, setRefresh }) => {
  if (!org) {
    return null;
  }

  // Array of module configurations for dynamic generation of table rows
  const modules = [
    {
      id: "time_tracking",
      label: "Time Tracking",
      isEnabled: "time_tracking_is_enabled",
    },
    { id: "document", label: "Document", isEnabled: "document_is_enabled" },
    { id: "pcba", label: "PCBA", isEnabled: "pcba_is_enabled" },
    { id: "assembly", label: "Assembly", isEnabled: "assembly_is_enabled" },
    {
      id: "procurement",
      label: "Procurement",
      isEnabled: "procurement_is_enabled",
    },
    {
      id: "requirements",
      label: "Requirements",
      isEnabled: "requirement_is_enabled",
    },
    {
      id: "production",
      label: "Production",
      isEnabled: "production_is_enabled",
    },
  ];

  const handleCheckboxChange = (moduleConfig, isChecked) => {
    const data = { [moduleConfig.isEnabled]: isChecked };

    manageActiveModules(data).then((res) => {
      setRefresh(true);
    });
  };

  return (
    <Card className="px-3">
      <Card.Body className="rounded bg-white">
        <Card.Title>
          <b>Active Modules</b>
        </Card.Title>
        <Table bordered hover>
          <thead>
            <tr>
              <th>Module</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id}>
                <td>{module.label}</td>
                <td>
                  <input
                    className="dokuly-checkbox"
                    type="checkbox"
                    checked={org[module.isEnabled]}
                    onChange={(e) =>
                      handleCheckboxChange(module, e.target.checked)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ActiveModules;
