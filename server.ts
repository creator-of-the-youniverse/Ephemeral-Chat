// Clean up invalid globalThis.__dirname injected into the Node runtime environment
if (typeof Reflect.get(globalThis, '__dirname') === 'string' && Reflect.get(globalThis, '__dirname') === '.') {
  Reflect.deleteProperty(globalThis, '__dirname');
}

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';

export interface Message {
  id: string;
  sender: 'host' | 'guest';
  senderName: string;
  text: string;
  messageType?: 'text' | 'image';
  imageData?: string;
  isEncrypted?: boolean;
  viewOnce?: boolean;
  createdAt: number;
  expiresAt?: number;
}

export type RoomStatus =
  | 'WAITING_FOR_GUEST'
  | 'GUEST_KNOCKED'
  | 'ACTIVE'
  | 'ENDED'
  | 'DESTROYED';

export interface Room {
  id: string;
  hostToken: string;
  guestToken?: string;
  hostName: string;
  guestName?: string;
  status: RoomStatus;
  createdAt: number;
  lastActivity: number;
  hostConnected: boolean;
  guestConnected: boolean;
  hostEnded: boolean;
  guestEnded: boolean;
  messages: Message[];
  autoDestructSeconds?: number;
}

interface ClientMeta {
  roomId: string;
  role: 'host' | 'guest';
  ws: WebSocket;
}

// In-memory ephemeral room storage
const rooms = new Map<string, Room>();
// Active WebSocket clients mapped by ws
const clients = new Map<WebSocket, ClientMeta>();
// Timeouts for self-destructing messages
const messageDestructTimers = new Map<string, NodeJS.Timeout>();

function sanitizeRoomForRole(room: Room, role: 'host' | 'guest') {
  // If participant ended their side, hide the other participant's messages in their view
  const myEnded = role === 'host' ? room.hostEnded : room.guestEnded;
  const filteredMessages = myEnded
    ? room.messages.filter((m) => m.sender === role)
    : room.messages;

  return {
    id: room.id,
    role,
    hostName: room.hostName,
    guestName: room.guestName,
    status: room.status,
    createdAt: room.createdAt,
    hostConnected: room.hostConnected,
    guestConnected: room.guestConnected,
    hostEnded: room.hostEnded,
    guestEnded: room.guestEnded,
    messages: filteredMessages,
    autoDestructSeconds: room.autoDestructSeconds || 0,
  };
}

function broadcastToRoom(roomId: string, data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId && ws.readyState === WebSocket.OPEN && ws !== excludeWs) {
      // If sending a room state update, sanitize it per recipient role
      if (data.type === 'ROOM_UPDATE' && data.roomObj) {
        const roleData = {
          ...data,
          room: sanitizeRoomForRole(data.roomObj, meta.role),
          roomObj: undefined,
        };
        ws.send(JSON.stringify(roleData));
      } else {
        ws.send(payload);
      }
    }
  }
}

function destroyRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  // Clear any pending message timers
  for (const msg of room.messages) {
    const timer = messageDestructTimers.get(msg.id);
    if (timer) {
      clearTimeout(timer);
      messageDestructTimers.delete(msg.id);
    }
  }

  // Notify all connected clients in this room
  broadcastToRoom(roomId, { type: 'ROOM_DESTROYED' });

  // Close and clean up sockets for this room
  for (const [ws, meta] of clients.entries()) {
    if (meta.roomId === roomId) {
      clients.delete(ws);
      try {
        ws.close(1000, 'Room destroyed');
      } catch (e) {
        // ignore
      }
    }
  }

  // Remove room completely
  rooms.delete(roomId);
}

