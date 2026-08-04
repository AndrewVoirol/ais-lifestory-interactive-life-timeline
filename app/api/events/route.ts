import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for persistence
const DB_PATH = path.join(process.cwd(), 'data', 'events.json');

// Helper to load events
const loadEvents = (): any[] => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load events from disk:', error);
  }
  return [];
};

// Helper to save events
const saveEvents = (events: any[]) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(events, null, 2));
  } catch (error) {
    console.error('Failed to save events to disk:', error);
  }
};

// In-memory store initialized from disk
let sharedEvents: any[] = loadEvents();
let clients: Set<ReadableStreamDefaultController> = new Set();

const broadcastUserCount = () => {
  const countData = `data: ${JSON.stringify({ type: 'user-count', count: clients.size })}\n\n`;
  const encodedData = new TextEncoder().encode(countData);
  clients.forEach(client => {
    try {
      client.enqueue(encodedData);
    } catch (e) {
      clients.delete(client);
    }
  });
};

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      broadcastUserCount();
      
      // Send initial state and retry instruction
      const initialData = `retry: 5000\ndata: ${JSON.stringify({ type: 'init', events: sharedEvents })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialData));

      // Keep connection alive (reduced interval to 15s to prevent proxy timeouts)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch (e) {
          clearInterval(keepAlive);
          clients.delete(controller);
          broadcastUserCount();
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        clients.delete(controller);
        broadcastUserCount();
      });
    },
    cancel() {
      clients.forEach(client => {
        // Find and remove this controller if possible
        // Note: Set doesn't easily allow finding by value if we don't have the ref
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, payload } = body;

  if (type === 'add') {
    sharedEvents.push(payload);
  } else if (type === 'update') {
    sharedEvents = payload;
  } else if (type === 'delete') {
    sharedEvents = sharedEvents.filter(e => e.id !== payload);
  } else if (type === 'reorder') {
    // Payload is an array of IDs in the new order
    const orderedIds = payload as string[];
    const eventMap = new Map(sharedEvents.map(e => [e.id, e]));
    const newEvents: any[] = [];
    
    // Add events in the new order
    orderedIds.forEach(id => {
      if (eventMap.has(id)) {
        newEvents.push(eventMap.get(id));
        eventMap.delete(id);
      }
    });
    
    // Append any remaining events (concurrently added)
    eventMap.forEach(event => {
      newEvents.push(event);
    });
    
    sharedEvents = newEvents;
  }

  // Persist to disk
  saveEvents(sharedEvents);

  // Notify all clients
  const updateData = `data: ${JSON.stringify({ type: 'update', events: sharedEvents })}\n\n`;
  const encodedData = new TextEncoder().encode(updateData);
  
  clients.forEach(client => {
    try {
      client.enqueue(encodedData);
    } catch (e) {
      console.error('Failed to notify client, removing from list', e);
      clients.delete(client);
    }
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
