const fs = require('fs');
const readline = require('readline');

async function listAllUserInputs() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"')) {
      const j = JSON.parse(line);
      count++;
      const text = (j.content || '').replace(/<[^>]+>/g, '').trim();
      console.log(`[USER ${count} (step ${j.step_index})]: ${text.replace(/\s+/g, ' ').substring(0, 120)}`);
    }
  }
}

listAllUserInputs().catch(console.error);
