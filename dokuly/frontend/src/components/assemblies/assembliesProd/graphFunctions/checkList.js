import React, { useEffect, useState } from "react";
import { constructionCheck } from "./constructionCheck";
import { pcbaCheck } from "./pcbaCheck";
import { fetchNodesForblueprint } from "./queries";

const CheckList = (props) => {
	const currentBom = props.bom;
	if (currentBom != null && currentBom != undefined) {
		localStorage.setItem("currentBom", JSON.stringify(currentBom));
	} else {
		let bomFromStorage = localStorage.getItem("currentBom", currentBom);
		if (bomFromStorage != undefined && bomFromStorage != null) {
			currentBom = JSON.parse(bomFromStorage);
		} else if (bomFromStorage.length === 0 || bomFromStorage === []) {
			localStorage.removeItem("currentBom");
		} else {
			localStorage.removeItem("currentBom");
		}
	}

	const currentASM = props.asm;

	const [nodesData, setNodesData] = useState(props.nodes);
	const [currentSerial, setCurrentSerial] = useState(props.serial);
	const [constructionDone, setConstructionDone] = useState(props.construction);
	const [pcbaAddedArr, setPcbaAddedArr] = useState([]);
	const [elements, setElements] = useState(props.elements);
	const [reload, setReload] = useState(false);

	let storageElements = localStorage.getItem("graphElements");
	let currentElements = JSON.parse(storageElements);
	if (elements.length != currentElements.length) {
		setElements(currentElements);
		setReload(true);
	}

	useEffect(() => {
		if (reload) {
			setReload(false);
		}
		if (
			currentASM != undefined &&
			currentASM != null &&
			elements != undefined &&
			elements != null
		) {
			fetchNodesForblueprint(currentASM.pcba_used).then((res) => {
				let callback = constructionCheck(currentASM, elements, res.data);

				if (callback) {
					setConstructionDone(true);
				} else {
					setConstructionDone(false);
				}
			});
			if (currentBom) {
				if (elements) {
					let newCheck = [];
					currentBom.map((pcba) => {
						let check = pcbaCheck(pcba, elements);
						newCheck.push(check);
					});
					setPcbaAddedArr(newCheck);
				}
			} else {
				let bomFromStorage = localStorage.getItem("currentBom", currentBom);
				if (bomFromStorage != undefined && bomFromStorage != null) {
					currentBom = JSON.parse(bomFromStorage);
					if (elements) {
						let newCheck = [];
						currentBom.map((pcba) => {
							let check = pcbaCheck(pcba, elements);
							newCheck.push(check);
						});
						setPcbaAddedArr(newCheck);
					}
				}
			}
		}
	}, [reload]);

	return (
		<div className="container">
			{pcbaAddedArr && pcbaAddedArr.length != 0 ? (
				pcbaAddedArr.map((el, index) => {
					return (
						<div
							key={el.bomEntry.part_number}
							className="row"
							style={
								index != 0 ? { marginTop: "0.3rem" } : { marginTop: "-0.1rem" }
							}
						>
							<div className="column">
								{el.bomEntry.part_number}
								{el.bomEntry.revision}
							</div>
							<div className="column" style={{ textAlign: "center" }}>
								{el.status ? (
									<img
										data-toggle="tooltip"
										data-placement="right"
										title="Assembled PCBA added to graph"
										src="../../../../static/icons/circle-check.svg"
										style={{
											filter:
												"invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
										}}
										className="ml-1"
										width="30px"
										height="30px"
									/>
								) : (
									<img
										data-toggle="tooltip"
										data-placement="right"
										title="Required ASM PCBA not added to graph"
										src="../../../../static/icons/alert-circle.svg"
										style={{
											filter:
												"invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
										}}
										className="ml-1"
										width="30px"
										height="30px"
									/>
								)}
							</div>
						</div>
					);
				})
			) : (
				<a style={{ marginLeft: "-1rem" }}>No bom to make checklist from</a>
			)}
			<div
				className="row"
				style={{
					textAlign: "center",
					marginTop: "0.3rem",
					marginBottom: "0.5rem",
				}}
			>
				<a>Construction </a>
				{constructionDone ? (
					<img
						data-toggle="tooltip"
						data-placement="right"
						title="Construction of ASM finished"
						src="../../../../static/icons/circle-check.svg"
						style={{
							filter:
								"invert(81%) sepia(36%) saturate(4745%) hue-rotate(93deg) brightness(106%) contrast(101%)",
						}}
						className="ml-1"
						width="30px"
						height="30px"
					/>
				) : (
					<img
						data-toggle="tooltip"
						data-placement="right"
						title="Construction of ASM not finished, check your connections!"
						src="../../../../static/icons/alert-circle.svg"
						style={{
							filter:
								"invert(42%) sepia(72%) saturate(6100%) hue-rotate(1deg) brightness(101%) contrast(107%)",
						}}
						className="ml-1"
						width="30px"
						height="30px"
					/>
				)}
			</div>
		</div>
	);
};

export default CheckList;
