const fs = require('fs');

const lines = fs.readFileSync('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');

for (const l of lines) {
  if (l.includes('"step_index":23420')) {
    const j = JSON.parse(l);
    for (const tc of j.tool_calls || []) {
      console.log('Tool:', tc.name);
      console.log('Path:', tc.args.Path);
      console.log('Target length:', tc.args.Target ? tc.args.Target.length : 0);
      console.log('Replacement length:', tc.args.Replacement ? tc.args.Replacement.length : 0);
      fs.writeFileSync('step_23420_replacement.txt', tc.args.Replacement || tc.args.Content);
      console.log('Saved to step_23420_replacement.txt');
    }
    break;
  }
}
