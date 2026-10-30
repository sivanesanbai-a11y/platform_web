const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
  const fileStream = fs.createReadStream('C:/Users/NUNES/.gemini/antigravity/brain/12c07030-5d9a-4dbd-a349-d7ddae18b44c/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('nuneslead-7337') || line.includes('cloudflare') || line.includes('cloudflared')) {
      const j = JSON.parse(line);
      if (j.type === 'USER_INPUT' || j.type === 'PLANNER_RESPONSE') {
        console.log(j.step_index, j.type, (j.content || JSON.stringify(j.tool_calls)).substring(0, 180));
      }
    }
  }
}

searchTranscript().catch(console.error);
