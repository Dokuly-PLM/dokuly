import React from "react";
import { deletePrice } from "./queries";
import { toast } from "react-toastify";

const DeletePrice = ({ row, setRefresh }) => {
    const handleDelete = (e) => {
        e.preventDefault();

        if (!confirm("Are you sure you want to delete?")) {
            return;
        }

        deletePrice(row.id)
            .then(() => {
                toast.success("Price successfully deleted.");
                setRefresh(true);
            })
            .catch((error) => {
                toast.error("Error deleting item: " + error.message);
                // Error handling logic
            });
    };

    return (
        <button className="btn btn-bg-transparent" onClick={handleDelete}
            style={{ maxHeight: '30px', overflow: 'hidden' }}>
            <img
                className="icon-dark"
                src="../../static/icons/trash.svg"
                alt="trash"
                style={{ maxWidth: '18px', maxHeight: '18px' }}
            />
        </button >
    );
};

export default DeletePrice;
