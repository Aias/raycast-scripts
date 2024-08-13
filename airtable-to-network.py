#!/usr/bin/env python3

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Airtable to Network
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🕸️
# @raycast.argument1 { "type": "text", "placeholder": "Path to CSV file" }

# Documentation:
# @raycast.description Convert CSV from Airtable to Gephi-compatible format
# @raycast.author Nick Trombley
# @raycast.authorURL https://github.com/Aias

import csv
import os
import sys

def clean_and_split(s):
    if not s:
        return []
    return [item.strip() for item in s.split(',')]

def process_csv(input_path):
    # Get the base name of the input file (without extension)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(input_path), base_name)
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Output directory created: {output_dir}")  # Debug print

    nodes = {}
    edges = []
    title_to_id = {}  # New dictionary to map titles to IDs
    excluded_columns = ['connections', 'parent', 'children']

    with open(input_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        # Clean up column names and convert to lowercase
        cleaned_fieldnames = [name.lstrip('\ufeff').lower() for name in reader.fieldnames]
        reader.fieldnames = cleaned_fieldnames
        
        print(f"Available columns in CSV: {reader.fieldnames}")
        
        # First pass: create nodes and build title_to_id mapping
        for row in reader:
            node_id = row.get('id', '')
            if not node_id:
                print(f"Warning: Skipping row without id: {row}")
                continue
            
            title = row.get('title', '')
            node_data = {key.lower(): value for key, value in row.items() if key.lower() not in excluded_columns}
            nodes[node_id] = node_data
            title_to_id[title] = node_id

        # Reset file pointer to beginning
        f.seek(0)
        next(reader)  # Skip header row

        # Second pass: create edges using IDs
        for row in reader:
            node_id = row.get('id', '')
            
            # Create edges for parent
            if row.get('parent'):
                parent_id = title_to_id.get(row['parent'], row['parent'])
                edges.append({
                    'source': node_id,
                    'target': parent_id,
                    'type': 'parent'
                })
            
            # Create edges for children
            if row.get('children'):
                for child in clean_and_split(row['children']):
                    child_id = title_to_id.get(child, child)
                    edges.append({
                        'source': node_id,
                        'target': child_id,
                        'type': 'child'
                    })
            
            # Create edges for connections
            if row.get('connections'):
                for connection in clean_and_split(row['connections']):
                    connection_id = title_to_id.get(connection, connection)
                    edges.append({
                        'source': node_id,
                        'target': connection_id,
                        'type': 'connection'
                    })

    # Write nodes to CSV
    nodes_path = os.path.join(output_dir, 'nodes.csv')
    try:
        with open(nodes_path, 'w', newline='', encoding='utf-8') as f:
            fieldnames = ['id'] + [field for field in cleaned_fieldnames if field not in excluded_columns and field != 'id']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for node_id, node in nodes.items():
                row = {'id': node_id}
                row.update({k: v for k, v in node.items() if k != 'id'})
                writer.writerow(row)
        print(f"Nodes file created: {nodes_path}")  # Debug print
    except Exception as e:
        print(f"Error writing nodes file: {e}")

    # Write edges to CSV
    edges_path = os.path.join(output_dir, 'edges.csv')
    try:
        with open(edges_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['source', 'target', 'type'])
            for edge in edges:
                writer.writerow([edge['source'], edge['target'], edge['type']])
        print(f"Edges file created: {edges_path}")  # Debug print
    except Exception as e:
        print(f"Error writing edges file: {e}")

    print(f"Processing complete. Check {output_dir} for output files.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: csv_to_gephi.py <path_to_csv_file>")
        sys.exit(1)
    
    input_csv_path = sys.argv[1]
    if not os.path.exists(input_csv_path):
        print(f"Error: File not found: {input_csv_path}")
        sys.exit(1)
    
    process_csv(input_csv_path)