import React, { Fragment } from "react";
//import AssemblyForm from "./assemblyForm";
import AssemblyTable from "./assemblyTable";
//import AssemblyEditForm from "./assemblyEditForm";

import NewAssemblyForm from "./forms/assemblyNewForm";

export default function AssemblyTop() {
	return (
		<Fragment>
			<div className="text-center m-2" style={{ marginBottom: "2rem" }}>
				<h2>Assemblies</h2>
			</div>
			<NewAssemblyForm />
			<AssemblyTable />
		</Fragment>
	);
}
