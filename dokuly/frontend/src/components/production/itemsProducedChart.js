import React, { useState, useEffect } from "react";
import ApexCharts from "react-apexcharts";
import { ButtonGroup } from "react-bootstrap";

const ItemsProducedChart = ({ data }) => {
  const [options, setOptions] = useState({
    chart: {
      type: "bar",
      height: 350,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: "datetime",
      title: {
        text: "Assembly date",
      },
    },
    yaxis: {
      title: {
        text: "Number of units assembled",
      },
    },
    title: {
      text: "Units assembled per day",
      align: "center",
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
    },
  });

  const [series, setSeries] = useState([]);
  const [timeRange, setTimeRange] = useState("month");

  const generateRange = (startDate, endDate, interval = "day") => {
    const range = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      range.push(new Date(current));
      if (interval === "day") {
        current.setDate(current.getDate() + 1);
      } else if (interval === "month") {
        current.setMonth(current.getMonth() + 1);
      }
    }
    return range;
  };

  const aggregateData = (data, range) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate;
    let interval = "day";

    if (range === "week") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else if (range === "month") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
    } else if (range === "year") {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
      interval = "month";
    }

    const fullRange = generateRange(startDate, today, interval);

    const counts = data.reduce((acc, item) => {
      const date = new Date(item.assembly_date);
      const key =
        interval === "day"
          ? date.toISOString().split("T")[0]
          : `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}`;

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const seriesData = fullRange.map((date) => {
      const key =
        interval === "day"
          ? date.toISOString().split("T")[0]
          : `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}`;

      return {
        x: key,
        y: counts[key] || 0,
      };
    });

    return seriesData;
  };

  useEffect(() => {
    const aggregatedData = aggregateData(data, timeRange);
    setSeries([
      { name: "Assembled Units", data: aggregatedData, color: "#23655d" },
    ]);

    const newOptions = { ...options };

    if (timeRange === "year") {
      newOptions.xaxis = {
        ...newOptions.xaxis,
        type: "category",
        categories: aggregatedData.map((item) =>
          new Date(item.x).toLocaleString("default", { month: "long" })
        ),
        title: {
          text: "Month",
        },
      };
      newOptions.tooltip = {
        ...newOptions.tooltip,
        x: {
          formatter: function (val, opts) {
            return opts.w.globals.labels[opts.dataPointIndex];
          },
        },
      };
    } else {
      newOptions.xaxis = {
        ...newOptions.xaxis,
        type: "datetime",
        title: {
          text: "Assembly date",
        },
      };
      newOptions.tooltip = {
        ...newOptions.tooltip,
        x: {
          format: "dd MMM yyyy",
        },
      };
    }

    setOptions(newOptions);
  }, [data, timeRange]);

  return (
    <div>
      <ButtonGroup aria-label="Time range">
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "week"}
          onClick={() => setTimeRange("week")}
        >
          Last 7 Days
        </button>
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "month"}
          onClick={() => setTimeRange("month")}
        >
          Last 30 Days
        </button>
        <button
          className="btn btn-background-transparent"
          disabled={timeRange === "year"}
          onClick={() => setTimeRange("year")}
        >
          Last 365 Days
        </button>
      </ButtonGroup>
      <div id="chart">
        <ApexCharts options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default ItemsProducedChart;
