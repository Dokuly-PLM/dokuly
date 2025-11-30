import React, { Fragment } from "react";
import HomepageComponent from "./homepageComponent";
import ErrorBoundary from "../common/errorBoundaries";

export default function HomepageDashboard() {
	return (
		<Fragment>
			<ErrorBoundary>
				<HomepageComponent />
			</ErrorBoundary>
		</Fragment>
	);
}
