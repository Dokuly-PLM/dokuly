import React, { useState, useEffect, useCallback } from "react";

import DokulyTable from "../../../dokuly_components/dokulyTable/dokulyTable";
import DokulySearchBar from "../../../dokuly_components/dokulySearchBar";

import { editReleaseState, searchReleaseItems } from "../../../parts/functions/queries";
import GenericDropdownSelector from "../../../dokuly_components/dokulyTable/components/genericDropdownSelector";

const ReleaseStates = ({ setRefresh }) => {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const pageSize = 50;

  const states = [
    { value: "Draft", label: "Draft" },
    { value: "Review", label: "Review" },
    { value: "Released", label: "Released" },
  ];

  const fetchItems = useCallback((search, page) => {
    if (!search) {
      setItems([]);
      setTotalCount(0);
      return;
    }
    searchReleaseItems(search, page, pageSize).then((res) => {
      if (res.status === 200) {
        setItems(res.data.results);
        setTotalCount(res.data.total);
      }
    });
  }, []);

  useEffect(() => {
    if (searchTerm) {
      fetchItems(searchTerm, currentPage);
    }
  }, [currentPage]);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchItems(term, 1);
  }, [fetchItems]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStateChange = (id, app, newState) => {
    editReleaseState(id, app, newState).then((data) => {
      if (data) {
        setRefresh(true);
        fetchItems(searchTerm, currentPage);
      }
    });
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
    },
    {
      key: "release_state",
      header: "State",
      formatter: (row) => (
        <GenericDropdownSelector
          state={row.release_state}
          setState={(newState) => handleStateChange(row.id, row.app, newState)}
          dropdownValues={states}
          placeholder="Select State"
          borderIfPlaceholder={true}
          textSize="16px"
        />
      ),
    },
    { key: "display_name", header: "Display name", maxWidth: "360px" },
  ];

  return (
    <div className="card-body bg-white m-3 card rounded">
      <h5>
        <b>Release Management</b>
      </h5>
      <p className="text-muted">
        <small>
          This table allows override of release state. <b>Click on a state</b>{" "}
          to change it.
        </small>
      </p>
      <DokulySearchBar
        onChange={handleSearchChange}
        placeholder="Search by part number or name..."
      />
      <DokulyTable
        data={items}
        columns={columns}
        itemsPerPage={pageSize}
        showSearch={false}
        showCsvDownload={false}
        showPagination={true}
        serverSidePagination={true}
        totalItemCount={totalCount}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      />
    </div>
  );
};

export default ReleaseStates;