// Periodic cleanup of truly abandoned rooms (idle for > 12 hours)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    const isAbandoned = !room.hostConnected && !room.guestConnected && (now - room.lastActivity > 12 * 60 * 60 * 1000);
    if (isAbandoned) {
      destroyRoom(roomId);
    }
  }
}, 15 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // Create ephemeral room (User 1)
  app.post('/api/rooms', (req, res) => {
    const { hostName } = req.body;
    if (!hostName || typeof hostName !== 'string' || !hostName.trim()) {
      return res.status(400).json({ error: 'Please provide a valid display name.' });
    }

    // Unpredictable random roomId (16 characters URL-safe)
    const roomId = crypto.randomBytes(9).toString('base64url');
    // Cryptographically secure secret host capability token
    const hostToken = crypto.randomBytes(24).toString('hex');

    const now = Date.now();
    const newRoom: Room = {
      id: roomId,
      hostToken,
      hostName: hostName.trim().slice(0, 30),
      status: 'WAITING_FOR_GUEST',
      createdAt: now,
      lastActivity: now,
      hostConnected: false,
      guestConnected: false,
      hostEnded: false,
      guestEnded: false,
      messages: [],
      autoDestructSeconds: 0,
    };

    rooms.set(roomId, newRoom);

    return res.status(201).json({
      roomId,
      hostToken,
      room: sanitizeRoomForRole(newRoom, 'host'),
    });
  });

  // Get room info (handles public check for invitation or authenticated sync)
  app.get('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ exists: false, error: 'This private room no longer exists.' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      if (token === room.hostToken) {
        return res.json({ exists: true, room: sanitizeRoomForRole(room, 'host') });
      }
      if (token === room.guestToken) {
        return res.json({ exists: true, room: sanitizeRoomForRole(room, 'guest') });
      }
    }

    // Public info for someone arriving at the waiting room link
    return res.json({
      exists: true,
      roomId: room.id,
      hostName: room.hostName,
      status: room.status,
      hasGuest: !!room.guestToken,
      guestEnded: room.guestEnded,
      hostEnded: room.hostEnded,
    });
  });

  // Guest arrives at waiting room and knocks on the door
  app.post('/api/rooms/:roomId/knock', (req, res) => {
    const { roomId } = req.params;
    const { guestName } = req.body;

    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'This private room no longer exists.' });
    }

    if (room.status === 'ENDED' || (room.hostEnded && room.guestEnded)) {
      return res.status(410).json({ error: 'This room has been closed.' });
    }

    // If already active with another guest and connected
    if (room.status === 'ACTIVE' && room.guestToken && room.guestConnected) {
      return res.status(403).json({ error: 'This private room is already full.' });
    }

    if (!guestName || typeof guestName !== 'string' || !guestName.trim()) {
      return res.status(400).json({ error: 'Please enter your display name.' });
    }

    const trimmedGuestName = guestName.trim().slice(0, 30);
    const guestToken = crypto.randomBytes(24).toString('hex');

    room.guestName = trimmedGuestName;
    room.guestToken = guestToken;
    room.status = 'GUEST_KNOCKED';
    room.lastActivity = Date.now();

    // Broadcast knock to host in real time
    broadcastToRoom(roomId, {
      type: 'GUEST_KNOCKED',
      guestName: trimmedGuestName,
    });

    return res.json({
      guestToken,
      guestName: trimmedGuestName,
      status: 'GUEST_KNOCKED',
    });
  });

  // Host opens the door
  app.post('/api/rooms/:roomId/open-door', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== room.hostToken) {
      return res.status(403).json({ error: 'Unauthorized: Only the host can open the door.' });
    }

    room.status = 'ACTIVE';
    room.lastActivity = Date.now();

    // Broadcast to both host and guest that door is opened
    broadcastToRoom(roomId, {
      type: 'DOOR_OPENED',
      roomObj: room,
    });

    return res.json({ success: true, room: sanitizeRoomForRole(room, 'host') });
  });

  // Host rejects/keeps door closed
  app.post('/api/rooms/:roomId/keep-door-closed', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== room.hostToken) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    room.status = 'WAITING_FOR_GUEST';
    room.guestToken = undefined;
    room.guestName = undefined;
    room.lastActivity = Date.now();

    broadcastToRoom(roomId, {
      type: 'KNOCK_DECLINED',
      message: 'The door was not opened.',
    });

    return res.json({ success: true, room: sanitizeRoomForRole(room, 'host') });
  });

  // Send a message
  app.post('/api/rooms/:roomId/messages', (req, res) => {
    const { roomId } = req.params;
    const {
      text,
      messageType = 'text',
      imageData,
      isEncrypted = true,
      viewOnce = false,
      autoDestructSeconds,
    } = req.body;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    if (room.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Chat is not currently active.' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    const isHost = token === room.hostToken;
    const isGuest = token === room.guestToken;

    if (!isHost && !isGuest) {
      return res.status(403).json({ error: 'Unauthorized participant.' });
    }

    // Check if participant has already ended their side
    if ((isHost && room.hostEnded) || (isGuest && room.guestEnded)) {
      return res.status(403).json({ error: 'You have ended your side of the conversation.' });
    }

    if (messageType === 'image') {
      if (!imageData || typeof imageData !== 'string') {
        return res.status(400).json({ error: 'Image data is required.' });
      }
    } else {
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }
    }

    const ttl = Number(autoDestructSeconds) || room.autoDestructSeconds || 0;
    const now = Date.now();
    const msgId = crypto.randomUUID();

    const message: Message = {
      id: msgId,
      sender: isHost ? 'host' : 'guest',
      senderName: isHost ? room.hostName : (room.guestName || 'Guest'),
      text: (text || '').trim(),
      messageType,
      imageData,
      isEncrypted,
      viewOnce,
      createdAt: now,
      expiresAt: ttl > 0 ? now + ttl * 1000 : undefined,
    };

    room.messages.push(message);
    room.lastActivity = now;

    // Broadcast new message in real time
    broadcastToRoom(roomId, {
      type: 'NEW_MESSAGE',
      message,
    });

    // Schedule auto-destruct if enabled
    if (ttl > 0) {
      const timer = setTimeout(() => {
        const r = rooms.get(roomId);
        if (r) {
          r.messages = r.messages.filter((m) => m.id !== msgId);
          broadcastToRoom(roomId, {
            type: 'MESSAGE_DESTRUCTED',
            messageId: msgId,
          });
        }
        messageDestructTimers.delete(msgId);
      }, ttl * 1000);
      messageDestructTimers.set(msgId, timer);
    }

    return res.status(201).json({ success: true, message });
  });

  // Delete / Destroy a specific message immediately (e.g. view-once destruction)
  app.delete('/api/rooms/:roomId/messages/:messageId', (req, res) => {
    const { roomId, messageId } = req.params;
    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found.' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== room.hostToken && token !== room.guestToken) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    room.messages = room.messages.filter((m) => m.id !== messageId);
    const timer = messageDestructTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      messageDestructTimers.delete(messageId);
    }

    broadcastToRoom(roomId, {
      type: 'MESSAGE_DESTRUCTED',
      messageId,
    });

    return res.json({ success: true });
  });

  // End side of conversation (Two-Sided Termination Model)
  app.post('/api/rooms/:roomId/end', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found or already destroyed.' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    const isHost = token === room.hostToken;
    const isGuest = token === room.guestToken;

    if (!isHost && !isGuest) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    if (isHost) {
      room.hostEnded = true;
    } else {
      room.guestEnded = true;
    }

    room.lastActivity = Date.now();

    // Check if BOTH participants have ended
    if (room.hostEnded && room.guestEnded) {
      destroyRoom(roomId);
      return res.json({
        destroyed: true,
        message: 'Both participants have ended the chat. Room and messages have been permanently destroyed.',
      });
    }

    // Only one participant has ended their side
    room.status = 'ENDED';

    broadcastToRoom(roomId, {
      type: 'PARTICIPANT_ENDED',
      endedBy: isHost ? 'host' : 'guest',
      endedByName: isHost ? room.hostName : room.guestName,
      roomObj: room,
    });

    return res.json({
      destroyed: false,
      endedSide: isHost ? 'host' : 'guest',
      bothEnded: false,
      message: "You've closed your side of the conversation.",
    });
  });

  // Update ephemeral room settings (e.g., auto-destruct timer)
  app.patch('/api/rooms/:roomId/settings', (req, res) => {
    const { roomId } = req.params;
    const { autoDestructSeconds } = req.body;
    const room = rooms.get(roomId);

    if (!room) return res.status(404).json({ error: 'Room not found.' });

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token !== room.hostToken && token !== room.guestToken) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    room.autoDestructSeconds = Number(autoDestructSeconds) || 0;
    broadcastToRoom(roomId, {
      type: 'SETTINGS_CHANGED',
      autoDestructSeconds: room.autoDestructSeconds,
    });

    return res.json({ success: true, autoDestructSeconds: room.autoDestructSeconds });
  });

  // Create HTTP & WebSocket Server
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    const roomId = url.searchParams.get('roomId');
    const token = url.searchParams.get('token');

    if (!roomId || !token) {
      ws.close(4001, 'Missing roomId or token');
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      ws.close(4004, 'Room not found or destroyed');
      return;
    }

    const isHost = token === room.hostToken;
    const isGuest = token === room.guestToken;

    if (!isHost && !isGuest) {
      ws.close(4003, 'Unauthorized token');
      return;
    }

    const role: 'host' | 'guest' = isHost ? 'host' : 'guest';
    clients.set(ws, { roomId, role, ws });

    // Update connection presence
    if (isHost) {
      room.hostConnected = true;
    } else {
      room.guestConnected = true;
    }
    room.lastActivity = Date.now();

    // Send initial sync to this client
    ws.send(
      JSON.stringify({
        type: 'INIT',
        room: sanitizeRoomForRole(room, role),
      })
    );

    // Notify others of presence update
    broadcastToRoom(
      roomId,
      {
        type: 'PRESENCE_CHANGE',
        hostConnected: room.hostConnected,
        guestConnected: room.guestConnected,
      },
      ws
    );

    // Handle messages / signals from client
    ws.on('message', (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString());
        const currentRoom = rooms.get(roomId);
        if (!currentRoom) return;

        currentRoom.lastActivity = Date.now();

        // WebRTC Signaling Forwarding (P2P zero-logging transmission)
        if (data.type === 'RTC_SIGNAL') {
          broadcastToRoom(
            roomId,
            {
              type: 'RTC_SIGNAL',
              from: role,
              signal: data.signal,
            },
            ws
          );
          return;
        }

        // Typing indicators (ephemeral)
        if (data.type === 'TYPING') {
          broadcastToRoom(
            roomId,
            {
              type: 'USER_TYPING',
              sender: role,
              isTyping: !!data.isTyping,
            },
            ws
          );
          return;
        }

        // Send chat message via WebSocket
        if (data.type === 'SEND_MESSAGE') {
          if (currentRoom.status !== 'ACTIVE') return;
          if ((isHost && currentRoom.hostEnded) || (isGuest && currentRoom.guestEnded)) return;

          const messageType: 'text' | 'image' = data.messageType === 'image' ? 'image' : 'text';
          const text = (data.text || '').trim();
          const imageData = data.imageData;

          if (messageType === 'image' && !imageData) return;
          if (messageType === 'text' && !text) return;

          const ttl = Number(data.autoDestructSeconds) || currentRoom.autoDestructSeconds || 0;
          const now = Date.now();
          const msgId = crypto.randomUUID();

          const message: Message = {
            id: msgId,
            sender: role,
            senderName: isHost ? currentRoom.hostName : (currentRoom.guestName || 'Guest'),
            text,
            messageType,
            imageData,
            isEncrypted: data.isEncrypted !== false,
            viewOnce: !!data.viewOnce,
            createdAt: now,
            expiresAt: ttl > 0 ? now + ttl * 1000 : undefined,
          };

          currentRoom.messages.push(message);

          broadcastToRoom(roomId, {
            type: 'NEW_MESSAGE',
            message,
          });

          if (ttl > 0) {
            const timer = setTimeout(() => {
              const r = rooms.get(roomId);
              if (r) {
                r.messages = r.messages.filter((m) => m.id !== msgId);
                broadcastToRoom(roomId, {
                  type: 'MESSAGE_DESTRUCTED',
                  messageId: msgId,
                });
              }
              messageDestructTimers.delete(msgId);
            }, ttl * 1000);
            messageDestructTimers.set(msgId, timer);
          }
        }

        // View-once or immediate message destruction signal
        if (data.type === 'DESTROY_MESSAGE') {
          const msgId = data.messageId;
          if (msgId && currentRoom) {
            currentRoom.messages = currentRoom.messages.filter((m) => m.id !== msgId);
            const timer = messageDestructTimers.get(msgId);
            if (timer) {
              clearTimeout(timer);
              messageDestructTimers.delete(msgId);
            }
            broadcastToRoom(roomId, {
              type: 'MESSAGE_DESTRUCTED',
              messageId: msgId,
            });
          }
        }
      } catch (err) {
        // Safe JSON parsing fail
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      const currentRoom = rooms.get(roomId);
      if (currentRoom) {
        if (role === 'host') {
          currentRoom.hostConnected = false;
        } else {
          currentRoom.guestConnected = false;
        }
        broadcastToRoom(roomId, {
          type: 'PRESENCE_CHANGE',
          hostConnected: currentRoom.hostConnected,
          guestConnected: currentRoom.guestConnected,
        });
      }
    });
  });

  // API 404 handler for unmatched API routes - ALWAYS return JSON, never HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  // Global error handler for API requests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    if (res.headersSent) {
      return next(err);
    }
    if (req.path.startsWith('/api')) {
      return res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
      });
    }
    next(err);
  });

  // Client SPA serving and Vite middleware setup
  const distPath = path.resolve(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);
  const isDev = process.env.NODE_ENV !== 'production' && !hasDist;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    if (hasDist) {
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
          return next();
        }
        res.sendFile(indexHtmlPath);
      });
    } else {
      app.get('*', (req, res) => {
        res.status(503).send('Application build in progress. Please refresh momentarily.');
      });
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Ephemeral PWA Server running on port ${PORT}`);
  });
}

startServer();
