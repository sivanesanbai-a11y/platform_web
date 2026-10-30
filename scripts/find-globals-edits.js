const fs = require('fs');

const lines = fs.readFileSync('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('globals.css') && (l.includes('write_file') || l.includes('edit_file'))) {
    const j = JSON.parse(l);
    for (const tc of j.tool_calls || []) {
      if ((tc.args.Path || '').includes('globals.css')) {
        console.log('Step:', j.step_index, tc.name, tc.args.Path, 'Content/Repl length:', (tc.args.Content || tc.args.Replacement || '').length, tc.name === 'write_file' ? '(OVERWRITE FULL FILE!)' : '');
      }
    }
  }
}
