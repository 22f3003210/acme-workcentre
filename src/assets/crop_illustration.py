from PIL import Image

image_path = r"C:\Users\sayed\.gemini\antigravity\brain\ac6d141f-d505-463e-b9ff-a22c6c997435\media__1784490145562.png"
output_path = r"c:\Users\sayed\OneDrive\Desktop\ACME\src\assets\illustration.png"

try:
    img = Image.open(image_path)
    width, height = img.size
    print(f"Original image size: {width} x {height}")
    
    # We want to crop the left portion.
    # The screenshot shows the left portion as the illustration panel.
    # Let's crop from x=0 to x=width*0.5 (or slightly more to get the full illustration)
    # Let's look at the NWORX image: the illustration itself is in the middle of the left half.
    # Let's crop the left half: 0 to width*0.5, and full height.
    # But wait, does it have any margins? Let's check:
    crop_box = (0, 0, int(width * 0.5), height)
    cropped_img = img.crop(crop_box)
    cropped_img.save(output_path, "PNG")
    print(f"Successfully cropped and saved to {output_path}")
except Exception as e:
    print(f"Error: {e}")
