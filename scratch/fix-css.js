const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let changedCount = 0;

walkDir(pagesDir, function(filePath) {
  if (!filePath.endsWith('.css')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let out = content;

  // ── 1. Fix the broken "background: X; color: Y;" on one line from prior script ──
  // The old script turned: background: #xxx; → background: var(--bg-muted); color: var(--text-secondary);
  // which got appended inline, creating broken CSS.  Clean all of that up first.
  out = out.replace(/background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);\s*\n(\s*color\s*:[^;]+;)/g, (match, colorLine) => {
    return `background: var(--bg-muted);\n${colorLine}`;
  });
  // Also fix inline duplicates left on the SAME line
  out = out.replace(/background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);/g, 'background: var(--bg-muted); color: var(--text-secondary);');

  // ── 2. Button colors: specific classes that are clearly call-to-action btns ──
  // Save / New / Submit buttons → primary orange
  out = out.replace(/(\.[\w-]*(save|new|submit|add|confirm|update)[\w-]*\s*\{[^}]*?)background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);/gi, '$1background: var(--primary); color: white;');
  out = out.replace(/(\.[\w-]*(save|new|submit|add|confirm|update)[\w-]*\s*\{[^}]*?)background:\s*var\(--primary\);\s*color:\s*var\(--text-secondary\);/gi, '$1background: var(--primary); color: white;');

  // Cancel / Delete / Close / Back buttons → danger red
  out = out.replace(/(\.[\w-]*(cancel|delete|remove|close|back)[\w-]*\s*\{[^}]*?)background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);/gi, '$1background: var(--danger); color: white;');

  // ── 3. Table headers: should be muted background with dark text ──
  // Fix broken duplicate color declarations from old script
  out = out.replace(/(\.[\w-]+\s+th\s*\{[^}]*?)background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);\s*\n(\s*color\s*:[^;]+;)/g, (match, before, after) => {
    return `${before}background: var(--bg-muted);\n  color: var(--text-secondary);`;
  });
  // Plain th global
  out = out.replace(/(th\s*\{[^}]*?)background:\s*var\(--bg-muted\);\s*color:\s*var\(--text-secondary\);\s*\n(\s*color\s*:[^;]+;)/g, (match, before, after) => {
    return `${before}background: var(--bg-muted);\n  color: var(--text-secondary);`;
  });

  // ── 4. var(--primary) should always pair with color:white for buttons ──
  out = out.replace(/(\.[\w-]+\s*\{[^}]*?)background:\s*var\(--primary\);\s*\n(\s*)(color:\s*white\s*;)/g, '$1background: var(--primary);\n$2$3');

  // ── 5. Specific color fixes: primary-dark buttons should stay primary-dark ──
  out = out.replace(/background:\s*var\(--primary-dark\);\s*color:\s*var\(--text-secondary\);/g, 'background: var(--primary-dark); color: white;');

  if (out !== content) {
    fs.writeFileSync(filePath, out, 'utf8');
    changedCount++;
    console.log(`Fixed: ${path.basename(filePath)}`);
  }
});

console.log(`\nFixed ${changedCount} CSS files.`);
