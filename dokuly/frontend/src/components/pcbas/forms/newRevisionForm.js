import React, { useState, useEffect } from "react";

import { createNewRevision } from "../functions/queries";

/**
 * # Button to revise a PCBA.
 */
const PcbaForm = (props) => {
	const [pcba, setPcba] = useState(null);

	useEffect(() => {
		if (props.pcba !== undefined && props.pcba !== null) {
			setPcba(props.pcba);
		}
	}, [props.pcba]);

	function createNew() {
		// Push data to the database
		createNewRevision(pcba.id).then((res) => {
			if (res.status === 200) {
				window.location.href = `/#/pcbas/${res.data.id}`;
			}
		});
	}

	return (
		<div className="container-fluid">
			{pcba?.release_state === "Released" && pcba?.latest_revision === true ? (
				<button
					type="button"
					className="btn btn-bg-transparent mt-2 mb-2"
					onClick={() => createNew()}
				>
					<div className="row">
						<img
							className="icon-dark"
							src="../../static/icons/circle-plus.svg"
							alt="icon"
						/>
						<span className="btn-text">New revision</span>
					</div>
				</button>
			) : (
				""
			)}
		</div>
	);
};

export default PcbaForm;
