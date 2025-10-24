import React, { useState, useEffect, useCallback } from "react";
import { Container, Form, Row, Col } from "react-bootstrap";
import SearchButton from "../SearchButton";
import { searchPartsGlobal } from "../funcitons/queries";
import { toast } from "react-toastify";
import highlightSearchTerm from "../funcitons/highlightSearchTerm"; // TODO
import { PartSuggestions } from "./partSuggestions";

const GlobalPartSelection = ({ setSelectedItem, searchTerm = "", organization }) => {
  const [query, setQuery] = useState(searchTerm);
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = useCallback(async (searchQuery) => {
    try {
      const response = await searchPartsGlobal(searchQuery);
      const searchResults = response.data;

      if (response.status === 200) {
        setResults(searchResults);
        setShowSuggestions(true);
      } else {
        toast.error(`Search failed with status code: ${response.status}`);
      }
    } catch (error) {
      toast.error(`Error searching for global items: ${error.message}`);
    }
  }, []);

  // Effect to automatically search when searchTerm changes
  useEffect(() => {
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  }, [searchTerm, handleSearch]);

  const enter_part_information = (suggestion) => {
    if (suggestion == null) {
      return;
    }
    setSelectedItem(suggestion);
  };

  const sortedResults =
    results?.sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1; // Place 'a' after 'b'
      if (!b) return -1; // Place 'a' before 'b'

      const partA = a?.full_part_number?.toString() || "";
      const partB = b?.full_part_number?.toString() || "";
      const partComparison = partA.localeCompare(partB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      if (partComparison !== 0) {
        return partComparison;
      }

      const revA = a?.revision?.toString() || "";
      const revB = b?.revision?.toString() || "";
      return revA.localeCompare(revB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }) || [];

  return (
    <div className="search-section">
      <Row>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="dokuly-form-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(query);
                }
              }}
              placeholder="Search all items."
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <SearchButton
            type="button"
            className="dokuly-bg-primary"
            onClick={() => handleSearch(query)}
            disabled={!query}
            disabledTooltip="Search all items."
          />
        </Col>
      </Row>
      <Row>
        {showSuggestions && (
          <PartSuggestions
            searchTerm={query}
            suggestions={sortedResults}
            onSelectSuggestion={enter_part_information}
            onHide={() => setShowSuggestions(false)}
            organization={organization}
          />
        )}
      </Row>
    </div>
  );
};

export default GlobalPartSelection;
