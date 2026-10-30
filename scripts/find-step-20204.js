const fs = require('fs');
const readline = require('readline');

async function findStep() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":20204')) {
      const j = JSON.parse(line);
      for (const tc of j.tool_calls || []) {
        console.log('Tool:', tc.name);
        console.log('Path:', tc.args.Path);
        console.log('Target:\n', tc.args.Target);
        console.log('Replacement:\n', tc.args.Replacement.substring(0, 1000));
      }
      break;
    }
  }
}

findStep().catch(console.error);
