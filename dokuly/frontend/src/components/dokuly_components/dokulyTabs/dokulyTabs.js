import React, { useState, useEffect } from "react";
import { Tabs, Tab, Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const DokulyTabs = ({ tabs, basePath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    // Extract the relevant part of the path
    const path = location.pathname;
    const baseIndex = path.indexOf(basePath);

    if (baseIndex === -1) {
      setActiveKey(tabs[0].eventKey); // default to first tab if basePath is not found
      return;
    }

    const relevantPath = path
      .substring(baseIndex + basePath.length)
      .split("/")
      .filter(Boolean);
    const tabKey = relevantPath[0] || tabs[0].eventKey; // Use the first segment after the basePath as the tab key
    const matchedTab = tabs.find((tab) => tab.eventKey === tabKey);

    // Set active tab based on URL segment, default to first tab if no match
    setActiveKey(matchedTab ? matchedTab.eventKey : tabs[0].eventKey);
  }, [location, tabs, basePath]);

  const handleSelect = (key) => {
    setActiveKey(key);
    // Navigate to the new tab URL, ensuring it's appended to the basePath
    navigate(`${basePath}/${key}`);
  };

  return (
    <Container fluid className="mt-4">
      <Tabs
        id="generic-tabs"
        activeKey={activeKey}
        onSelect={handleSelect}
        className="mb-3"
      >
        {tabs.map((tab) => (
          <Tab
            className="mx-2"
            eventKey={tab.eventKey}
            disabled={
              tab?.disabled !== undefined || tab?.disabled !== null
                ? tab.disabled
                : false
            }
            title={
              <h6
                style={{
                  paddingLeft: "1.2rem",
                  paddingRight: "1.2rem",
                  marginBottom: "0rem",
                  minWidth: "150px",
                }}
              >
                {tab.title}
              </h6>
            }
            key={tab.eventKey}
          >
            {tab.content}
          </Tab>
        ))}
      </Tabs>
    </Container>
  );
};

DokulyTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      eventKey: PropTypes.string.isRequired,
      title: PropTypes.node,
      content: PropTypes.element.isRequired,
    })
  ).isRequired,
  basePath: PropTypes.string.isRequired, // Base path for tabs
};

export default DokulyTabs;
