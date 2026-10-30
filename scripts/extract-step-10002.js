const fs = require('fs');
const readline = require('readline');

async function extractStepRange() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":') && line.includes('handlePriyaSubmitPriceToMd') && line.includes('edit_file')) {
      const j = JSON.parse(line);
      console.log('Step:', j.step_index);
      for (const tc of j.tool_calls || []) {
        if (tc.name === 'edit_file') {
          fs.writeFileSync('extracted_pipeline_handlers.txt', tc.args.Replacement);
          console.log('Saved to extracted_pipeline_handlers.txt from step', j.step_index);
          return;
        }
      }
    }
  }
}

extractStepRange().catch(console.error);
