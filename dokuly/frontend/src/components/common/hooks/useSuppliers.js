import { useState, useEffect } from 'react';
import { getSuppliers } from '../../suppliers/functions/queries';

/**
 * A custom hook for fetching and formatting suppliers.
 *
 * @return {Array} An array containing the suppliers list, a function to manually refresh the suppliers, a loading flag,
 * and an error state.
 * @example
 * const [suppliers, refreshSuppliers, loadingSuppliers, errorSuppliers] = useSuppliers();
**/
function useSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch and format suppliers
    const fetchSuppliers = async () => {
        setLoading(true); // Begin loading
        setError(null); // Reset error state
        try {
            const res = await getSuppliers();
            const formattedSuppliers = res.data.map((supplier) => ({
                ...supplier, // Spread the original supplier object to retain all its properties
                formattedName: supplier.is_active ? `${supplier?.supplier_id} - ${supplier?.name}` : "None", // Add the formattedName property
            }));

            // Optionally, add a "None" option for clearing the supplier selection, if needed for UI components like dropdowns
            const noneOption = { label: "None", value: null, key: -1, formattedName: "None" };
            formattedSuppliers.unshift(noneOption);

            setSuppliers(formattedSuppliers);
        } catch (error) {
            console.error("Failed to fetch suppliers:", error);
            setError(error?.message || "Unable to fetch suppliers");
        }finally {
            setLoading(false); // End loading regardless of success or failure
        }
    };

    // Fetch suppliers on mount
    useEffect(() => {
        fetchSuppliers();
    }, []); // Empty dependency array means this effect runs once on mount

    // Return the state and the refetch function in case you want to manually trigger a refetch
    return [suppliers, fetchSuppliers, loading, error];
}

export default useSuppliers;
