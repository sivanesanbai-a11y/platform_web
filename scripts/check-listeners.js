const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      if (f !== 'node_modules' && f !== '.next') walk(fp);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(fp, 'utf8');
      if (content.includes('addEventListener') && (content.includes('click') || content.includes('mousedown') || content.includes('pointerdown'))) {
        console.log(fp);
      }
    }
  });
}

walk(path.join(__dirname, '..', 'src'));
