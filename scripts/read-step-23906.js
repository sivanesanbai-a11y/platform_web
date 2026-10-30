const fs = require('fs');
const readline = require('readline');

async function readStep23906() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('"step_index":23906')) {
      const j = JSON.parse(line);
      console.log('Step 23906 Content:');
      console.log(j.content);
      return;
    }
  }
}

readStep23906().catch(console.error);
