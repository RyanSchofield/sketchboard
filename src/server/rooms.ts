import { RoomSnapshot, TLSocketRoom } from "@tldraw/sync-core";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

import { createClient } from "@supabase/supabase-js";

import "dotenv/config";
import { createTLSchema, defaultShapeSchemas, UnknownRecord } from "tldraw";
import { cardShapeProps } from "../card-shape-props";

const supabaseUrl = "https://bjkjjkhouyemcggignqb.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const upsertJam = async (
  title = "", 
  color: number | null = null, 
  jsonData: any | null = null, 
  id: string | null =  null
) => {
  const roomData: {
    title?: string, 
    color?: number, 
    json?: any, 
    jam_id?: string
  } = {};

  if (title) roomData.title = title;
  if (color !== null) roomData.color = color;
  if (id) roomData.jam_id = id;
  if (jsonData) roomData.json = jsonData

  const { error } = await supabase.from("jams").upsert(roomData);

  if (error) console.error(error);
};

export async function newRoom(title?: string)  {
  if (!title) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
  
    title = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  upsertJam(title, 0)
};

// Save to filesystem and database
const DIR = "./.rooms";
async function readSnapshotIfExists(roomId: string) {
  try {
    const data = await readFile(join(DIR, roomId));
    console.log('read data from filesystem ', !!data)
    return JSON.parse(data.toString()) ?? undefined;
  } catch (e) {
    console.log('attempt to read from db')
    const query = supabase.from("jams")
      .select("*")
      .eq("jam_id", roomId);
    const response = await query;
    const data = response?.data?.[0] ?? undefined;

    if (data) {
      console.log('got something from db', JSON.parse(data.json))
      // write to the file system here
      if (data.json) writetoDisk(roomId, data.json);
      return JSON.parse(data.json) ?? undefined;
    }

    console.log('error loading snapshot')
    return undefined;
  }
}

export async function readList() {
  const query = supabase.from("jams")
    .select("*")
    .eq("active", true)
    .order('created_at', {ascending: false});

  const response = await query;
  const records = response?.data ?? [];
  return records;
}

async function writetoDisk(roomId, jsonData) {
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, roomId), jsonData);
}

let isUpdating = false;
async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
  
  const jsonData = JSON.stringify(snapshot);
  writetoDisk(roomId, jsonData)
  console.log("saveSnapshot");
  if (!isUpdating) {
    isUpdating = true;
    upsertJam("", 0, jsonData, roomId);
    console.log("updating");
    setTimeout(() => (isUpdating = false), 5000);
  }
}

// We'll keep an in-memory map of rooms and their data
interface RoomState {
  room: TLSocketRoom;
  id: string;
  needsPersist: boolean;
}
const rooms = new Map<string, RoomState>();

// Very simple mutex using promise chaining, to avoid race conditions
// when loading rooms. In production you probably want one mutex per room
// to avoid unnecessary blocking!
let mutex = Promise.resolve<null | Error>(null);

export async function makeOrLoadRoom(roomId: string) {
  mutex = mutex
    .then(async () => {
      if (rooms.has(roomId)) {
        const roomState = await rooms.get(roomId)!;
        if (!roomState.room.isClosed()) {
          return null; // all good
        }
      }
      console.log("loading room", roomId);
      const initialSnapshot = await readSnapshotIfExists(roomId);

      const customShapeSchemas = {
        card : {
          props: cardShapeProps
        }
      }

      const storeShapes = {...defaultShapeSchemas, ...customShapeSchemas}

      const roomState: RoomState = {
        needsPersist: false,
        id: roomId,
        room: new TLSocketRoom<UnknownRecord, void>({
          initialSnapshot,
          onSessionRemoved(room, args) {
            console.log("client disconnected", args.sessionId, roomId);
            if (args.numSessionsRemaining === 0) {
              console.log("closing room", roomId);
              room.close();
            }
          },
          onDataChange() {
            roomState.needsPersist = true;
          },
          //@fixme: fix type
          schema: createTLSchema({shapes: storeShapes})
        }),
      };
      rooms.set(roomId, roomState);
      return null; // all good
    })
    .catch((error) => {
      // return errors as normal values to avoid stopping the mutex chain
      return error;
    });

  const err = await mutex;
  if (err) throw err;
  return rooms.get(roomId)!.room;
}

// Do persistence on a regular interval.
// In production you probably want a smarter system with throttling.
setInterval(() => {
  for (const roomState of Array.from(rooms.values())) {
    if (roomState.needsPersist) {
      // persist room
      roomState.needsPersist = false;
      console.log("saving snapshot", roomState.id);
      saveSnapshot(roomState.id, roomState.room.getCurrentSnapshot());
    }
    if (roomState.room.isClosed()) {
      console.log("deleting room", roomState.id);
      rooms.delete(roomState.id);
    }
  }
}, 100);
