import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const getLatestPrices = (app, id) => {
    const promise = axios.get(`api/price/get/latestPrices/${app}/${id}/`, tokenConfig());
    const dataPromise = promise.then((res) => res.data);
    const error = promise.catch((err) => err);
    if (error != null) {
        return error;
    }
    return dataPromise;
};

export const addNewPrice = (app, id, price = 0.0, minimum_order_quantity = 1, currency = "", supplier_id = null,) => {
    const data = {
        price,
        minimum_order_quantity,
        currency,
        supplier_id,
    };
    const promise = axios.post(`api/price/post/addNewPrice/${app}/${id}/`, data, tokenConfig());
    const dataPromise = promise.then((res) => res.data);
    const error = promise.catch((err) => err);
    if (error != null) {
        return error;
    }
    return dataPromise;
};

export const editPrice = (price_id, data) => {
    const promise = axios.put(`api/price/put/editPrice/${price_id}/`, data, tokenConfig());
    const dataPromise = promise.then((res) => res.data);
    const error = promise.catch((err) => err);
    if (error != null) {
        return error;
    }
    return dataPromise;
}

export const deletePrice = (price_id) => {
    const promise = axios.delete(`api/price/delete/${price_id}/`, tokenConfig());
    const dataPromise = promise.then((res) => res.data);
    const error = promise.catch((err) => err);
    if (error != null) {
        return error;
    }
    return dataPromise;
}