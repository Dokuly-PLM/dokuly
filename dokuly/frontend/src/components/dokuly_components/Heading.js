import React, { useEffect, useRef } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import SidebarIcon from "./dokulyIcons/sidebarIcon";
import { copyToClipboard } from "./funcitons/copyToClipboard";

const Heading = ({
  item_number = "",
  revision = "",
  display_name = "",
  is_latest_revision = true,
  app = "",
  organization = null,
  icon_url = null,
}) => {
  const titleRef = useRef(null);

  const handleCopyToClipboard = (text) => {
    copyToClipboard(text);
  };

  const resizeFont = () => {
    const titleElement = titleRef.current;
    if (!titleElement) return;

    // Scale font size down slightly for very long names, but always allow full wrapping
    const maxFontSize = 32;
    const minFontSize = 14;
    let fontSize = maxFontSize;
    if (display_name.length > 100) {
      fontSize = minFontSize + 4;
    } else if (display_name.length > 60) {
      fontSize = 20;
    }
    titleElement.style.fontSize = `${fontSize}px`;
  };

  useEffect(() => {
    resizeFont();
    window.addEventListener("resize", resizeFont);

    return () => {
      window.removeEventListener("resize", resizeFont);
    };
  }, [display_name]); // Depend on display_name to update on changes

  return (
    <div className="heading-container">
      <Row className="align-items-center">
        <Col className="col-auto justify-content-top">
          {icon_url ? (
            <img
              src={icon_url}
              alt="type icon"
              width={45}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <SidebarIcon app={app} width={45} />
          )}
        </Col>
        <Col className="justify-content-center align-items-center">
          <h2
            className="title-container title-container--copyable mt-3"
            ref={titleRef}
            onClick={() => {
              handleCopyToClipboard(`${item_number} - ${display_name}`);
            }}
            title="Click to copy to clipboard"
          >
            {item_number} - {display_name}
            <img
              className="title-container__copy-icon"
              src="../../../static/icons/copy.svg"
              alt="Copy"
            />
            {!is_latest_revision && (
              <span>
                <img
                  src="../../../static/icons/alert-circle.svg"
                  className="ml-2"
                  style={{
                    filter:
                      "invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
                  }}
                  alt="alert"
                  data-toggle="tooltip"
                  data-placement="top"
                  title="A newer revision of this assembly exists!"
                  height="40px"
                  width="40px"
                />
              </span>
            )}
          </h2>
        </Col>
      </Row>
    </div>
  );
};

export default Heading;
