import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Col, Row } from "react-bootstrap";

import DokulyCard from "../../dokuly_components/dokulyCard";
import CardTitle from "../../dokuly_components/cardTitle";
import DokulyTable from "../../dokuly_components/dokulyTable/dokulyTable";
import DokulyPriceFormatter from "../../dokuly_components/formatters/priceFormatter";
import { releaseStateFormatterNoObject } from "../../dokuly_components/formatters/releaseStateFormatter";
import useOrganization from "../../common/hooks/useOrganization";
import { ThumbnailFormatter } from "../../dokuly_components/dokulyTable/functions/formatters";
import NoDataFound from "../../dokuly_components/dokulyTable/components/noDataFound";

const LotProcurement = ({ lot, poData = [] }) => {
  const [organization, refreshOrganization, loadingOrganization] =
    useOrganization();

  const [showCompletedPurchaseOrders, setShowCompletedPurchaseOrders] =
    useState(false);
  const [showDiscardedPurchaseOrders, setShowDiscardedPurchaseOrders] =
    useState(false);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const filterPurchaseOrders = () => {
      if (!poData || poData.length === 0) {
        return [];
      }
      const safePoData = Array.isArray(poData) ? poData : [];
      let temporaryPurchaseOrders = [...safePoData]; // Clone the array to prevent direct mutation

      if (showCompletedPurchaseOrders) {
        temporaryPurchaseOrders = temporaryPurchaseOrders.filter(
          (purchaseOrder) => purchaseOrder.is_completed === true
        );
      } else {
        temporaryPurchaseOrders = temporaryPurchaseOrders.filter(
          (purchaseOrder) => purchaseOrder.is_completed === false
        );
      }

      return temporaryPurchaseOrders;
    };

    setFilteredPurchaseOrders(filterPurchaseOrders());
  }, [poData, showCompletedPurchaseOrders]);

  const columns = [
    {
      key: "purchase_order_number",
      header: "PO #",
      sort: true,
    },
    {
      key: "order_date",
      header: "Order date",
      sort: true,
    },

    {
      key: "supplier",
      header: "Supplier",
      formatter: (row) => {
        return (
          <Row>
            <Col style={{ maxWidth: "70px" }}>
              <ThumbnailFormatter thumbnail={row?.supplier?.thumbnail} />
            </Col>
            <Col style={{ display: "flex", alignItems: "center" }}>
              {row.supplier.name}
            </Col>
          </Row>
        );
      },

      sort: true,
    },
    {
      key: "estimated_delivery_date",
      header: "Estimated delivery date",
      formatter: (row) => {
        const currentDate = new Date();
        const estimatedDeliveryDate = new Date(row.estimated_delivery_date);

        if (row.is_completed) {
          return (
            <span className="badge badge-pill badge-success">Received</span>
          );
        }
        if (currentDate > estimatedDeliveryDate) {
          return (
            <span className="badge badge-pill badge-danger">
              {row.estimated_delivery_date}
            </span>
          );
        }
        return `${row.estimated_delivery_date}`;
      },
      sort: true,
    },
    {
      key: "status",
      header: "Status",
      sort: true,
      formatter: (row) => releaseStateFormatterNoObject(row?.status),
    },

    {
      key: "total_price",
      header: "Total Price",

      formatter: (row) => {
        if (row.total_price === null) {
          return "No Items";
        }
        return (
          <DokulyPriceFormatter
            price={row?.total_price}
            organization={organization}
            supplier={row?.supplier}
          />
        );
      },
      sort: true,
    },
  ];

  const defaultSorted = [
    {
      dataField: "purchase_order_number", // if dataField is not match to any column you defined, it will be ignored.
      order: "desc", // desc or asc
    },
  ];

  const handleOnRowClick = (rowId, row) => {
    navigate(`/procurement/${row.id}`);
  };

  const onNavigate = (row) => {
    navigate(`/procurement/${row.id}`);
  };

  return (
    <DokulyCard>
      <CardTitle titleText="Related purchase orders" />
      <Row>
        {filteredPurchaseOrders.length === 0 ? (
          <NoDataFound />
        ) : (
          <DokulyTable
            data={filteredPurchaseOrders}
            columns={columns}
            defaultSorted={defaultSorted}
            onRowClick={handleOnRowClick}
            navigateColumn={true}
            onNavigate={(row) => onNavigate(row)}
            renderChildrenNextToSearch={
              <Row>
                <Col className="p-2">
                  <div className="form-check mb-3">
                    <input
                      className="dokuly-checkbox"
                      name="showCompletedPurchaseOrders"
                      type="checkbox"
                      onChange={() => {
                        setShowCompletedPurchaseOrders(
                          (prevState) => !prevState
                        );
                      }}
                      checked={showCompletedPurchaseOrders}
                    />
                    <label
                      className="form-check-label ml-1"
                      htmlFor="flexCheckDefault"
                    >
                      Show completed purchase orders
                    </label>
                  </div>{" "}
                </Col>
              </Row>
            }
          />
        )}
      </Row>
    </DokulyCard>
  );
};

export default LotProcurement;
