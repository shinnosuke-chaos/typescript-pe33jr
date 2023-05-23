#!/bin/bash
# create venv and install dependencies under folder app/intersection3

# Read the first parameter as the folder path
folder_path=$1

# Check if the folder path is valid
if [ ! -d "$folder_path" ]; then
    echo "Invalid folder path: $folder_path"
    exit 1
fi

# make app/intersection3 if not exist
mkdir -p "$folder_path"
cd "$folder_path"
echo "pymeshlab==2022.2" > requirements.txt
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
deactivate