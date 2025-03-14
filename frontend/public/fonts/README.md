# Fonts for PDF Generation

This directory is used for storing fonts needed for PDF generation, especially for RTL languages like Arabic.

The application is currently using the Amiri font loaded from a CDN for Arabic text in PDF exports.

If you want to include local font files instead of loading from CDN, you can:

1. Download the Amiri font files from https://www.amirifont.org/
2. Place them in this directory
3. Update the `PrintIdPdf.jsx` file to load the fonts from this local path

## Font files needed:
- amiri-regular.ttf
- amiri-bold.ttf

## Local usage example:
```javascript
// In PrintIdPdf.jsx
doc.addFont('/fonts/amiri-regular.ttf', 'Amiri', 'normal');
doc.addFont('/fonts/amiri-bold.ttf', 'Amiri', 'bold');
``` 