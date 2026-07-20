from PIL import Image, ImageDraw

image_path = r"C:\Users\sayed\.gemini\antigravity\brain\ac6d141f-d505-463e-b9ff-a22c6c997435\media__1784490145562.png"
output_path = r"c:\Users\sayed\OneDrive\Desktop\ACME\src\assets\illustration.png"

try:
    img = Image.open(image_path)
    width, height = img.size
    
    # 1. Sample background color at top-left (e.g. x=20, y=20)
    bg_color = img.getpixel((20, 20))
    print(f"Sampled background color: {bg_color}")
    
    # 2. Draw a solid rectangle over the NWORX logo (approx x=0 to x=240, y=0 to y=80)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, 240, 80], fill=bg_color)
    
    # 3. Crop the left portion (0 to width * 0.5)
    crop_box = (0, 0, int(width * 0.5), height)
    cropped_img = img.crop(crop_box)
    cropped_img.save(output_path, "PNG")
    print(f"Successfully cleaned logo and saved cropped illustration to {output_path}")
except Exception as e:
    print(f"Error: {e}")
