import React, { useState, useEffect } from "react";
import { createNewRevision } from "../functions/queries";
import RevisionTypeModal from "../../dokuly_components/revisionTypeModal";

/**
 * # Button to revise a PCBA.
 */
const PcbaForm = (props) => {
	const [pcba, setPcba] = useState(null);
	const [showModal, setShowModal] = useState(false);

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

	const handleCreateRevision = (revisionType) => {
		// Pass the selected revision type to the API
		createNewRevision(pcba.id, revisionType).then((res) => {
			if (res.status === 200) {
				// Close modal first
				setShowModal(false);
				window.location.href = `/#/pcbas/${res.data.id}`;
			}
		}).catch((error) => {
			console.error('Error creating revision:', error);
			// Close modal even on error
			setShowModal(false);
		});
	};

	return (
		<div className="container-fluid">
			{pcba?.release_state === "Released" ? (
				<button
					type="button"
					className="btn btn-bg-transparent mt-2 mb-2"
					onClick={() => setShowModal(true)}
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
			
			<RevisionTypeModal
				show={showModal}
				onHide={() => setShowModal(false)}
				onConfirm={handleCreateRevision}
				currentRevision={pcba?.formatted_revision}
				organization={pcba?.organization}
			/>
		</div>
	);
};

export default PcbaForm;
