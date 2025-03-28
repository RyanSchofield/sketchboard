import "dotenv/config";

import cors from "@fastify/cors";
import websocketPlugin from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";

import fs from "fs";

import path from "path";
// import dirname from "path";
// import { PlatformPath } from "path";
// import { fileURLToPath } from "url";

// import { dirname } from 'node:path';
// import { fileURLToPath } from 'node:url';

import { loadAsset, storeAsset } from "./assets";
import { makeOrLoadRoom, readList, newRoom } from "./rooms";

const PORT = process.env.PORT ?? 5858;

// const __dirname = dirname(fileURLToPath(import.meta.url));

// For this example we use a simple fastify server with the official websocket plugin
// To keep things simple we're skipping normal production concerns like rate limiting and input validation.
const app = fastify();
app.register(websocketPlugin);
app.register(cors, { origin: "*" });

app.register(fastifyStatic, {
  root: path.resolve("./src/server/public"),
  // prefix: "/public/", // optional: default '/'
  // constraints: { host: 'example.com' } // optional: default {}
});

app.register(async (app) => {
  // This is the main entrypoint for the multiplayer sync
  app.get("/connect/:roomId", { websocket: true }, async (socket, req) => {
    const roomId = (req.params as { roomId: string }).roomId;
    const sessionId = (req.query as { sessionId: string }).sessionId;

    console.log('connect', roomId)
    // extract the connect message manually before creating the room
		const connectMessagePromise = new Promise<string>((resolve) => {
			const handleMessage = (message: any) => {
				socket.removeEventListener('message', handleMessage)
				resolve(message.data.toString())
			}
			socket.addEventListener('message', handleMessage)
		})

    // wait for the it with a timeout in case the message never arrives
		const connectMessage = await Promise.race([
			connectMessagePromise,
			new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
		])

    const room = await makeOrLoadRoom(roomId);
    console.log('got the room')
    room.handleSocketConnect({ sessionId, socket });
    console.log('handled socket connection')

    // finally pass along the connect message
		room.handleSocketMessage(sessionId, connectMessage)
  });

  app.get("/", (request, reply) => {
    reply.sendFile("index.html"); // Serve the index.html from Vite
  });

  app.get("/list", async (request, reply) => {
    const records = await readList();
    reply.send({records: records});
  });

  app.put("/new", {}, async (req, res) => {
    try {
      if (typeof req.body !== "string") return;
      let params = JSON.parse(req.body);
      await newRoom(params.title);
      res.send({ ok: true });
      
    } catch (e) {
      console.log('new room error', e)
      res.send({ok: false})
    }
  }); 

  // To enable blob storage for assets, we add a simple endpoint supporting PUT and GET requests
  // But first we need to allow all content types with no parsing, so we can handle raw data
  app.addContentTypeParser("*", (_, __, done) => done(null));
  app.put("/uploads/:id", {}, async (req, res) => {
    const id = (req.params as any).id as string;
    let url = await storeAsset(id, req.raw);
    console.log('uploads put request sending a url', url)
    res.send({ ok: true, publicUrl: url});
  }); 
  app.get("/uploads/:id", async (req, res) => {
    // tldraw client resolves assets to supabase public url,
    // but this endpoint can also be used
    const id = (req.params as any).id as string;
    const data = await loadAsset(id);
    res.send(data);
  });
});

app.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server started on port ${PORT}`);
});
