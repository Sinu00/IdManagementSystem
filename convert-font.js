const fs = require('fs');
const path = require('path');

// Path to the font file
const fontPath = path.join(__dirname, 'public', 'fonts', 'NotoSansArabic-Regular.ttf');
const outputPath = path.join(__dirname, 'src', 'utils', 'pdf', 'ArabicFont.js');

try {
  // Read the font file
  const fontBuffer = fs.readFileSync(fontPath);
  
  // Convert to Base64
  const base64Font = fontBuffer.toString('base64');
  
  // Create the font definition file
  const fontDefinition = `// Auto-generated Arabic font for jsPDF
// Font: Noto Sans Arabic Regular
// Generated: ${new Date().toISOString()}

const NotoSansArabicRegular = '${base64Font}';

export default NotoSansArabicRegular;
`;

  // Write the font definition file
  fs.writeFileSync(outputPath, fontDefinition);
  
  console.log('✅ Font converted successfully!');
  console.log(`📁 Font file: ${fontPath}`);
  console.log(`📄 Output file: ${outputPath}`);
  console.log(`📊 Font size: ${(fontBuffer.length / 1024).toFixed(2)} KB`);
  console.log(`📊 Base64 size: ${(base64Font.length / 1024).toFixed(2)} KB`);
  
} catch (error) {
  console.error('❌ Error converting font:', error.message);
  process.exit(1);
} 