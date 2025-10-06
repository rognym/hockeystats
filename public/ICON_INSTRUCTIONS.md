# Icon Files Created

The following SVG icon files have been created in the `/public` folder:

1. `apple-touch-icon.svg` (180x180) - For iOS home screen
2. `icon-192.svg` (192x192) - For Android and web app
3. `icon-512.svg` (512x512) - For high-resolution displays

## Converting SVG to PNG

To complete the setup, you need to convert these SVG files to PNG format. You can:

1. **Online conversion**: Use online SVG to PNG converters like:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png
2. **Using a design tool**: Open the SVG files in:
   - Adobe Illustrator
   - Figma
   - Canva
   - GIMP
3. **Command line** (if you have ImageMagick installed):
   ```bash
   magick apple-touch-icon.svg apple-touch-icon.png
   magick icon-192.svg icon-192.png
   magick icon-512.svg icon-512.png
   ```

## Required PNG files:

- `apple-touch-icon.png` (180x180)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

Place these PNG files in the `/public` folder alongside the SVG files.

## Icon Design

The icons feature:

- Dark background (#1a1a1a) matching your app theme
- Hockey puck and stick design
- "HOCKEY STATS" text
- Blue accent color (#646cff) matching your app
- Statistics visualization elements
