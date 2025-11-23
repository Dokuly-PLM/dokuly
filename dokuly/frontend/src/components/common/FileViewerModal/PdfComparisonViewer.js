import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import SubmitButton from "../../dokuly_components/submitButton";
import { getFile } from "../filesTable/functions/queries";

export default function PdfComparisonViewer({
  originalFileUri,
  originalBlobUrl: providedOriginalBlobUrl,
  comparisonFileUri,
}) {
  const [opacity, setOpacity] = useState(50); // 0-100
  const [loading, setLoading] = useState(true);
  const [originalBlobUrl, setOriginalBlobUrl] = useState(null);
  const [comparisonBlobUrl, setComparisonBlobUrl] = useState(null);

  // Cleanup blob URLs on unmount
  // Note: We create new blob URLs here, so we need to clean them up
  // But we should NOT revoke the originalFileUri if it was passed as a blob URL
  useEffect(() => {
    return () => {
      // Only revoke blob URLs that we created ourselves
      // Don't revoke the originalFileUri if it was passed as a blob URL from parent
      if (originalBlobUrl?.startsWith("blob:") && originalBlobUrl !== originalFileUri) {
        URL.revokeObjectURL(originalBlobUrl);
      }
      if (comparisonBlobUrl?.startsWith("blob:") && comparisonBlobUrl !== comparisonFileUri) {
        URL.revokeObjectURL(comparisonBlobUrl);
      }
    };
  }, [originalBlobUrl, comparisonBlobUrl, originalFileUri, comparisonFileUri]);

  useEffect(() => {
    // Always fetch from originalFileUri to create a fresh, valid blob URL
    // The provided blob URL might be revoked or invalid
    if (originalFileUri && !originalFileUri.startsWith("blob:")) {
      console.log("Fetching original PDF from URI:", originalFileUri);
      setLoading(true);
      getFile(originalFileUri)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          console.log("Original PDF blob URL created:", url, "Blob type:", blob.type, "Blob size:", blob.size);
          setOriginalBlobUrl(url);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error loading original PDF:", error);
          setLoading(false);
        });
    } else if (originalFileUri?.startsWith("blob:")) {
      // If originalFileUri is a blob URL, try to fetch it to create a fresh one
      console.log("Original file URI is a blob URL, recreating:", originalFileUri);
      setLoading(true);
      fetch(originalFileUri)
        .then((response) => {
          if (!response?.ok) {
            throw new Error(`HTTP error! status: ${response?.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          console.log("Original PDF blob URL recreated:", url);
          setOriginalBlobUrl(url);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error recreating blob URL:", error);
          setLoading(false);
        });
    }
    if (comparisonFileUri) {
      // Check if it's already a blob URL
      if (comparisonFileUri.startsWith("blob:")) {
        setComparisonBlobUrl(comparisonFileUri);
      } else {
        getFile(comparisonFileUri)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            setComparisonBlobUrl(url);
          })
          .catch((error) => {
            console.error("Error loading comparison PDF:", error);
          });
      }
    }
  }, [originalFileUri, comparisonFileUri]);

  if (!originalBlobUrl) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>Loading PDFs...</div>
        {loading && <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>Please wait...</div>}
      </div>
    );
  }

  return (
    <div className="pdf-comparison-viewer" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: "500px" }}>
      <div className="pdf-controls" style={{ padding: "15px", background: "#f8f9fa", borderBottom: "2px solid #dee2e6", flexShrink: 0, zIndex: 10 }}>
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              Use the browser's PDF controls to navigate
            </span>
          </div>
          <div className="d-flex align-items-center gap-3" style={{ minWidth: "350px", padding: "5px 10px", background: "white", borderRadius: "4px", border: "1px solid #ced4da" }}>
            <Form.Label className="mb-0" style={{ whiteSpace: "nowrap", fontSize: "14px", fontWeight: "600", marginRight: "15px", color: "#495057" }}>
              Overlay Opacity: <strong style={{ color: "#007bff" }}>{opacity}%</strong>
            </Form.Label>
            <Form.Range
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number.parseInt(e.target.value, 10))}
              style={{ 
                width: "300px", 
                minWidth: "250px", 
                cursor: "pointer",
                height: "8px",
                backgroundColor: "#e9ecef"
              }}
            />
          </div>
        </div>
      </div>
      <div 
        className="pdf-container" 
        style={{ 
          position: "relative", 
          width: "100%", 
          flex: "1", 
          overflow: "hidden",
          backgroundColor: "#f5f5f5"
        }}
      >
        {/* Original PDF (base layer) - always render first */}
        {originalBlobUrl ? (
          <iframe
            id="iframepdf-original"
            src={`${originalBlobUrl}#view=fitv`}
            width="100%"
            height="100%"
            title="original-pdf"
            style={{ 
              border: "none", 
              position: "absolute", 
              top: 0, 
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              zIndex: 1,
              backgroundColor: "white"
            }}
            onLoad={() => {
              console.log("Original PDF iframe loaded successfully, src:", originalBlobUrl);
            }}
            onError={(e) => {
              console.error("Error loading original PDF iframe:", e);
              console.error("Blob URL was:", originalBlobUrl);
            }}
          />
        ) : (
          <div style={{ padding: "20px", textAlign: "center", color: "#666", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            Loading original PDF...
          </div>
        )}
        {/* Comparison PDF (overlay layer) - always render but control visibility with opacity */}
        {comparisonBlobUrl && (
          <iframe
            id="iframepdf-comparison"
            src={`${comparisonBlobUrl}#view=fitv`}
            width="100%"
            height="100%"
            title="comparison-pdf"
            style={{ 
              border: "none", 
              position: "absolute", 
              top: 0, 
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              opacity: opacity / 100,
              pointerEvents: opacity < 100 ? "none" : "auto",
              zIndex: 2,
              backgroundColor: "transparent",
              display: opacity === 0 ? "none" : "block"
            }}
            onLoad={() => {
              console.log("Comparison PDF iframe loaded successfully, opacity:", opacity);
            }}
            onError={(e) => {
              console.error("Error loading comparison PDF iframe:", e);
            }}
          />
        )}
      </div>
    </div>
  );
}

