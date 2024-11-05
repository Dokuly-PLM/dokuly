import React, { useState, useEffect, useRef } from "react";
import useStockHistory from "../../../common/hooks/useStockHistory";
import FormInput from "../../formInput";
import ApexCharts from "react-apexcharts";
import { Col, Form, Row } from "react-bootstrap";
import useStockOnOrder from "../../../common/hooks/useStockOnOrder";
import useStockForecast from "../../../common/hooks/useStockForecast";

const StockOverTimeGraph = ({
  app,
  dbObject,
  stockOnOrder,
  connectedPos = [],
  setForecastedStock = () => {},
}) => {
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );

  const [toDate, setToDate] = useState(new Date());
  const [updateNeeded, setUpdateNeeded] = useState(false);

  const [
    stockHistory,
    initialStockLevel,
    refreshStockHistory,
    loadingStockHistory,
  ] = useStockHistory({
    app,
    dbObjectId: dbObject?.id,
    fromDate: fromDate.toISOString(),
    toDate: toDate.toISOString(),
  });

  const [stockForecast, loadingStockForecast, refreshStockForecast] =
    useStockForecast({
      app,
      dbObjectId: dbObject?.id,
      toDate: toDate.toISOString(),
    });

  const stockHistoryRef = useRef(stockHistory);

  useEffect(() => {
    stockHistoryRef.current = stockHistory;
  }, [stockHistory]);

  const [chartOptions, setChartOptions] = useState({
    series: [
      {
        name: "Stock",
        data: [],
        type: "line",
      },
      {
        name: "Minimum Stock Level",
        data: [],
        type: "line",
      },
      {
        name: "Stock ",
        data: [],
        type: "line",
        showInLegend: false, // Hide legend
      },
      {
        name: "Forecast",
        data: [],
        type: "line",
      },
    ],
    options: {
      chart: {
        type: "line",
        height: 350,
        zoom: {
          type: "x",
          enabled: true,
          autoScaleYaxis: true,
        },
        toolbar: {
          autoSelected: "zoom",
        },
      },
      stroke: {
        curve: "smooth",
        dashArray: [0, 5, 5, 5],
        colors: ["#165216", "#B00020", "#165216"],
        width: 2,
      },
      markers: {
        size: 3,
        colors: ["#165216", "#B00020", "#165216"],
        strokeColors: ["#165216", "#B00020", "#165216"],
        strokeWidth: 3,
        hover: {
          size: [4, 0, 4, 4],
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: "datetime",
        labels: {
          formatter: function (val) {
            return new Date(val).toLocaleDateString();
          },
        },
        tickPlacement: "on",
      },
      yaxis: {
        title: {
          text: "Quantity",
        },
        labels: {
          formatter: (val) => val.toFixed(0),
          style: {
            colors: ["#165216"],
          },
        },
      },
      legend: {
        show: true,
        customLegendItems: ["Stock", "Minimum Stock Level", "Forecast"],
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        followCursor: true,
        x: {
          show: true,
          format: "dd MMM",
          formatter: (value, { seriesIndex, dataPointIndex, w }) => {
            if (seriesIndex !== undefined && dataPointIndex !== undefined) {
              const date = new Date(value);
              // Check if date is valid
              if (!isNaN(date.getTime())) {
                return date.toLocaleDateString();
              }
              return "Invalid date";
            }
            return "";
          },
        },
        y: {
          formatter: (value, { seriesIndex, dataPointIndex, w }) => {
            if (seriesIndex !== undefined && dataPointIndex !== undefined) {
              return value?.toFixed(0) ?? "";
            }
            return "";
          },
          title: {
            formatter: (seriesName) => seriesName,
          },
        },
        marker: {
          show: true,
        },
      },
    },
  });

  useEffect(() => {
    // Whenever there's a change in stock affecting parameters
    if (dbObject.current_total_stock !== undefined) {
      setUpdateNeeded(true);
    }
  }, [dbObject.current_total_stock]);

  useEffect(() => {
    if (updateNeeded) {
      setToDate(new Date()); // This updates the toDate to the current date
      setUpdateNeeded(false); // Reset the flag after setting date
    }
  }, [updateNeeded]);

  useEffect(() => {
    refreshStockHistory();
  }, [fromDate, toDate, refreshStockHistory]);

  useEffect(() => {
    refreshStockForecast();
  }, [toDate, refreshStockForecast]);

  useEffect(() => {
    let cumulativeQuantity = initialStockLevel;

    // Map stock and forecast points with day normalization
    const stockPoints = stockHistory.map((sh) => ({
      x: new Date(sh.created_at).setHours(0, 0, 0, 0),
      quantity: sh.quantity,
      type: "stock",
    }));

    const connectedPosPoints = connectedPos.map((pos) => ({
      x: new Date(pos.estimated_delivery_date).setHours(0, 0, 0, 0),
      quantity: pos.quantity,
      type: "forecast",
    }));

    const forecastPoints = stockForecast.map((forecast) => ({
      x: new Date(forecast.planned_production_date).setHours(0, 0, 0, 0),
      quantity: forecast.stock_change,
      type: "forecast",
    }));

    let allPoints = stockPoints.concat(connectedPosPoints, forecastPoints);
    allPoints.sort((a, b) => a.x - b.x);

    // Aggregate points by date and type
    const aggregatedPoints = allPoints.reduce((acc, point) => {
      const key = point.x + "-" + point.type;
      if (!acc[key]) {
        acc[key] = { ...point, count: 1 };
      } else {
        acc[key].quantity += point.quantity;
      }
      return acc;
    }, {});

    // Convert aggregated points back to array and calculate cumulative quantities
    const seriesData = Object.values(aggregatedPoints)
      .map((point) => {
        cumulativeQuantity += point.quantity;
        return {
          x: point.x,
          y: cumulativeQuantity,
          type: point.type,
        };
      })
      .sort((a, b) => a.x - b.x); // Sort by date

    // Segregate the series data by type
    const stockSeries = seriesData.filter((p) => p.type === "stock");
    const forecastSeries = seriesData.filter((p) => p.type === "forecast");

    const lastStockPoint = stockSeries[stockSeries.length - 1];
    const firstForecastPoint = forecastSeries[0];

    const connectionLine =
      lastStockPoint && firstForecastPoint
        ? [
            {
              x: lastStockPoint.x,
              y: lastStockPoint.y,
            },
            {
              x: firstForecastPoint.x,
              y: firstForecastPoint.y,
            },
          ]
        : [];

    const lastPointX = forecastSeries.length
      ? forecastSeries[forecastSeries.length - 1].x
      : stockSeries.length
      ? stockSeries[stockSeries.length - 1].x
      : new Date();
    const nextDayX = new Date(lastPointX);
    nextDayX.setDate(nextDayX.getDate() + 1);

    const minimumStockLine = [
      {
        x: stockSeries[0]?.x,
        y: dbObject?.minimum_stock_level,
      },
      {
        x: nextDayX.getTime(), // Extending to the next day
        y: dbObject?.minimum_stock_level,
      },
    ];

    setForecastedStock(cumulativeQuantity);

    setChartOptions((prev) => ({
      ...prev,
      series: [
        { name: "Stock", data: stockSeries, color: "#165216" },
        {
          name: "Minimum Stock Level",
          data: minimumStockLine,
          color: "#B00020",
        },
        {
          name: "Stock ",
          data: connectionLine,
          color: "#165216",
          type: "line",
          dashArray: 5,
          showInLegend: false,
        },
        {
          name: "Forecast",
          data: forecastSeries,
          color: "#165216",
          dashArray: 5,
        },
      ],
    }));
  }, [
    stockHistory,
    stockForecast,
    initialStockLevel,
    dbObject?.minimum_stock_level,
    connectedPos,
  ]);

  const handleDateChange = (setter, dateValue) => {
    // Parse the new date value before setting state to ensure it's always a Date object
    const newDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    setter(newDate);
  };

  if (loadingStockHistory) {
    return (
      <Col className="text-center">
        <span>Loading...</span>
      </Col>
    );
  }

  if (!stockHistory || stockHistory.length === 0) {
    return (
      <Col className="text-center">
        <span>No stock history available.</span>
      </Col>
    );
  }

  return (
    <Col>
      <Row>
        <Form.Group as={Col} controlId="fromDate">
          <FormInput
            input={fromDate.toISOString().substring(0, 10)} // YYYY-MM-DD format for input[type='date']
            onChange={(e) => handleDateChange(setFromDate, e.target.value)}
            type="date"
            labelTitle="From:"
          />
        </Form.Group>
        <Form.Group as={Col} controlId="toDate">
          <FormInput
            input={toDate.toISOString().substring(0, 10)} // YYYY-MM-DD format for input[type='date']
            onChange={(e) => handleDateChange(setToDate, e.target.value)}
            type="date"
            labelTitle="To:"
          />
        </Form.Group>
      </Row>
      <div id="chart">
        <ApexCharts
          options={chartOptions.options}
          series={chartOptions.series}
          type="line"
          height={200}
        />
      </div>
    </Col>
  );
};

export default StockOverTimeGraph;
