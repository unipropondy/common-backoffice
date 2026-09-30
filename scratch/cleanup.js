const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let changedCount = 0;

walkDir(pagesDir, function(filePath) {
  if (filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Remove fixed hex background colors from buttons
    newContent = newContent.replace(/background:\s*#[a-fA-F0-9]{3,6}\s*;/g, 'background: var(--primary);');
    newContent = newContent.replace(/background-color:\s*#[a-fA-F0-9]{3,6}\s*;/g, 'background: var(--primary);');
    
    // Convert table headers to use the new muted background instead of primary or harsh colors
    newContent = newContent.replace(/background:\s*var\(--primary\)\s*;/g, 'background: var(--bg-muted); color: var(--text-secondary);');
    
    // Remove rigid borders from inputs and tables so index.css can take over smoothly
    newContent = newContent.replace(/border:\s*1px solid #[a-fA-F0-9]{3,6}\s*;/g, 'border: 1px solid var(--border);');
    
    // Change any remaining hardcoded 'white' backgrounds to var(--bg-card)
    newContent = newContent.replace(/background:\s*white\s*;/gi, 'background: var(--bg-card);');
    newContent = newContent.replace(/background-color:\s*white\s*;/gi, 'background: var(--bg-card);');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      changedCount++;
      console.log(`Cleaned up: ${path.basename(filePath)}`);
    }
  }
});

console.log(`\nSuccessfully cleaned up ${changedCount} CSS files to enforce global theme.`);
