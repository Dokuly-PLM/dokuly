import { useState, useEffect } from "react";
import { getUser } from "../../layout/queries";

/**
 * A custom hook for fetching and formatting profile.
 *
 * @return {Array} A stateful value (suppliers) and a function to manually refresh the suppliers.
 */
function useProfile() {
  const [profile, setProfile] = useState(null);

  // Function to fetch and format suppliers
  const fetchProfile = async () => {
    try {
      const res = await getUser();
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  };

  // Fetch suppliers on mount
  useEffect(() => {
    fetchProfile();
  }, []); // Empty dependency array means this effect runs once on mount

  // Return the state and the refetch function in case you want to manually trigger a refetch
  return [profile, fetchProfile];
}

export default useProfile;
