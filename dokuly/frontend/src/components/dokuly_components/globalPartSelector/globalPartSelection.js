import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Form, Row, Col } from "react-bootstrap";
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
  compact = false,
}) => {
  const [query, setQuery] = useState(searchTerm);
  const [results, setResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const hasAutoSearched = useRef(false);

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

  // Auto-search once on mount with the initial searchTerm
  useEffect(() => {
    if (searchTerm && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
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

  if (compact) {
    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#fff", borderRadius: "4px", padding: "2px" }}>
          <input
            ref={searchInputRef}
            className="input-edit"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(query);
              }
            }}
            placeholder="Search..."
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="button"
            className="btn btn-bg-transparent p-0"
            onClick={() => handleSearch(query)}
            disabled={!query}
            style={{
              cursor: !query ? "not-allowed" : "pointer",
              opacity: !query ? 0.5 : 1,
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            <img
              className="icon-dark"
              src="../../../static/icons/search.svg"
              alt="search"
              style={{ width: "16px", height: "16px" }}
            />
          </button>
        </div>
        {showSuggestions && (
          <div style={{ position: "absolute", top: "100%", left: 0, minWidth: "100%", zIndex: 1050, background: "#fff", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            <PartSuggestions
              searchTerm={query}
              suggestions={sortedResults}
              onSelectSuggestion={enter_part_information}
              onHide={() => setShowSuggestions(false)}
              organization={organization}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="search-section">
      <Row>
        <Col md={8}>
          <Form.Group className="mb-2">
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
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                height: "24px"
              }}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <button
            type="button"
            className="btn btn-bg-transparent"
            onClick={() => handleSearch(query)}
            disabled={!query}
            title={!query ? "Search all items." : "Search"}
            style={{
              cursor: !query ? "not-allowed" : "pointer",
              opacity: !query ? 0.65 : 1,
              height: "32px",
              padding: "4px 8px"
            }}
          >
            <img
              className="icon-dark"
              src="../../../static/icons/search.svg"
              alt="search"
              style={{
                width: "16px",
                height: "16px"
              }}
            />
          </button>
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
