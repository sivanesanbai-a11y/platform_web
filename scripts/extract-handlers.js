const fs = require('fs');
const readline = require('readline');

async function extractHandlers() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('handleSendToAravindh') && line.includes('handleAravindhAccept') && line.includes('edit_file')) {
      const j = JSON.parse(line);
      for (const tc of j.tool_calls || []) {
        if (tc.name === 'edit_file' && tc.args.Path.includes('ServicingJobForm.tsx')) {
          console.log('--- FOUND REPLACEMENT ---');
          console.log(tc.args.Replacement.substring(0, 1500));
          fs.writeFileSync('extracted_handlers.txt', tc.args.Replacement);
          return;
        }
      }
    }
  }
}

extractHandlers().catch(console.error);
