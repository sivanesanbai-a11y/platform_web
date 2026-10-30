const fs = require('fs');

console.log('Searching transcript for .period-tile in css...');
const lines = fs.readFileSync('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  const l = lines[i];
  if ((l.includes('.period-tile') || l.includes('period-tile {')) && !l.includes('find-period-tile')) {
    const j = JSON.parse(l);
    for (const tc of j.tool_calls || []) {
      if ((tc.name === 'edit_file' || tc.name === 'write_file') && (tc.args.Path || '').endsWith('.css')) {
        console.log('CSS File:', tc.args.Path, 'in step', j.step_index);
        fs.writeFileSync('period_tile_found.txt', tc.args.Replacement || tc.args.Content);
        console.log('Content preview:\n', (tc.args.Replacement || tc.args.Content).substring(0, 500));
        return;
      }
    }
  }
}
