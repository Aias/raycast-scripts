import sys
import xml.etree.ElementTree as ET

def flatten_opml(opml_file):
    tree = ET.parse(opml_file)
    root = tree.getroot()

    # Create a new body element
    new_body = ET.Element("body")

    # Iterate through all outline elements and collect leaf nodes
    for outline in root.iter('outline'):
        if not list(outline):
            new_body.append(outline)

    # Replace the old body with the new flattened body
    body = root.find('body')
    root.remove(body)
    root.append(new_body)

    # Write the updated XML tree to a new file
    output_file = 'flattened_' + opml_file
    tree.write(output_file, encoding='UTF-8', xml_declaration=True)
    print(f"Flattened OPML file written to '{output_file}'")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python flatten_opml.py <opml_file>")
        sys.exit(1)

    opml_file = sys.argv[1]
    flatten_opml(opml_file)
