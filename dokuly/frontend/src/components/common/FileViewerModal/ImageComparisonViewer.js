import React, { useState } from "react";
import { Form } from "react-bootstrap";

export default function ImageComparisonViewer({
  originalFileUri,
  comparisonFileUri,
}) {
  const [opacity, setOpacity] = useState(50); // 0-100

  return (
    <div className="image-comparison-viewer">
      <div className="image-controls mb-3">
        <div className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0">Overlay Opacity: {opacity}%</Form.Label>
          <Form.Range
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(parseInt(e.target.value))}
            style={{ width: "200px" }}
          />
        </div>
      </div>
      <div
        className="image-container"
        style={{
          position: "relative",
          width: "100%",
          height: "80vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* Original Image (base layer) */}
          <img
            src={originalFileUri}
            alt="Original"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              display: "block",
            }}
          />
          {/* Comparison Image (overlay layer) */}
          {comparisonFileUri && (
            <img
              src={comparisonFileUri}
              alt="Comparison"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                maxWidth: "100%",
                maxHeight: "80vh",
                opacity: opacity / 100,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
      <style>{`
        .image-comparison-viewer {
          width: 100%;
          height: 100%;
        }
        .image-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 10px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
}

