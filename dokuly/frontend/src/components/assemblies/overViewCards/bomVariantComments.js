import React, { useState, useEffect } from "react";
import { editBomVariantComments, fetchASM } from "../functions/queries";

const BomVariantComments = (props) => {
	const url = window.location.href.toString();
	const split = url.split("/");
	const currentASMID = parseInt(split[5]);

	const [ASMDetailed, setASMDetailed] = useState(
		props.asm != null && props.asm != undefined ? props.asm : -1,
	);
	const [bomDetailed, setBomDetailed] = useState(
		props.bom != null && props.bom !== undefined ? props.bom : null,
	);
	const [comments, setcomments] = useState(
		props.bom[0].bom_entity_comments !== undefined
			? props.bom[0].bom_entity_comments
			: "",
	);
	const [refresh, setRefresh] = useState(false);
	const [show, setShow] = useState(false);

	if (ASMDetailed == -1) {
		fetchASM(currentASMID).then((res) => {
			setASMDetailed(res.data);
		});
	}

	const submit = () => {
		if (
			comments == "" ||
			comments == undefined ||
			comments == null ||
			comments.length > 500
		) {
			alert("Invalid input. Max 500 characters, min 1.");
			return;
		}
		const data = {
			comments: comments,
		};
		if (bomDetailed[0] !== undefined && bomDetailed[0] !== null) {
			editBomVariantComments(bomDetailed[0].bom_entity_id, data).then((res) => {
				setcomments(res.data.comments);
				setRefresh(true);
			});
		}
		$("#editBomComments").modal("hide");
	};

	const editComments = () => {
		$("#editBomComments").modal("show");
	};

	const handleChange = (e) => {
		setcomments(e.target.value);
	};

	useEffect(() => {
		if (bomDetailed == null) {
			let storageItem = localStorage.getItem("lastUsedBom");
			if (storageItem !== null && storageItem !== undefined) {
				let bom = JSON.parse(storageItem);
				if (bom !== null && bom !== undefined) {
					setBomDetailed(bom);
				}
			}
		}
		if (refresh) {
			setRefresh(false);
		}
	}, [refresh]);

	return (
		<div>
			<button
				type="button"
				className="btn btn btn-info"
				style={{ marginTop: "1rem", marginLeft: "1.5rem" }}
				onClick={() => {
					setShow(!show);
				}}
			>
				{show ? "Hide Comments" : "Show Comments"}
			</button>
			{show && (
				<div
					className="card-body bg-white m-3 shadow-sm rounded"
					style={{ maxWidth: "60rem" }}
				>
					{ASMDetailed == undefined || bomDetailed == undefined ? (
						<div
							style={{ margin: "5rem" }}
							className="d-flex m-5 dokuly-primary justify-content-center"
						>
							<div className="spinner-border" role="status"></div>
						</div>
					) : (
						<React.Fragment>
							<h5>
								<b>Bom Variant Comments</b>
							</h5>
							<div className="row" style={{ maxWidth: "inherit" }}>
								<div
									className="col"
									style={{ lineBreak: "strict", maxWidth: "inherit" }}
								>
									{comments}
								</div>
							</div>
							<div className="row">
								<div className="col-3">
									<div>
										{/* <!-- Button trigger modal --> */}
										<button
											type="button"
											className="btn btn-sm btn-info"
											style={{ marginTop: "1rem" }}
											onClick={() => {
												editComments();
											}}
											// data-toggle="modal"
											// data-target="#addASM"
										>
											<img
												className="icon-tabler"
												src="../../static/icons/edit.svg"
												alt="icon"
											/>
											Comments
										</button>
										{/* <!-- Modal --> */}
										<div
											className="modal fade"
											id="editBomComments"
											tabIndex="-1"
											role="dialog"
											aria-labelledby="editBomCommentsLabel"
											aria-hidden="true"
										>
											<div className="modal-dialog" role="document">
												<div className="modal-content">
													<div className="modal-header">
														<h5
															className="modal-title"
															id="editBomCommentsLabel"
														>
															Edit Bom Variant Comments
														</h5>
														<button
															type="button"
															className="close"
															data-dismiss="modal"
															aria-label="Close"
														>
															<span aria-hidden="true">&times;</span>
														</button>
													</div>
													<div className="modal-body">
														<div className="form-group">
															<label>Comments</label>
															<textarea
																className="form-control height-500"
																type="text"
																name="notes"
																onChange={(e) => handleChange(e)}
																value={comments}
															/>
														</div>

														<div className="form-group">
															<button
																className="btn btn-info"
																onClick={() => submit()}
															>
																Submit
															</button>
															<button
																className="btn btn-danger"
																onClick={() =>
																	$("editBomComments").modal("hide")
																}
															>
																Cancel
															</button>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</React.Fragment>
					)}
				</div>
			)}
		</div>
	);
};

export default BomVariantComments;
