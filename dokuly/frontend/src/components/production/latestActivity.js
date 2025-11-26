import React, { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";
import { useNavigate } from "react-router-dom";

export default function ProductionLatestActivity(props) {
  const [uniqueItems, setUniqueItems] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const items = props?.items
      .map((item) => {
        if (item.assembly) {
          return {
            type: "Assembly",
            ...item.assembly,
            serial_number: item.serial_number,
            assembly_date: item.assembly_date,
            id: item.id,
          };
        } else if (item.pcba) {
          return {
            type: "Pcba",
            ...item.pcba,
            serial_number: item.serial_number,
            assembly_date: item.assembly_date,
            id: item.id,
          };
        } else if (item.part) {
          return {
            type: "Part",
            ...item.part,
            serial_number: item.serial_number,
            assembly_date: item.assembly_date,
            id: item.id,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    // Sorting items by 'created_at' to find the newest items
    items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Keeping only the latest 10 unique items based on the full part number (which now includes revision)
    const uniqueSortedItems = props?.items
      .map((item) => ({
        // Extract the necessary details based on item type
        ...(item.assembly ?? item.pcba ?? item.part),
        type: item.assembly ? "Assembly" : item.pcba ? "Pcba" : "Part",
        serial_number: item.serial_number,
        assembly_date: item.assembly_date,
        created_at: item.created_at,
        id: item.id, // Ensure the right id is used for navigation
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort by created_at
      .reduce((acc, item) => {
        // Deduplication logic - full_part_number now includes revision
        const index = acc.findIndex(
          (i) => i.full_part_number === item.full_part_number,
        );
        if (index === -1) {
          acc.push(item); // Add if not already present
        } else {
          // Replace if current item is newer
          if (new Date(acc[index].created_at) < new Date(item.created_at)) {
            acc[index] = item;
          }
        }
        return acc;
      }, [])
      .slice(0, 10); // Limit to the 10 most recent items

    // Set the state with the sorted and deduplicated items
    setUniqueItems(uniqueSortedItems);
  }, [props?.items]);

  const handleRowClick = (index) => {
    const selectedItem = uniqueItems[index];
    navigate(`/production/${selectedItem.id}`);
  };

  const columns = [
    {
      key: "full_part_number",
      header: "Part number",
      formatter: (row) => {
        // full_part_number already contains the properly formatted part number with revision
        return row.full_part_number;
      },
    },
    {
      key: "serial_number",
      header: "Serial number",
      formatter: (row) => row.serial_number,
    },
    {
      key: "assembly_date",
      header: "Assembly date",
      formatter: (row) => row.assembly_date,
    },
    {
      key: "type",
      header: "Type",
      formatter: (row) => row.type,
    },
  ];

  return (
    <DokulyTable
      data={uniqueItems}
      columns={columns}
      onRowClick={(index) => handleRowClick(index)}
      showCsvDownload={false}
      showPagination={false}
      itemsPerPage={15}
    />
  );
}
