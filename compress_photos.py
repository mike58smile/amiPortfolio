#!/usr/bin/env python3
"""
Compress and create thumbnails from photos
Usage: python compress_photos.py

Processes all images in the current directory:
- Creates optimized full-size versions in 'photos/' subfolder
- Creates thumbnails in 'thumbnails/' subfolder
"""

from PIL import Image
import os
from pathlib import Path

try:
    RESAMPLE_FILTER = Image.Resampling.LANCZOS
except AttributeError:
    RESAMPLE_FILTER = Image.LANCZOS

# Configuration
FULL_SIZE_MAX = 1920  # Max dimension for full images
THUMB_SIZE = 800      # Max dimension for thumbnails
FULL_QUALITY = 85     # Quality for full images (1-100)
THUMB_QUALITY = 80    # Quality for thumbnails (1-100)
SUPPORTED_FORMATS = ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff')

def create_folders():
    """Create output folders if they don't exist"""
    Path('photos').mkdir(exist_ok=True)
    Path('thumbnails').mkdir(exist_ok=True)
    print("✓ Created output folders: photos/ and thumbnails/")

def compress_image(input_path, output_path, max_size, quality):
    """Compress and resize an image"""
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize maintaining aspect ratio
            img.thumbnail((max_size, max_size), RESAMPLE_FILTER)
            
            # Save with optimization
            img.save(
                output_path,
                format='JPEG',
                quality=quality,
                optimize=True,
                progressive=True
            )
        return True
    except Exception as e:
        print(f"  ✗ Error processing {input_path.name}: {e}")
        return False

def get_output_filename(filename):
    """Convert filename to .jpg extension"""
    return Path(filename).stem + '.jpg'

def process_images():
    """Process all images in current directory"""
    current_dir = Path('.')
    image_files = [f for f in current_dir.iterdir() 
                   if f.is_file() and f.suffix.lower() in SUPPORTED_FORMATS]
    
    if not image_files:
        print("No images found in current directory!")
        return
    
    print(f"\nFound {len(image_files)} images to process\n")
    
    success_count = 0
    for idx, img_file in enumerate(image_files, 1):
        output_name = get_output_filename(img_file.name)
        full_output = Path('photos') / output_name
        thumb_output = Path('thumbnails') / output_name
        
        print(f"[{idx}/{len(image_files)}] Processing: {img_file.name}")
        
        # Create full-size compressed version
        if compress_image(img_file, full_output, FULL_SIZE_MAX, FULL_QUALITY):
            full_size = full_output.stat().st_size / 1024
            print(f"  ✓ Full size: {full_size:.1f} KB → photos/{output_name}")
        
        # Create thumbnail
        if compress_image(img_file, thumb_output, THUMB_SIZE, THUMB_QUALITY):
            thumb_size = thumb_output.stat().st_size / 1024
            print(f"  ✓ Thumbnail: {thumb_size:.1f} KB → thumbnails/{output_name}")
            success_count += 1
        
        print()
    
    print(f"✓ Complete! Processed {success_count}/{len(image_files)} images")
    print(f"\nOutput folders:")
    print(f"  - photos/      (optimized full-size images)")
    print(f"  - thumbnails/  (gallery thumbnails)")

if __name__ == '__main__':
    print("=" * 60)
    print("Photo Compression Tool")
    print("=" * 60)
    
    try:
        from PIL import Image
    except ImportError:
        print("\n✗ Error: Pillow library not installed")
        print("Install it with: pip install Pillow")
        exit(1)
    
    create_folders()
    process_images()
    
    print("\nNext steps:")
    print("1. Move original photos to a backup folder")
    print("2. Move compressed photos from 'photos/' to assets/photos/")
    print("3. Update code to use thumbnails for gallery")
