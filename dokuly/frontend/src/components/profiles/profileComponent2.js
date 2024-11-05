import React, { useState, useEffect } from "react";
import { getUser } from "./functions/queries";
import DokulyCard from "../dokuly_components/dokulyCard";
import CardTitle from "../dokuly_components/cardTitle";

export default function Profile(props) {
  return (
    <DokulyCard>
      <CardTitle titleText="Profile information" />
      <ul className="list-group ">
        <ul className="list-group list-group-horizontal">
          <li className="list-group-item w-25">
            <b>Name:</b>
          </li>
          <li className="list-group-item w-75">
            {props.profile?.first_name} {props.profile?.last_name}
          </li>
        </ul>

        <ul className="list-group list-group-horizontal">
          <li className="list-group-item w-25">
            <b>Position:</b>
          </li>
          <li className="list-group-item w-75">{props.profile?.position}</li>
        </ul>

        <ul className="list-group list-group-horizontal">
          <li className="list-group-item w-25">
            <b>Phone number:</b>
          </li>
          <li className="list-group-item w-75">
            {props.profile?.personal_phone_number}
          </li>
        </ul>
        <ul className="list-group list-group-horizontal">
          <li className="list-group-item w-25">
            <b>Email:</b>
          </li>
          <li className="list-group-item w-75">{props.profile?.work_email}</li>
        </ul>
      </ul>
    </DokulyCard>
  );
}
