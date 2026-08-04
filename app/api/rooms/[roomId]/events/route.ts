import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { LifeEvent, Contributor, EventComment, EventPhoto, Correction } from '@/lib/types';

// ============================================================
// Per-room state management
// ============================================================

interface RoomState {
  events: LifeEvent[];
  contributors: Map<string, Contributor>;
  clients: Set<ReadableStreamDefaultController>;
}

const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      events: loadEvents(roomId),
      contributors: new Map(),
      clients: new Set(),
    });
  }
  return rooms.get(roomId)!;
}

// ============================================================
// File persistence (per room)
// ============================================================

function getDbPath(roomId: string): string {
  return path.join(process.cwd(), 'data', 'rooms', `${roomId}.json`);
}

function loadEvents(roomId: string): LifeEvent[] {
  try {
    const dbPath = getDbPath(roomId);
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Failed to load events for room ${roomId}:`, error);
  }
  return [];
}

function saveEvents(roomId: string, events: LifeEvent[]) {
  try {
    const dbPath = getDbPath(roomId);
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(events, null, 2));
  } catch (error) {
    console.error(`Failed to save events for room ${roomId}:`, error);
  }
}

// ============================================================
// Broadcasting
// ============================================================

function broadcast(room: RoomState, data: string) {
  const encoded = new TextEncoder().encode(`data: ${data}\n\n`);
  room.clients.forEach((client) => {
    try {
      client.enqueue(encoded);
    } catch {
      room.clients.delete(client);
    }
  });
}

function broadcastEvents(room: RoomState) {
  broadcast(room, JSON.stringify({ type: 'update', events: room.events }));
}

function broadcastPresence(room: RoomState) {
  const users = Array.from(room.contributors.values());
  broadcast(room, JSON.stringify({ type: 'presence', users }));
  broadcast(room, JSON.stringify({ type: 'user-count', count: room.clients.size }));
}

// ============================================================
// GET — SSE stream
// ============================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoom(roomId);

  const stream = new ReadableStream({
    start(controller) {
      room.clients.add(controller);

      // Send initial state
      const initPayload = JSON.stringify({
        type: 'init',
        events: room.events,
        users: Array.from(room.contributors.values()),
      });
      controller.enqueue(
        new TextEncoder().encode(`retry: 5000\ndata: ${initPayload}\n\n`)
      );

      // Broadcast updated presence
      broadcastPresence(room);

      // Keep-alive every 15s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch {
          clearInterval(keepAlive);
          room.clients.delete(controller);
          broadcastPresence(room);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        room.clients.delete(controller);
        broadcastPresence(room);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}

// ============================================================
// POST — mutations
// ============================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getRoom(roomId);
  const body = await req.json();
  const { type, payload } = body;

  switch (type) {
    case 'add': {
      room.events.push(payload as LifeEvent);
      break;
    }

    case 'update': {
      // Payload is the full updated event
      const updatedEvent = payload as LifeEvent;
      room.events = room.events.map((e) =>
        e.id === updatedEvent.id ? updatedEvent : e
      );
      break;
    }

    case 'delete': {
      room.events = room.events.filter((e) => e.id !== payload);
      break;
    }

    case 'reorder': {
      const orderedIds = payload as string[];
      const eventMap = new Map(room.events.map((e) => [e.id, e]));
      const newEvents: LifeEvent[] = [];

      orderedIds.forEach((id) => {
        if (eventMap.has(id)) {
          newEvents.push(eventMap.get(id)!);
          eventMap.delete(id);
        }
      });

      // Append any concurrently added events
      eventMap.forEach((event) => newEvents.push(event));
      room.events = newEvents;
      break;
    }

    case 'add-comment': {
      const { eventId, comment } = payload as {
        eventId: string;
        comment: EventComment;
      };
      const event = room.events.find((e) => e.id === eventId);
      if (event) {
        if (!event.comments) event.comments = [];
        event.comments.push(comment);
      }
      break;
    }

    case 'add-photo': {
      const { eventId: photoEventId, photo } = payload as {
        eventId: string;
        photo: EventPhoto;
      };
      const photoEvent = room.events.find((e) => e.id === photoEventId);
      if (photoEvent) {
        if (!photoEvent.photos) photoEvent.photos = [];
        photoEvent.photos.push(photo);
      }
      break;
    }

    case 'add-correction': {
      const { eventId: corrEventId, correction } = payload as {
        eventId: string;
        correction: Correction;
      };
      const corrEvent = room.events.find((e) => e.id === corrEventId);
      if (corrEvent) {
        if (!corrEvent.corrections) corrEvent.corrections = [];
        corrEvent.corrections.push(correction);
      }
      break;
    }

    case 'join': {
      const contributor = payload as Contributor;
      contributor.isOnline = true;
      contributor.lastSeen = Date.now();
      room.contributors.set(contributor.id, contributor);
      broadcastPresence(room);
      // Don't save to file, just broadcast
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    case 'leave': {
      const contributorId = payload as string;
      const existing = room.contributors.get(contributorId);
      if (existing) {
        existing.isOnline = false;
        existing.lastSeen = Date.now();
      }
      broadcastPresence(room);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    default:
      return new Response(JSON.stringify({ error: 'Unknown type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  // Persist events and broadcast
  saveEvents(roomId, room.events);
  broadcastEvents(room);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
