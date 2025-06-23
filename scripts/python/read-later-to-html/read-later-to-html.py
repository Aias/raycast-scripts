import json
import os
import sys

def convert_json_to_html(json_file):
    # Ensure we're working with an absolute path
    json_file = os.path.abspath(json_file)
    
    # Generate output file name in the same directory as the input file
    base_name = os.path.splitext(os.path.basename(json_file))[0]
    output_file = os.path.join(os.path.dirname(json_file), f"{base_name}.html")

    # Read and parse the JSON file
    with open(json_file, 'r') as f:
        items = json.load(f)

    # Start building the HTML content
    html_content = """<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>ReadLater Export</title>
    </head>
    <body>
        <h1>Unsorted</h1>
        <ul>
"""

    # Convert each item to an HTML list item
    for item in items:
        link = item.get('link', '')
        time_added = int(item.get('date', 0))
        tags = ' '.join(item.get('tags', []))
        starred = 'starred' if item.get('starred') else ''

        html_content += f"""            <li>
                <a href="{link}" time_added="{time_added}" tags="{tags}" {starred}>{link}</a>
            </li>
"""

    # Close the HTML structure
    html_content += """        </ul>
    </body>
</html>
"""

    # Write the HTML content to the output file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return output_file

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Error: Please provide the JSON file path.")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    # Convert to absolute path if it's not already
    json_file = os.path.abspath(json_file)
    
    if not os.path.exists(json_file):
        print(f"Error: The file '{json_file}' does not exist.")
        sys.exit(1)
    
    try:
        output_file = convert_json_to_html(json_file)
        print(f"HTML file created: {output_file}")
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
