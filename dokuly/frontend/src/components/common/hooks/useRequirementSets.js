import { useState, useEffect } from 'react';
import { getRequirementSets } from '../../requirements/functions/queries';

/**
 * A custom hook for fetching, caching, and refreshing requirement sets.
 * It loads requirement sets from localStorage for immediate rendering, but also fetches from
 * the server to ensure data is up to date, caching new data again.
 *
 * @return {Array} A stateful value (requirementSets) and a function to manually refresh the requirement sets.
 */
function useRequirementSets() {
    const [requirementSets, setRequirementSets] = useState([]);

    // Function to fetch and cache requirement sets
    const fetchAndCacheRequirementSets = async () => {
        try {
            const res = await getRequirementSets();
            const formattedRequirementSets = res.data.map(requirementSet => ({
                ...requirementSet,
                formattedName: `${requirementSet.name}`, // Add a formattedName property for display
            }));
            localStorage.setItem('requirementSets', JSON.stringify(formattedRequirementSets)); // Cache in localStorage
            setRequirementSets(formattedRequirementSets);
        } catch (error) {
            console.error("Failed to fetch requirement sets:", error);
            // On fetch error, use any existing data in local storage as a fallback
            fetchFromLocalStorage();
        }
    };

    // Function to fetch requirement sets from local storage
    const fetchFromLocalStorage = () => {
        try {
            const storedRequirementSets = localStorage.getItem('requirementSets');
            if (storedRequirementSets) {
                setRequirementSets(JSON.parse(storedRequirementSets)); // Attempt to parse the stored JSON
            }
        } catch (error) {
            console.error("Error parsing requirement sets from localStorage:", error);
            localStorage.removeItem('requirementSets'); // Remove corrupted data from localStorage
        }
    };

    // Fetch requirement sets on mount
    useEffect(() => {
        const cachedRequirementSets = localStorage.getItem('requirementSets');
        if (cachedRequirementSets) {
            try {
                setRequirementSets(JSON.parse(cachedRequirementSets)); // Attempt to parse the stored JSON for immediate use
            } catch (error) {
                console.error("Error parsing requirement sets from localStorage on mount:", error);
                localStorage.removeItem('requirementSets'); // Remove corrupted data from localStorage
            }
        }
        fetchAndCacheRequirementSets();  // Always fetch to ensure data is up to date
    }, []); // Empty dependency array means this effect runs once on mount

    return [requirementSets, fetchAndCacheRequirementSets];
}

export default useRequirementSets;
