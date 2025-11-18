import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import { Col, Modal, Button } from "react-bootstrap";
import moment from "moment";
import DokulyModal from "../../../dokuly_components/dokulyModal";

const PriceVsQuantityChart = ({ priceBreaks, currency, updatedAt }) => {
  const [chartOptions, setChartOptions] = useState({
    series: [
      {
        name: "Cost",
        data: [],
      },
    ],
    options: {
      chart: {
        type: "line",
        zoom: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "straight",
        colors: ["#165216ff"],
        width: 2,
      },
      colors: ["#165216ff"],
      title: {
        text: "Price vs Quantity",
        align: "left",
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.3,
        },
      },
      xaxis: {
        type: "logarithmic",
        title: {
          text: "Quantity",
        },
        min: 1,
        max: undefined, // Will be set dynamically
      },
      yaxis: {
        title: {
          text: `Cost (${currency})`,
        },
        min: 0.01,
        max: undefined, // Will be set dynamically
        labels: {
          formatter: function (value) {
            return value.toFixed(3);
          },
        },
      },
    },
  });

  const [showModal, setShowModal] = useState(false);

  // Helper function to format the time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null;
    return moment(timestamp).fromNow();
  };

  useEffect(() => {
    const seriesData = priceBreaks.map((pb) => ({
      x: pb.quantity,
      y: pb.unit_cost,
    }));

    const maxQuantity = Math.max(...priceBreaks.map((pb) => pb.quantity));
    const maxPrice = Math.max(...priceBreaks.map((pb) => pb.unit_cost));

    setChartOptions((prevState) => ({
      ...prevState,
      series: [{ ...prevState.series[0], data: seriesData }],
      options: {
        ...prevState.options,
        xaxis: {
          ...prevState.options.xaxis,
          max: maxQuantity,
        },
        yaxis: {
          ...prevState.options.yaxis,
          max: maxPrice,
        },
      },
    }));
  }, [priceBreaks]);

  useEffect(() => {
    const maxQuantity = Math.max(...priceBreaks.map((pb) => pb.quantity));
    const maxPrice = Math.max(...priceBreaks.map((pb) => pb.unit_cost));

    setChartOptions((prevState) => ({
      ...prevState,
      options: {
        ...prevState.options,
        chart: {
          ...prevState.options.chart,
          zoom: {
            enabled: showModal,
          },
          toolbar: {
            show: showModal,
          },
          xaxis: {
            ...prevState.options.xaxis,
            type: showModal ? "linear" : "logarithmic",
            max: showModal ? undefined : maxQuantity,
          },
          yaxis: {
            ...prevState.options.yaxis,
            max: showModal ? undefined : maxPrice,
          },
        },
      },
    }));
  }, [showModal, priceBreaks]);

  return (
    <>
      <Col className="position-relative">
        <button
          type="button"
          className="btn btn-bg-transparent"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}
          onClick={() => setShowModal(true)}
        >
          <img
            className="icon-dark"
            src="../../static/icons/arrows-maximize.svg"
            alt="icon"
          />
        </button>
        <div id="chart">
          <ApexCharts
            options={chartOptions.options}
            series={chartOptions.series}
            type="line"
            height={240}
          />
          <p className="text-muted">
            <small>
              {updatedAt && (
                <> Currency rates updated {formatTimeAgo(updatedAt)}.</>
              )}
            </small>
          </p>
        </div>
      </Col>

      <DokulyModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title="Price vs Quantity Chart"
        size="full-screen"
      >
        <ApexCharts
          options={chartOptions.options}
          series={chartOptions.series}
          type="line"
          height="100%"
        />
      </DokulyModal>
    </>
  );
};

export default PriceVsQuantityChart;
