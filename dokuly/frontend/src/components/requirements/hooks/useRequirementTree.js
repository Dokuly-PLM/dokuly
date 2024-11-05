import { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Assuming react-toastify for error handling

import { getRequirementsBySet } from '../functions/queries';

const useRequirementTree = (requirementSetId) => {
    const [requirementTree, setRequirementTree] = useState([]);

    // Function to build tree from requirements data
    const buildTree = (items) => {
        const tempItems = [...items];
        const tree = [];

        // Creating a map of items with their ids as keys
        const itemsMap = tempItems.reduce((map, item) => {
            map[item.id] = { ...item, children: [] };
            return map;
        }, {});

        // Populate the tree with children
        tempItems.forEach(item => {
            if (item.parent_requirement) {
                itemsMap[item.parent_requirement].children.push(itemsMap[item.id]);
            } else {
                tree.push(itemsMap[item.id]);
            }
        });

        return tree;
    };

    // Function to fetch data
    const fetchData = () => {
        if (requirementSetId === -1) { return; }

        getRequirementsBySet(requirementSetId).then((res) => {
            if (res.status === 200) {
                const tree = buildTree(res.data);
                setRequirementTree(tree);
            }
        })
            .catch((error) => {
                toast.error("Failed to fetch requirements: " + error.message);
            });
    };

    useEffect(() => {
        fetchData();
    }, [requirementSetId]);

    const refresh = () => {
        fetchData();
    };

    return [requirementTree, refresh];
};

export default useRequirementTree;
