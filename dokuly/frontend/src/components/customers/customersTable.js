import React, { useState, useEffect, useContext } from "react";

import { fetchUnarchivedCustomers } from "./funcitons/queries";
import EditCustomerForm from "./forms/editCustomerForm";
import { useNavigate } from "react-router";
import { AuthContext } from "../App";
import CustomerNewForm from "./forms/customerNewForm";
import DokulyTable from "../dokuly_components/dokulyTable/dokulyTable";

export default function CustomersTable(props) {
  const { isAuthenticated, setIsAuthenticated } = useContext(AuthContext);
  const [edit_customer, setEditCustomer] = useState(-1);
  const [selected_customer, setSelectedCustomer] = useState(false);
  const [customers, setCustomers] = useState([]);

  const navigate = useNavigate();

  // This useEffect only runs once.
  useEffect(() => {
    fetchUnarchivedCustomers()
      .then((res) => {
        setCustomers(res.data);
      })
      .catch((err) => {
        if (err?.response) {
          if (err?.response?.status === 401) {
            setIsAuthenticated(false);
          }
        }
      });
  }, []);

  useEffect(() => {
    // check local storage for cached customers
    const cachedCustomers = localStorage.getItem("customers");
    if (cachedCustomers) {
      try {
        setCustomers(JSON.parse(cachedCustomers));
      } catch (e) {
        localStorage.removeItem("customers");
      }
    }

    if (customers === [] || customers == null || props?.refresh === true) {
      fetchUnarchivedCustomers()
        .then((res) => {
          setCustomers(res.data);
          localStorage.setItem("customers", JSON.stringify(res.data));
        })
        .catch((err) => {
          if (err?.response) {
            if (err?.response?.status === 401) {
              setIsAuthenticated(false);
            }
          }
        });

      setEditCustomer(-1);
    }

    // Updates tab title
    document.title = "Customers | Dokuly";
  }, [props.refresh]);

  /**
   * Interpret boolean value as Yes/No in the table.
   */
  function formatIsActiveYesNo(rowIndex, row, index) {
    return row.is_active === true ? "Yes" : "No";
  }

  function formatEditCustomer(value, row, index) {
    return (
      <button className="btn btn-sm ">
        <img
          // width="15px"
          // className="icon-tabler"
          //onClick={() => }
          src="../../static/icons/edit.svg"
          alt="Edit Icon"
        />
      </button>
    );
  }

  const onClickHandler = (rowIndex, row) => {
    setSelectedCustomer(row);
    setEditCustomer(edit_customer + 1);
  };

  const columns = [
    // TODO logo field.
    {
      key: "customer_id",
      header: "Customer number",
    },
    {
      key: "name",
      header: "Customer name",
    },
    {
      key: "is_active",
      header: "Active",
      formatter: formatIsActiveYesNo,
    },
    {
      key: "",
      header: "Edit",
      formatter: formatEditCustomer,
    },
  ];

  const defaultSorted = [
    {
      dataField: "customer_id", // if dataField is not match to any column you defined, it will be ignored.
      order: "desc", // desc or asc
    },
  ];

  return (
    <div
      className="container-fluid mt-2 mainContainerWidth"
      style={{ paddingBottom: "1rem" }}
    >
      <CustomerNewForm setRefresh={props?.setRefresh} />

      <EditCustomerForm
        customer={selected_customer}
        edit_customer={edit_customer}
        setRefreshParent={props?.setRefresh}
      />
      <div className="card rounded p-3">
        {/*redirect ? <Redirect push to={`/documents/${redirectID}`} /> : null*/}
        <DokulyTable
          data={customers}
          columns={columns}
          showCsvDownload={false}
          showPagination={true}
          showSearch={true}
          onRowClick={onClickHandler}
        />
      </div>
    </div>
  );
}
