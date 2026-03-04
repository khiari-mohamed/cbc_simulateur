const fs = require('fs');
const path = require('path');

const searchPatterns = [
  /localhost/gi,
  /127\.0\.0\.1/g,
  /http:\/\/[^/]+:5000/gi,
  /http:\/\/[^/]+:5173/gi,
  /http:\/\/[^/]+:3000/gi,
];

const excludeDirs = ['node_modules', 'dist', 'build', '.git', 'coverage'];
const results = [];

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      searchPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            pattern: pattern.source
          });
        }
      });
    });
  } catch (err) {
    // Skip files that can't be read
  }
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          walkDir(filePath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(file);
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.env'].includes(ext)) {
          searchFile(filePath);
        }
      }
    });
  } catch (err) {
    // Skip directories that can't be read
  }
}

console.log('🔍 Searching for hardcoded URLs...\n');

walkDir('./frontend/src');
walkDir('./backend/src');
walkDir('./frontend');
walkDir('./backend');

if (results.length === 0) {
  console.log('✅ No hardcoded URLs found!');
} else {
  console.log(`❌ Found ${results.length} hardcoded URL(s):\n`);
  results.forEach(r => {
    console.log(`📁 ${r.file}`);
    console.log(`   Line ${r.line}: ${r.content}`);
    console.log('');
  });
}
