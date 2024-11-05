import React from "react";

export function requirementStateFormatter(verification_state) {
    if (verification_state === "Proposed") {
        return <span className="badge badge-pill badge-warning">{verification_state}</span>;
    } else if (verification_state === "Review") {
        return <span className="badge badge-pill badge-warning">{verification_state}</span>;
    } else if (verification_state === "Approved") {
        return <span className="badge badge-pill badge-success">{verification_state}</span>;
    } else if (verification_state === "Rejected") {
        return <span className="badge badge-pill badge-danger">{verification_state}</span>;
    } else if (verification_state === "Verified") {
        return <span className="badge badge-pill badge-success">{verification_state}</span>;
    } else if (verification_state === "Not Compliant") {
        return <span className="badge badge-pill badge-danger">{verification_state}</span>;
    }
    else { verification_state }
}
