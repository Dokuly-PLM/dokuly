#!/bin/bash

# Default path
DEFAULT_PATH="./dokuly/"

# Use the first argument as the path if provided, otherwise use the default path
PATH_PREFIX=${1:-$DEFAULT_PATH}

# Python files with docktests
python3 "${PATH_PREFIX}pcbas/processCsv.py" -v
python3 "${PATH_PREFIX}pcbas/viewUtilities.py" -v
python3 "${PATH_PREFIX}assembly_bom/viewHelpers.py" -v