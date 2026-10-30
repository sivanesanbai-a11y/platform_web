const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'ProductsClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'const finalImg = newImageUrl.trim() || "/images/servicing_tools.png";',
  'const finalImg = newImageUrl.trim() || "";'
);

content = content.replace(
  '(e.target as HTMLImageElement).src = "/images/servicing_tools.png";',
  '(e.target as HTMLImageElement).style.visibility = "hidden";'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('src/components/ProductsClient.tsx updated!');
