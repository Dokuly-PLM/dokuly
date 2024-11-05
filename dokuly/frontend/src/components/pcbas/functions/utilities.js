import { toast } from "react-toastify";
import { editPcba } from "./queries";

export function updatePcbaField(id, key, value, setRefresh = () => {}) {
  if (!id || !key || value === undefined) {
    toast.error("Error updating part.");
    return;
  }

  const data = {
    [key]: value,
  };

  editPcba(id, data).then((res) => {
    if (res.status === 200) {
      setRefresh(true);
    }
  });
}
