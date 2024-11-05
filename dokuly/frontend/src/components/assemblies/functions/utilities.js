import { toast } from "react-toastify";
import { editAsmInfo } from "./queries";

export function updateAsmField(id, key, value, setRefresh = () => {}) {
  if (!id || !key || value === undefined) {
    toast.error("Error updating part.");
    return;
  }

  const data = {
    [key]: value,
  };

  editAsmInfo(id, data).then((res) => {
    if (res.status === 202) {
      setRefresh(true);
      toast.success("ASM updated");
    } else {
      toast.error(
        "Error updating part. If the problem persists contact support.",
      );
    }
  });
}
