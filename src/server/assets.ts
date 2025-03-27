import { mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { Readable } from "stream";

import { createClient } from "@supabase/supabase-js";

import "dotenv/config";

const supabaseUrl = "https://bjkjjkhouyemcggignqb.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_KEY ?? "";

// We are using the filesystem and supabase to store assets
const DIR = resolve("./.assets");
const supabase = createClient(supabaseUrl, supabaseKey);

export async function storeAsset(id: string, stream: Readable) {
  await writeToDisk(id, stream)

  try {
    let file = await readFile(join(DIR, id));
    let { error } = await supabase.storage
      .from("uploads")
      .upload("public/" + id, file, { duplex: "half", contentType: "application/octet-stream" });

    if (error) console.log("supabase upload error", error);

    const { data } = await supabase.storage
      .from("uploads")
      .getPublicUrl("public/" + id);

    if (data && data.publicUrl) return data.publicUrl;
  } catch (e) {
    console.log("storeAsset error", e);
  }
}

export async function loadAsset(id: string) {
  // tldraw client resolves assets to supabase public url,
  // but this can also be used, and serves
  // assets from local filesystem if present
  let file;
  try {
    file = await readFile(join(DIR, id));
  } catch (e) {
    console.log('loadAsset file error', e);
    file = null;
  }
  
  if (file) {
    console.log("read file from disk", id)
    return file
  }

  try {
    const { data } = supabase.storage
      .from("uploads")
      .getPublicUrl("public/" + id);
  
    if (data && data.publicUrl) {
      // fetch asset, store to disk and return the asset
      const response = await fetch(data.publicUrl);
      if (!response.ok) {
        throw new Error(`public url response status: ${response.status} id: ${id}`);
      }

      const file = response.body
      await writeToDisk(id, file)
      return file
    } else {
      console.log("no publicUrl for asset", id);
    }
  } catch (e) {
    console.log("loadAsset supabase error", e)
  }

  console.log("no data for asset", id)

}

async function writeToDisk(id: string, stream) {
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, id), stream);
}
