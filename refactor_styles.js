const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

// Exclude the files we already hand-crafted
const excludeFiles = ['TestSetupScreen.tsx', 'TestSequenceScreen.tsx'];

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace font weights
  content = content.replace(/fontWeight:\s*['"]900['"]/g, 'fontFamily: "Inter_900Black"');
  content = content.replace(/fontWeight:\s*['"](800|bold)['"]/g, 'fontFamily: "Inter_800ExtraBold"');
  content = content.replace(/fontWeight:\s*['"]700['"]/g, 'fontFamily: "Inter_700Bold"');
  content = content.replace(/fontWeight:\s*['"]600['"]/g, 'fontFamily: "Inter_600SemiBold"');
  content = content.replace(/fontWeight:\s*['"]500['"]/g, 'fontFamily: "Inter_500Medium"');
  content = content.replace(/fontWeight:\s*['"](400|normal)['"]/g, 'fontFamily: "Inter_400Regular"');

  // Replace text colors
  content = content.replace(/color:\s*['"]#(000|000000)['"]/g, 'color: "#1F2937"');
  content = content.replace(/color:\s*['"]#(333|333333)['"]/g, 'color: "#374151"');
  content = content.replace(/color:\s*['"]#(555|555555|666|666666)['"]/g, 'color: "#4B5563"');
  content = content.replace(/color:\s*['"]#(888|888888|999|999999)['"]/g, 'color: "#9CA3AF"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored: ${path.basename(filePath)}`);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('.')) continue; // skip hidden files

    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !excludeFiles.includes(file)) {
      refactorFile(fullPath);
    }
  }
}

processDirectory(screensDir);
console.log('Refactor complete!');
