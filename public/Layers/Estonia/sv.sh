#!/bin/sh

# Iterate over all files in the current directory
for file in *
do
    # Check if the file name contains curly brackets
    if echo "$file" | grep -q '[{}]'
    then
        # Remove curly brackets from the file name
        new_file=$(echo "$file" | tr -d '{}')
        
        # Rename the file
        mv "$file" "$new_file"
        echo "Renamed '$file' to '$new_file'"
    fi
done

