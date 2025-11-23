import React from "react";

export default function GenericComparisonViewer({
  originalFileUri,
  comparisonFileUri,
  originalFileName,
  comparisonFileName,
}) {
  return (
    <div className="generic-comparison-viewer">
      <div className="comparison-message mb-3 p-3 bg-light border rounded">
        <p className="mb-2">
          <strong>File Comparison</strong>
        </p>
        <p className="text-muted mb-0">
          Side-by-side comparison for this file type. Use the links below to view each file separately.
        </p>
      </div>
      <div className="comparison-files d-flex gap-3">
        <div className="file-panel flex-fill">
          <h6>Original: {originalFileName}</h6>
          <div className="border p-2" style={{ minHeight: "400px" }}>
            <a href={originalFileUri} target="_blank" rel="noopener noreferrer">
              Open original file
            </a>
          </div>
        </div>
        <div className="file-panel flex-fill">
          <h6>Comparison: {comparisonFileName}</h6>
          <div className="border p-2" style={{ minHeight: "400px" }}>
            <a href={comparisonFileUri} target="_blank" rel="noopener noreferrer">
              Open comparison file
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

