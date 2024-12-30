#!/bin/bash

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <destination_directory> [new_name]"
  exit 1
fi

SOURCE_FOLDER="test-results"
DESTINATION_DIR=$1
NEW_NAME=$2

# Ensure the source folder exists
if [ ! -d "$SOURCE_FOLDER" ]; then
  echo "Error: Source folder '$SOURCE_FOLDER' does not exist."
  exit 2
fi

# Ensure the destination directory exists
if [ ! -d "$DESTINATION_DIR" ]; then
  echo "Error: Destination directory '$DESTINATION_DIR' does not exist."
  exit 3
fi

# Determine the new folder name, if folder name is not passed, use date and username
if [ -z "$NEW_NAME" ]; then
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  USERNAME=$(whoami)
  NEW_NAME="${TIMESTAMP}_${USERNAME}"
fi

NEW_REPORT_PATH="$DESTINATION_DIR/$NEW_NAME"

mv "$SOURCE_FOLDER" "$NEW_REPORT_PATH"

# Check if the operation was successful
if [ $? -eq 0 ]; then
  echo "Folder successfully moved to '$NEW_REPORT_PATH'."
else
  echo "Error: Failed to move the folder."
  exit 4
fi