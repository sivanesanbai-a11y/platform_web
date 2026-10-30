import fs from "fs";
import { put, list } from "@vercel/blob";

async function main() {
  console.log("Token exists:", !!process.env.BLOB_READ_WRITE_TOKEN);
  try {
    const res = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
    console.log("Existing blobs count:", res.blobs.length);
    for (const b of res.blobs) {
      console.log(`- ${b.pathname}: ${b.url}`);
    }

    const localStorePath = "data/nunes_cloud_store.json";
    const localStore = JSON.parse(fs.readFileSync(localStorePath, "utf8"));
    console.log("Local store summary:", {
      service_jobs: localStore.service_jobs.length,
      purchasing_orders: localStore.purchasing_orders.length,
      quotations: localStore.quotations.length,
      users: localStore.users.length,
    });

    const uploadRes = await put("nunes_cloud_store.json", JSON.stringify(localStore, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log("Uploaded successfully to Vercel Blob! Public URL:", uploadRes.url);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
