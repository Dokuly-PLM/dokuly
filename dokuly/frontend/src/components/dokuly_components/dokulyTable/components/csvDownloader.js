import React from "react";
import sortData from "../functions/sortUtils";

const CsvDownloader = ({
  data,
  columns,
  tableName = "table_data",
  sortedColumn,
  sortOrder,
  textSize = "14px",
}) => {
  // Function to generate a CSV string from the original data prop
  const generateCsvData = () => {
    const sortedCsvData = sortData(data, sortedColumn, sortOrder);

    const headerRow = columns
      .filter((column) => column.includeInCsv !== false) // Filter columns based on includeInCsv property
      .map((column) => column.header)
      .join(",");

    const csvRows = [headerRow];

    sortedCsvData.forEach((row) => {
      const rowData = columns
        .filter((column) => column.includeInCsv !== false) // Filter columns based on includeInCsv property
        .map((column) => {
          let cellData;
          if (column.csvFormatter) {
            // If a custom CSV formatter is defined, use it
            cellData = column.csvFormatter(row, column);
          } else if (column.formatter) {
            // If a formatter is defined, use it for the CSV data
            cellData = column.formatter(row, column);
          } else {
            // Use the raw data if no formatter is defined
            cellData = row[column.key];
          }

          // Check if the cellData is a React element
          if (React.isValidElement(cellData)) {
            // Extract and use the text content of the React element
            cellData = cellData.props.children;
          }

          // Handle objects by converting them to JSON strings
          if (typeof cellData === "object" && cellData !== null) {
            cellData = JSON.stringify(cellData);
          }

          // Ensure that cell data is treated as text by enclosing it in double quotes
          return `"${cellData}"`;
        })
        .join(",");

      csvRows.push(rowData);
    });

    return csvRows.join("\n");
  };

  // Function to handle the CSV download
  const handleCsvDownload = () => {
    let csvName = "table_data.csv";
    if (tableName !== "" && tableName !== null && tableName !== undefined) {
      csvName = tableName + ".csv";
    }

    const csvData = generateCsvData();
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = csvName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <button
      type="button"
      className="btn dokuly-btn-transparent p-0"
      title="Download table as a CSV file"
      onClick={handleCsvDownload}
    >
      <img
        className="icon-dark"
        src="../../static/icons/file-download.svg"
        alt="icon"
      />
      <span className="btn-text ml-1" style={{ fontSize: textSize }}>
        CSV
      </span>
    </button>
  );
};

export default CsvDownloader;
