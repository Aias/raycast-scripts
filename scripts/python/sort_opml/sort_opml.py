import sys
import xml.etree.ElementTree as ET

def sort_opml(opml_file):
    tree = ET.parse(opml_file)
    root = tree.getroot()

    # Get all outline elements
    outlines = list(root.iter('outline'))

    # Sort outlines by xmlUrl
    sorted_outlines = sorted(outlines, key=lambda x: x.get('xmlUrl', ''))

    # Remove existing outline elements from the body
    body = root.find('body')
    for outline in outlines:
        body.remove(outline)

    # Rearrange attributes and append sorted outlines to the body
    for outline in sorted_outlines:
        attrib_order = ['type', 'xmlUrl', 'htmlUrl', 'title', 'text']
        attrib_dict = {attr: outline.attrib.pop(attr) for attr in attrib_order if attr in outline.attrib}
        attrib_dict.update(outline.attrib)
        outline.attrib = attrib_dict
        body.append(outline)

    # Write the updated XML tree to a new file
    output_file = 'sorted_' + opml_file
    tree.write(output_file, encoding='UTF-8', xml_declaration=True)
    print(f"Sorted OPML file written to '{output_file}'")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python sort_opml.py <opml_file>")
        sys.exit(1)

    opml_file = sys.argv[1]
    sort_opml(opml_file)
