import axios from "axios";
import { tokenConfig } from "../../../configs/auth";

export const editDocumentRevisionNotes = (id, data) => {
  const promise = axios.put(
    `api/documents/update/revisionNotes/${id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const editDocumentState = (id, data) => {
  const promise = axios.put(
    `api/documents/update/state/${id}/`,
    data,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchDocument = (id) => {
  const promise = axios.get(
    `api/documents/fetchDocument/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const newDocumentRevision = (id, revisionType = 'major') => {
  const promise = axios.post(
    `/api/documents/post/newRevision/${id}/`,
    { revision_type: revisionType },
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};

export const fetchDocumentNumber = (id) => {
  const promise = axios.get(
    `/api/documents/get/documentNumber/${id}/`,
    tokenConfig()
  );
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};
