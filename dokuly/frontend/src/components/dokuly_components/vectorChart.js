import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

// Register required Chart.js components and plugins
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  annotationPlugin
);

const VectorChart = ({ measurement }) => {
  const { measurements_x, measurements_y, x_unit, y_unit, step_title, upper_limit, lower_limit } = measurement;

  const data = {
    labels: measurements_x,
    datasets: [
      {
        label: step_title,
        data: measurements_y,
        fill: false,
        backgroundColor: "rgba(35,101,93,0.6)",
        borderColor: "rgba(35,101,93,1)",
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: x_unit || "X",
        },
      },
      y: {
        title: {
          display: true,
          text: y_unit || "Y",
        },
      },
    },
    plugins: {
      annotation: {
        annotations: {
          upperLimitBox: upper_limit !== undefined && {
            type: "box",
            yMin: upper_limit,
            yMax: Infinity,
            backgroundColor: "rgba(255, 99, 132, 0.2)", // Light red
            borderWidth: 0,
            label: {
              display: true,
              content: "Above Upper Limit",
              position: "end",
              color: "rgba(255, 99, 132, 0.8)", // Match the box color
            },
          },
          lowerLimitBox: lower_limit !== undefined && {
            type: "box",
            yMin: -Infinity,
            yMax: lower_limit,
            backgroundColor: "rgba(255, 99, 132, 0.2)", // Light red
            borderWidth: 0,
            label: {
              display: true,
              content: "Below Lower Limit",
              position: "start",
              color: "rgba(255, 99, 132, 0.8)", // Match the box color
            },
          },
        },
      },
    },
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default VectorChart;
