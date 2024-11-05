import React, { useEffect, useRef } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import SidebarIcon from "./dokulyIcons/sidebarIcon";

const Heading = ({
  item_number = "",
  revision = "",
  display_name = "",
  is_latest_revision = true,
  app = "",
}) => {
  const titleRef = useRef(null);

  const handleCopyToClipboard = (text) => {
    if (navigator?.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
      toast.info("Copied to clipboard");
    } else {
      toast.error("Clipboard not available, connection is not secure.");
    }
  };

  const resizeFont = () => {
    const titleElement = titleRef.current;
    if (!titleElement) return;

    const maxFontSize = 32;
    let fontSize = maxFontSize; // Start with maxFontSize
    titleElement.style.fontSize = `${fontSize}px`;

    // Adapt font size and div size based on the length of the content and viewport width
    if (window.innerWidth > 768 && display_name.length <= 40) {
      // When the screen is large and content is short, adjust to fit in one line
      titleElement.style["-webkit-line-clamp"] = "1";
      titleElement.style.height = "1.6em";
    } else {
      // Adjust for other conditions more dynamically
      titleElement.style.whiteSpace = "normal";
      while (
        titleElement.scrollHeight > titleElement.clientHeight &&
        fontSize > 12
      ) {
        fontSize--;
        titleElement.style.fontSize = `${fontSize}px`;
      }
    }
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
          <SidebarIcon app={app} width={45} />
        </Col>
        <Col className="justify-content-center align-items-center">
          <h2
            className="title-container mt-3"
            ref={titleRef}
            onClick={() =>
              handleCopyToClipboard(
                `${item_number}${revision} - ${display_name}`
              )
            }
            title="Click to copy to clipboard"
          >
            {`${item_number}${revision} - ${display_name}`}
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
