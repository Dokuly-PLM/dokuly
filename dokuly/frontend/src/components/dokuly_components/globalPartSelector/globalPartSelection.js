import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Form, Row, Col } from "react-bootstrap";
import SearchButton from "../SearchButton";
import { searchPartsGlobal } from "../funcitons/queries";
import { toast } from "react-toastify";
import highlightSearchTerm from "../funcitons/highlightSearchTerm"; // TODO
import { PartSuggestions } from "./partSuggestions";

const GlobalPartSelection = ({
  setSelectedItem,
  searchTerm = "",
  organization,
  includeTables = ["parts", "pcbas", "assemblies"],
  latestOnly = false,
}) => {
  const [query, setQuery] = useState(searchTerm);
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = useCallback(
    async (searchQuery) => {
      try {
        const response = await searchPartsGlobal(
          searchQuery,
          includeTables,
          latestOnly,
        );
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
    },
    [includeTables, latestOnly],
  );

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

      // Sort by revision counters (major, then minor)
      const majorA = a?.revision_count_major ?? 0;
      const majorB = b?.revision_count_major ?? 0;

      if (majorA !== majorB) {
        return majorA - majorB;
      }

      const minorA = a?.revision_count_minor ?? 0;
      const minorB = b?.revision_count_minor ?? 0;
      return minorA - minorB;
    }) || [];

  return (
    <div className="search-section">
      <Row>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Control
              ref={searchInputRef}
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
