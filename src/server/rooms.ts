import { RoomSnapshot, TLSocketRoom } from "@tldraw/sync-core";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bjkjjkhouyemcggignqb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa2pqa2hvdXllbWNnZ2lnbnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU0OTk3ODksImV4cCI6MjA0MTA3NTc4OX0.krqhc-HPBpjJpmQidzKC7BugXySY7jwzeFg7hV9zHmE";
const supabase = createClient(supabaseUrl, supabaseKey);

const upsertJam = async (title, color, jsonData, id = "") => {
  const newJam = {
    title: title,
    color: color,
    json: jsonData,
    jam_id: id,
  };

  const { error } = await supabase.from("jams").upsert(newJam);

  if (error) console.error(error);
};

// For this example we're just saving data to the local filesystem
const DIR = "./.rooms";
async function readSnapshotIfExists(roomId: string) {
  try {
    const data = await readFile(join(DIR, roomId));
    // read from database here
    return JSON.parse(data.toString()) ?? undefined;
  } catch (e) {
    return undefined;
  }
}

let isUpdating = false;
async function saveSnapshot(roomId: string, snapshot: RoomSnapshot) {
  await mkdir(DIR, { recursive: true });
  const jsonData = JSON.stringify(snapshot);
  await writeFile(join(DIR, roomId), jsonData);
  console.log("saveSnapshot");
  if (!isUpdating) {
    isUpdating = true;
    upsertJam("test", 123, jsonData, roomId);
    console.log("updating");
    setTimeout(() => (isUpdating = false), 15000);
  }
}

// We'll keep an in-memory map of rooms and their data
interface RoomState {
  room: TLSocketRoom<any, void>;
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

      const roomState: RoomState = {
        needsPersist: false,
        id: roomId,
        room: new TLSocketRoom({
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
}, 2000);
