import React, { useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import SearchButton from "../dokuly_components/SearchButton";
import { searchProductionItems } from "./functions/queries";
import { toast } from "react-toastify";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import highlightSearchTerm from "../dokuly_components/funcitons/highlightSearchTerm";
import { useNavigate } from "react-router-dom";

const ItemSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false); // part, pcba, assembly

  const navigate = useNavigate();

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      // Make the API request to search for production items
      const response = await searchProductionItems(query);

      // Assuming the response data is an array of results
      const searchResults = response.data;

      // Check the response status code
      if (response.status === 200) {
        // Handle success
        setResults(searchResults);
      } else {
        // Handle other status codes
        toast.error("Search failed with status code:", response.status);
      }
    } catch (error) {
      // Handle errors here
      toast.error("Error searching for production items:", error);
    }
    setIsSearching(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(); // Trigger search when Enter key is pressed.
    }
  };

  const columns = [
    { key: "serial_number", header: "Serial number" },
    {
      key: "full_part_number",
      header: "Part number",
      formatter: (row, column) => {
        const part = row.part || row.pcba || row.assembly;
        if (!part) return "";
        
        const partNumber = part.full_part_number || "";
        return partNumber ? highlightSearchTerm(partNumber, query) : "";
      },
      csvFormatter: (row, column) => {
        const part = row.part || row.pcba || row.assembly;
        if (!part) return "";
        return part.full_part_number || "";
      },
    },
    {
      key: "created_at",
      header: "Creation date",
      formatter: (row, column) => {
        const date = row?.[column.key];
        return date
          ? new Date(date)
              .toLocaleDateString("en-GB", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
              })
              .replace(/\//g, ".")
          : "";
      },
      csvFormatter: (row, column) => {
        // Use the same formatting logic as the formatter
        const date = row?.[column.key];
        return date
          ? new Date(date)
              .toLocaleDateString("en-GB", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
              })
              .replace(/\//g, ".")
          : "";
      },
    },
    {
      key: "comment",
      header: "Comment",
      formatter: (row, column) => {
        const comment = row?.[column.key];
        return comment ? highlightSearchTerm(comment, query) : "";
      },
      csvFormatter: (row, column) => {
        // Use the same formatting logic as the formatter
        const comment = row?.[column.key];
        return comment || "";
      },
    },
  ];

  const handleRowClick = (index) => {
    const selectedItem = results[index];

    navigate(`/production/${selectedItem.serial_number_id}`);
  };

  return (
    <div className="search-section">
      <Row>
        <Col md={10}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search produced items."
              className="dokuly-form-input"
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <SearchButton
            type="button"
            onClick={handleSearch}
            disabled={!query}
            disabledTooltip="Search produced items."
          />
        </Col>
      </Row>
      <Row>
        {isSearching ? (
          <Col className="text-center">
            {" "}
            <div className="spinner-border " role="status" />{" "}
          </Col>
        ) : (
          <Col>
            {results.length > 0 && (
              <DokulyTable
                data={results}
                columns={columns}
                onRowClick={(index) => handleRowClick(index)}
              />
            )}
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ItemSearch;
