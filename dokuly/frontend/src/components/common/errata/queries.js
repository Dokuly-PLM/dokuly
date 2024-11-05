import axios from 'axios';
import { tokenConfig } from '../../../configs/auth';


export const editErrata = (id, app, errata_str) => {
    const data = {
        errata: errata_str,
    };

    const promise = axios.put(
        `api/${app}/update/errata/${id}/`,
        data,
        tokenConfig(),
    );
    const dataPromise = promise.then((res) => res.data);
    const error = promise.catch((err) => err);
    if (error != null) {
        return error;
    }
    return dataPromise;
};