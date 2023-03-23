from PIL import Image
from lxml import etree

def get_pixel_color(image, x, y):
    return image.getpixel((x, y))

def is_smooth_pixel(image, x, y):
    pixel = get_pixel_color(image, x, y)
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            if dx == 0 and dy == 0:
                continue
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= image.width or ny >= image.height:
                continue
            neighbor_pixel = get_pixel_color(image, nx, ny)
            if neighbor_pixel != pixel:
                return False
    return True

def get_svg_path(image):
    path = etree.Element("path")
    for y in range(image.height):
        for x in range(image.width):
            if not is_smooth_pixel(image, x, y):
                # Start a new path segment
                path_str = f"M {x},{y} "
                curr_x, curr_y = x, y
                # Traverse the neighboring pixels until a smooth pixel is encountered
                while not is_smooth_pixel(image, curr_x, curr_y):
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            if dx == 0 and dy == 0:
                                continue
                            nx, ny = curr_x + dx, curr_y + dy
                            if nx < 0 or ny < 0 or nx >= image.width or ny >= image.height:
                                continue
                            if is_smooth_pixel(image, nx, ny):
                                curr_x, curr_y = nx, ny
                                path_str += f"L {curr_x},{curr_y} "
                                break
                path.append(etree.fromstring(f'<path d="{path_str}" fill="black" stroke="none" />'))
    return path

if __name__ == "__main__":
    img = Image.open("example.png").convert("RGB")
    path = get_svg_path(img)
    svg = etree.Element("svg", attrib={"xmlns": "http://www.w3.org/2000/svg", "width": str(img.width), "height": str(img.height)})
    svg.append(path)
    with open("example.svg", "wb") as f:
        f.write(etree.tostring(svg))
