import React, { useState, useEffect, useCallback } from "react";
import { Tabs, Tab, Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

const isInputFocused = () => {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (document.activeElement?.isContentEditable) return true;
  return false;
};

const DokulyTabs = ({ tabs, basePath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  const handleSelect = useCallback(
    (key) => {
      setActiveKey(key);
      navigate(`${basePath}/${key}`);
    },
    [basePath, navigate]
  );

  // Alt+number to switch tabs, show overlay while Alt is held
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Alt") {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (!e.altKey) return;
      if (isInputFocused()) return;

      // Use e.code because macOS Option+number produces special characters in e.key
      const match = e.code?.match(/^Digit(\d)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 9 && num <= tabs.length) {
          e.preventDefault();
          handleSelect(tabs[num - 1].eventKey);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Alt") {
        setShowShortcuts(false);
      }
    };

    // Hide overlay if window loses focus while Alt is held
    const handleBlur = () => setShowShortcuts(false);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [tabs, handleSelect]);

  return (
    <Container fluid className="mt-4">
      <Tabs
        id="generic-tabs"
        activeKey={activeKey}
        onSelect={handleSelect}
        className="mb-3"
      >
        {tabs.map((tab, index) => (
          <Tab
            className="mx-2"
            eventKey={tab.eventKey}
            disabled={
              tab?.disabled !== undefined || tab?.disabled !== null
                ? tab.disabled
                : false
            }
            title={
              <span style={{ marginBottom: 0, position: "relative" }}>
                {tab.title}
                {showShortcuts && index < 9 && (
                  <kbd
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-10px",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.5625rem",
                      fontWeight: 600,
                      background: "#165216",
                      color: "#fff",
                      borderRadius: "3px",
                      padding: "0px 4px",
                      lineHeight: "16px",
                      pointerEvents: "none",
                    }}
                  >
                    {index + 1}
                  </kbd>
                )}
              </span>
            }
            key={tab.eventKey}
          >
            {tab.content}
          </Tab>
        ))}
      </Tabs>
      {showShortcuts && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "14px",
            background: "#fff",
            border: "1px solid #E5E5E5",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "0.6875rem",
            color: "#6B7280",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 1040,
            pointerEvents: "none",
          }}
        >
          <span>
            <kbd className="dokuly-shortcut-kbd">⌥1-9</kbd> switch tab
          </span>
          <span>
            <kbd className="dokuly-shortcut-kbd">/</kbd> search table
          </span>
          <span>
            <kbd className="dokuly-shortcut-kbd">⌘K</kbd> jump to
          </span>
        </div>
      )}
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
