import { tokenConfig } from "../../../configs/auth";
import axios from "axios";

/**
 * An axios wrapper function, can be used in any react component.
 * Fetches the information contained within the user that is logged in.
 * @return {Promise<AxiosResponse<any>>} The axios data promsie, 
 * contains a data response or error message based on response status.
 *
 * @example
  const [userData, setUserData] = useState({})
  fetchUser()
  .then((res) => {
    if(res.status === 200) {
      setUserData(res.data)
    }
  })
  .catch((err) => {
    if(err.response.status === 401) {
      // Handle err response...
    }
  })
 */
export const getUser = () => {
  const promise = axios.get("/api/auth/user", tokenConfig());
  const dataPromise = promise.then((res) => res.data);
  const error = promise.catch((err) => err);
  if (error != null) {
    return error;
  }
  return dataPromise;
};
