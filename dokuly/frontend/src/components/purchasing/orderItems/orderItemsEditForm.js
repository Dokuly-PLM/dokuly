import React, { useState, useEffect } from "react";
import { Col, Form, Row } from "react-bootstrap";

import { updatePurchaseOrder } from "../functions/queries";

/**
 * # Button with form to create a new assembly.
 */
const OrderItemsEditForm = (props) => {
	const [quantity, setQuantity] = useState(0);
	const [price, setPrice] = useState(0.0);

	const openNewPurchaseOrderForm = () => {
		$("#editFormModal").modal("show");
	};

	function onSubmit() {
		// Push data to the database

		let updatedPart = {
			// Fields used by the view.
			part: props?.purchaseOrderItem.part,
			partDisplayName: props?.purchaseOrderItem.partDisplayName,
			quantity,
			price,
		};
		let newPartsJSON = props?.purchaseOrder?.order_items.filter(
			(part) => part.part !== updatedPart.part,
		);
		newPartsJSON.push(updatedPart);

		let partsArray = newPartsJSON.map((part) => {
			return part.part;
		});

		let totalPrice = 0;
		newPartsJSON.map((part) => {
			totalPrice += part.price * part.quantity;
		});

		let data = {
			// Fields used by the view.
			id: props?.purchaseOrder?.id,
			order_items: newPartsJSON,
			purchase_order_number: props?.purchaseOrder?.purchase_order_number,
			total_price: totalPrice,
		};

		updatePurchaseOrder(data).then((res) => {
			if (res.status === 200) {
				if (props.setRefresh !== undefined) {
					props.setRefresh(true);
				}
			}
			$("#editFormModal").modal("hide");
		});
	}

	function onRemove() {
		let newPartsJSON = props?.purchaseOrder?.order_items.filter(
			(part) => part.part !== props?.purchaseOrderItem.part,
		);

		let totalPrice = 0;
		newPartsJSON.map((part) => {
			totalPrice += part.price * part.quantity;
		});

		let data = {
			// Fields used by the view.
			id: props?.purchaseOrder?.id,
			order_items: newPartsJSON,
			purchase_order_number: props?.purchaseOrder?.purchase_order_number,
			total_price: totalPrice,
		};

		updatePurchaseOrder(data).then((res) => {
			if (res.status === 200) {
				props.setRefresh(true);
			}

			$("#editFormModal").modal("hide");
		});
	}

	useEffect(() => {
		if (
			props?.purchaseOrderItem !== null &&
			props?.purchaseOrderItem !== undefined
		) {
			setQuantity(props.purchaseOrderItem.quantity);
			setPrice(props.purchaseOrderItem.price);
		}
	}, [props]);

	useEffect(() => {
		props?.editClicked !== 0 ? openNewPurchaseOrderForm() : null;
	}, [props?.editClicked]);

	return (
		<div className="container-fluid">
			{/* <!-- Modal --> */}
			<div
				className="modal fade"
				id="editFormModal"
				tabIndex="-1"
				role="dialog"
				aria-hidden="true"
			>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="modal-title">Edit order item</h5>
							<button
								type="button"
								className="close"
								data-dismiss="modal"
								aria-label="Close"
							>
								<span aria-hidden="true">&times;</span>
							</button>
						</div>

						{/* Form inputs below */}

						<div className="m-4">
							<Row>
								<Form.Group as={Col} controlId="formGridQuantity">
									<Form.Label>Quantity</Form.Label>
									<Form.Control
										type="number"
										placeholder="Part"
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
									/>
								</Form.Group>
							</Row>
							<Row>
								<Form.Group as={Col} controlId="formGridPrice">
									<Form.Label>Price [{props?.organizationCurrency}]</Form.Label>
									<Form.Control
										type="number"
										placeholder="Price"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
									/>
								</Form.Group>
							</Row>

							<div className="form-group">
								<Row className="p-3">
									<button
										className="btn dokuly-bg-primary "
										onClick={() => {
											onSubmit();
										}}
									>
										Submit
									</button>

									<button
										className="btn  btn-bg-transparent"
										onClick={() => {
											onRemove();
										}}
									>
										<img src="../../static/icons/trash.svg" alt="Edit Icon" />
										<span className="btn-text">Remove item</span>
									</button>
								</Row>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default OrderItemsEditForm;
