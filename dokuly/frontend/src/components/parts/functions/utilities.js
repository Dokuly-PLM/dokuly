import { toast } from "react-toastify";
import { editPart } from "./queries";

export function updatePartField(id, key, value, setRefresh = () => {}) {
  if (!id || !key || value === undefined) {
    toast.error("Error updating part.");
    return;
  }

  const data = {
    [key]: value,
  };

  editPart(id, data).then((res) => {
    if (res.status === 201) {
      setRefresh(true);
      toast.success("Part updated");
    } else {
      toast.error(
        "Error updating part. If the problem persists contact support.",
      );
    }
  });
}
