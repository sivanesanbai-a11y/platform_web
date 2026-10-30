const fs = require('fs');

// 1. Patch src/lib/data.ts
{
  let content = fs.readFileSync('src/lib/data.ts', 'utf8');
  const target = `    try { window.dispatchEvent(new CustomEvent("nunes:records-synced")); } catch {}
  } catch {}
}`;
  const replacement = `    try {
      fetch("/api/data/reset-all", { method: "POST" }).catch(() => {});
    } catch {}
    try { window.dispatchEvent(new CustomEvent("nunes:records-synced")); } catch {}
    try { window.dispatchEvent(new CustomEvent("nunes:forms-cleared")); } catch {}
  } catch {}
}`;

  // Normalize line endings for replacement
  const normalized = content.replace(/\r\n/g, '\n');
  if (normalized.includes(target.replace(/\r\n/g, '\n'))) {
    content = normalized.replace(target.replace(/\r\n/g, '\n'), replacement.replace(/\r\n/g, '\n'));
    // convert back to CRLF
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync('src/lib/data.ts', content, 'utf8');
    console.log('[OK] src/lib/data.ts patched');
  } else {
    console.log('[SKIP/WARN] target not found in src/lib/data.ts');
  }
}

// 2. Patch src/components/Shell.tsx
{
  let content = fs.readFileSync('src/components/Shell.tsx', 'utf8');
  content = content.replace('nunes_purged_all_demo_v6', 'nunes_purged_all_demo_v7');
  fs.writeFileSync('src/components/Shell.tsx', content, 'utf8');
  console.log('[OK] src/components/Shell.tsx patched to nunes_purged_all_demo_v7');
}
