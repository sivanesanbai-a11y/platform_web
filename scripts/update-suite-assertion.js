const fs = require('fs');

let content = fs.readFileSync('scripts/verify-workflow-passes.js', 'utf8');
content = content.replace(
  "assert('Shell.tsx includes nunes:product_profiles in nunes_purged_all_demo_v6',\n  shellCode.includes('nunes_purged_all_demo_v6') &&",
  "assert('Shell.tsx includes nunes:product_profiles in demo purge',\n  (shellCode.includes('nunes_purged_all_demo_v6') || shellCode.includes('nunes_purged_all_demo_v7')) &&"
);

fs.writeFileSync('scripts/verify-workflow-passes.js', content, 'utf8');
console.log('[OK] Updated suite assertion in verify-workflow-passes.js');
