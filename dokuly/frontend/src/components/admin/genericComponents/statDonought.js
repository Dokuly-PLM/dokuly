import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LinearScale,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, LinearScale);

const StatDonought = (props) => {
  const [dataset, setDataset] = useState(
    props?.datasets !== null && props?.datasets !== undefined
      ? props?.datasets
      : null,
  );

  const errorData = () => {
    const data = {};
    (data.labels = ["Error loading data"]),
      (data.datasets = [
        {
          label: "# of Votes",
          data: [404],
          backgroundColor: ["rgba(255, 99, 132, 0.2)"],
          borderColor: ["rgba(255, 99, 132, 1)"],
          borderWidth: 1,
        },
      ]);
  };

  if (dataset === null || dataset === undefined) {
    return (
      <div>
        <Doughnut data={errorData()} />
      </div>
    );
  }

  useEffect(() => {
    if (props?.datasets) {
      setDataset(props.datasets);
    }
  }, [props]);

  const exportData = () => {
    const data = {};
    data.datasets = [];
    data.labels = [];
    const entry = {};
    entry.data = [];
    entry.backgroundColor = [];
    entry.borderColor = [];
    entry.borderWidth = 1.2;
    for (let i = 0; i < dataset.length; i++) {
      const split = dataset[i]?.color.split(",");
      const backgroundColor = `rgba(${split[0]}, ${split[1]}, ${split[2]}, ${split[3]})`;
      const borderColor = `rgba(${split[0]}, ${split[1]}, ${split[2]}, ${split[4]})`;
      entry.label = props?.mainLabel;
      entry.data.push(dataset[i].value);
      entry.backgroundColor.push(backgroundColor);
      entry.borderColor.push(borderColor);
      data.labels.push(dataset[i].label);
    }
    data.datasets.push(entry);
    return data;
  };

  return (
    <div>
      {props?.title && (
        <h6>
          <b>{props.title}</b>
        </h6>
      )}
      {props?.subTitle && <h6>{props?.subTitle}</h6>}
      <Doughnut data={exportData()} options={{ radius: "75%" }} />
    </div>
  );
};

export default StatDonought;
