import axios from 'axios';
import { tokenConfig } from '../../../configs/auth';


export const editRevisionNotes = (id, app, revision_notes) => {
    const data = { revision_notes: revision_notes }
    const promise = axios.put(
        `api/${app}/put/revisionNotes/${id}/`,
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