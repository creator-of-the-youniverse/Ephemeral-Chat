import { useState, useEffect, useRef, useCallback } from 'react';
import { Message, RoomData, RoomStatus, ConnectionState, StoredSession } from '../types';
import { getDerivedRoomKey, encryptText, decryptText } from '../lib/crypto';

async function decryptSingleMessage(msg: Message, key: CryptoKey | null): Promise<Message> {
  if (!key) return msg;
  try {
    let decryptedImageData = msg.imageData;
    let decryptedText = msg.text;

    if (msg.messageType === 'image' && msg.imageData && msg.isEncrypted !== false) {
      decryptedImageData = await decryptText(msg.imageData, key);
    }

    if (msg.text && msg.isEncrypted) {
      decryptedText = await decryptText(msg.text, key);
    }

    return {
      ...msg,
      imageData: decryptedImageData,
      text: decryptedText,
    };
  } catch {
    return msg;
  }
}

/**
 * Safely parse API responses, preventing "Unexpected token 'T'... is not valid JSON"
 * if the server returns HTML (e.g. 404, 502, proxy warmup, etc.)
 */
async function parseJsonResponse<T = any>(res: Response, fallbackErrMsg = 'Server error'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }
    const rawText = !data ? (await res.text().catch(() => '')).trim() : '';
    if (rawText.startsWith('<') || rawText.toLowerCase().includes('the page')) {
      throw new Error(`Unable to reach chat server (${res.status}). Please check your connection or reload.`);
    }
    throw new Error(rawText.slice(0, 100) || `${fallbackErrMsg} (HTTP ${res.status})`);
  }

  if (data === null) {
    try {
      const rawText = (await res.text()).trim();
      if (rawText.startsWith('<') || rawText.toLowerCase().includes('the page')) {
        throw new Error(`Unexpected response from server (HTTP ${res.status}).`);
      }
      throw new Error(`Invalid server response: ${rawText.slice(0, 60)}`);
    } catch (err: any) {
      throw new Error(err.message || 'Invalid server response.');
    }
  }

  return data as T;
}

export function useEphemeralRoom() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [status, setStatus] = useState<RoomStatus | 'IDLE'>('IDLE');
  const [guestKnocked, setGuestKnocked] = useState<{ guestName: string } | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [knockDeclined, setKnockDeclined] = useState<boolean>(false);
  const [peerTyping, setPeerTyping] = useState<boolean>(false);
  const [bothEndedNotice, setBothEndedNotice] = useState<boolean>(false);
  const [otherParticipantEndedNotice, setOtherParticipantEndedNotice] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isExplicitlyLeavingRef = useRef<boolean>(false);
  const roomKeyRef = useRef<CryptoKey | null>(null);

  useEffect(() => {
    if (roomId) {
      getDerivedRoomKey(roomId).then((key) => {
        roomKeyRef.current = key;
      });
    } else {
      roomKeyRef.current = null;
    }
  }, [roomId]);

  // Extract roomId from URL path (e.g. /chat/:roomId or ?room=:roomId)
  const extractRoomIdFromUrl = useCallback(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/chat\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const params = new URLSearchParams(window.location.search);
    const paramRoom = params.get('room');
    if (paramRoom) {
      return paramRoom;
    }
    return null;
  }, []);

  // Save session to sessionStorage
  const saveSession = useCallback((sess: StoredSession) => {
    try {
      sessionStorage.setItem(`ephemeral_room_${sess.roomId}`, JSON.stringify(sess));
    } catch {
      // ignore
    }
  }, []);

  // Load session from sessionStorage
  const loadSession = useCallback((rId: string): StoredSession | null => {
    try {
      const raw = sessionStorage.getItem(`ephemeral_room_${rId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Clear session
  const clearSession = useCallback((rId?: string) => {
    try {
      if (rId) {
        sessionStorage.removeItem(`ephemeral_room_${rId}`);
      } else if (roomId) {
        sessionStorage.removeItem(`ephemeral_room_${roomId}`);
      }
    } catch {
      // ignore
    }
  }, [roomId]);

  // Connect WebSocket
  const connectWebSocket = useCallback((targetRoomId: string, targetToken: string, targetRole: 'host' | 'guest') => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionState('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?roomId=${encodeURIComponent(targetRoomId)}&token=${encodeURIComponent(targetToken)}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      setConnectionState('connected');
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'INIT':
            if (data.room) {
              (async () => {
                const activeKey = roomKeyRef.current || (await getDerivedRoomKey(targetRoomId));
                roomKeyRef.current = activeKey;
                const decryptedMessages = await Promise.all(
                  data.room.messages.map((m: Message) => decryptSingleMessage(m, activeKey))
                );
                setRoomData({ ...data.room, messages: decryptedMessages });
                setStatus(data.room.status);
                if (data.room.status === 'GUEST_KNOCKED' && targetRole === 'host' && data.room.guestName) {
                  setGuestKnocked({ guestName: data.room.guestName });
                }
              })();
            }
            break;

          case 'GUEST_KNOCKED':
            if (targetRole === 'host') {
              setGuestKnocked({ guestName: data.guestName });
              setStatus('GUEST_KNOCKED');
              setRoomData((prev) => (prev ? { ...prev, guestName: data.guestName, status: 'GUEST_KNOCKED' } : null));
            }
            break;

          case 'DOOR_OPENED':
            setStatus('ACTIVE');
            setGuestKnocked(null);
            setKnockDeclined(false);
            if (data.room) {
              setRoomData(data.room);
            } else {
              setRoomData((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
            }
            break;

          case 'KNOCK_DECLINED':
            if (targetRole === 'guest') {
              setKnockDeclined(true);
              setStatus('WAITING_FOR_GUEST');
            }
            break;

          case 'NEW_MESSAGE':
            (async () => {
              const activeKey = roomKeyRef.current || (await getDerivedRoomKey(targetRoomId));
              roomKeyRef.current = activeKey;
              const decrypted = await decryptSingleMessage(data.message, activeKey);

              setRoomData((prev) => {
                if (!prev) return null;
                // Guard against duplicate message id
                if (prev.messages.some((m) => m.id === decrypted.id)) {
                  return prev;
                }
                // If user has ended their side, hide incoming messages from other participant
                const myEnded = targetRole === 'host' ? prev.hostEnded : prev.guestEnded;
                if (myEnded && decrypted.sender !== targetRole) {
                  return prev;
                }
                return {
                  ...prev,
                  messages: [...prev.messages, decrypted],
                };
              });
            })();
            break;

          case 'MESSAGE_DESTRUCTED':
            setRoomData((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                messages: prev.messages.filter((m) => m.id !== data.messageId),
              };
            });
            break;

          case 'PRESENCE_CHANGE':
            setRoomData((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                hostConnected: data.hostConnected,
                guestConnected: data.guestConnected,
              };
            });
            break;

          case 'PARTICIPANT_ENDED':
            if (data.room) {
              setRoomData(data.room);
              setStatus(data.room.status);
            } else {
              setRoomData((prev) => {
                if (!prev) return null;
                const isHostEnded = data.endedBy === 'host' ? true : prev.hostEnded;
                const isGuestEnded = data.endedBy === 'guest' ? true : prev.guestEnded;
                return {
                  ...prev,
                  hostEnded: isHostEnded,
                  guestEnded: isGuestEnded,
                  status: 'ENDED',
                };
              });
            }
            if (data.endedBy !== targetRole) {
              setOtherParticipantEndedNotice(`${data.endedByName || 'The other participant'} has ended their side of the conversation.`);
            }
            break;

          case 'ROOM_DESTROYED':
            isExplicitlyLeavingRef.current = true;
            clearSession(targetRoomId);
            setBothEndedNotice(true);
            setStatus('DESTROYED');
            setRoomData(null);
            if (wsRef.current) {
              wsRef.current.close();
            }
            break;

          case 'SETTINGS_CHANGED':
            setRoomData((prev) => (prev ? { ...prev, autoDestructSeconds: data.autoDestructSeconds } : null));
            break;

          case 'USER_TYPING':
            if (data.sender !== targetRole) {
              setPeerTyping(data.isTyping);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
              if (data.isTyping) {
                typingTimerRef.current = setTimeout(() => {
                  setPeerTyping(false);
                }, 3000);
              }
            }
            break;

          case 'ROOM_UPDATE':
            if (data.room) {
              setRoomData(data.room);
              setStatus(data.room.status);
            }
            break;
        }
      } catch (err) {
        // parsing error
      }
    };

    socket.onclose = (e) => {
      setConnectionState('disconnected');
      wsRef.current = null;

      // Auto-reconnect if not intentionally destroyed or ended
      if (!isExplicitlyLeavingRef.current && e.code !== 1000 && e.code !== 4004 && e.code !== 4001) {
        setConnectionState('reconnecting');
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket(targetRoomId, targetToken, targetRole);
        }, 2500);
      }
    };

    socket.onerror = () => {
      setConnectionState('disconnected');
    };
  }, [clearSession]);

  // Initial check on mount: check URL for existing room
  useEffect(() => {
    const urlRoomId = extractRoomIdFromUrl();
    if (!urlRoomId) {
      return;
    }

    setRoomId(urlRoomId);

    // Check if session exists in sessionStorage (e.g. reload or existing participant)
    const existingSession = loadSession(urlRoomId);

    if (existingSession && existingSession.token) {
      setToken(existingSession.token);
      setRole(existingSession.role);

      // Verify token with server
      fetch(`/api/rooms/${urlRoomId}`, {
        headers: { Authorization: `Bearer ${existingSession.token}` },
      })
        .then((res) => parseJsonResponse(res, 'Session verification failed'))
        .then(async (data) => {
          if (data.exists && data.room) {
            const key = await getDerivedRoomKey(urlRoomId);
            roomKeyRef.current = key;
            const decryptedMessages = await Promise.all(
              data.room.messages.map((m: Message) => decryptSingleMessage(m, key))
            );
            setRoomData({ ...data.room, messages: decryptedMessages });
            setStatus(data.room.status);
            connectWebSocket(urlRoomId, existingSession.token, existingSession.role);
          } else {
            // Room expired or deleted
            clearSession(urlRoomId);
            setError(data.error || 'This private room no longer exists.');
            setStatus('DESTROYED');
          }
        })
        .catch(() => {
          connectWebSocket(urlRoomId, existingSession.token, existingSession.role);
        });
    } else {
      // Arrived via invitation link as guest
      fetch(`/api/rooms/${urlRoomId}`)
        .then((res) => parseJsonResponse(res, 'Room query failed'))
        .then((data) => {
          if (!data.exists) {
            setError('This private room no longer exists.');
            setStatus('DESTROYED');
          } else if (data.status === 'ENDED' || (data.hostEnded && data.guestEnded)) {
            setError('This private room has been closed.');
            setStatus('DESTROYED');
          } else {
            setRole('guest');
            setStatus('WAITING_FOR_GUEST');
            setRoomData({
              id: urlRoomId,
              role: 'guest',
              hostName: data.hostName || 'Host',
              status: data.status,
              createdAt: Date.now(),
              hostConnected: false,
              guestConnected: false,
              hostEnded: false,
              guestEnded: false,
              messages: [],
              autoDestructSeconds: 0,
            });
          }
        })
        .catch((err) => {
          setError(err.message || 'Unable to reach the private room server.');
        });
    }

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [extractRoomIdFromUrl, loadSession, clearSession, connectWebSocket]);

  // Action: Create Room (Host)
  const createRoom = async (hostName: string) => {
    setError(null);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName }),
      });

      const data = await parseJsonResponse(res, 'Failed to create private room');
      const newRoomId = data.roomId;
      const newHostToken = data.hostToken;

      setRoomId(newRoomId);
      setToken(newHostToken);
      setRole('host');
      setRoomData(data.room);
      setStatus('WAITING_FOR_GUEST');

      // Update URL silently
      window.history.pushState({}, '', `/chat/${newRoomId}`);

      saveSession({
        roomId: newRoomId,
        token: newHostToken,
        role: 'host',
        userName: hostName,
      });

      connectWebSocket(newRoomId, newHostToken, 'host');
      return newRoomId;
    } catch (err: any) {
      setError(err.message || 'Error creating private room.');
      throw err;
    }
  };

  // Action: Guest knocks on door
  const knock = async (guestName: string) => {
    if (!roomId) return;
    setError(null);
    setKnockDeclined(false);

    try {
      const res = await fetch(`/api/rooms/${roomId}/knock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName }),
      });

      const data = await parseJsonResponse(res, 'Failed to knock on the door');
      const newGuestToken = data.guestToken;

      setToken(newGuestToken);
      setRole('guest');
      setStatus('GUEST_KNOCKED');

      setRoomData((prev) => (prev ? { ...prev, guestName, status: 'GUEST_KNOCKED' } : null));

      saveSession({
        roomId,
        token: newGuestToken,
        role: 'guest',
        userName: guestName,
      });

      connectWebSocket(roomId, newGuestToken, 'guest');
    } catch (err: any) {
      setError(err.message || 'Error knocking.');
      throw err;
    }
  };

  // Action: Host opens the door
  const openDoor = async () => {
    if (!roomId || !token) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/open-door`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      await parseJsonResponse(res, 'Failed to open door');

      setStatus('ACTIVE');
      setGuestKnocked(null);
      setRoomData((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null));
    } catch (err: any) {
      setError(err.message || 'Error opening door.');
    }
  };

  // Action: Host keeps door closed
  const keepDoorClosed = async () => {
    if (!roomId || !token) return;
    try {
      await fetch(`/api/rooms/${roomId}/keep-door-closed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      setGuestKnocked(null);
      setStatus('WAITING_FOR_GUEST');
      setRoomData((prev) => (prev ? { ...prev, status: 'WAITING_FOR_GUEST', guestName: undefined } : null));
    } catch (err: any) {
      // ignore
    }
  };

  // Action: Send Message
  const sendMessage = async (text: string, autoDestructSeconds?: number) => {
    if (!roomId || !token || !text.trim()) return;

    const activeKey = roomKeyRef.current || (await getDerivedRoomKey(roomId));
    roomKeyRef.current = activeKey;

    let cipherText = text.trim();
    let isEncrypted = false;
    try {
      cipherText = await encryptText(text.trim(), activeKey);
      isEncrypted = true;
    } catch {
      cipherText = text.trim();
    }

    const payload = {
      type: 'SEND_MESSAGE',
      messageType: 'text',
      text: cipherText,
      isEncrypted,
      autoDestructSeconds: autoDestructSeconds || roomData?.autoDestructSeconds || 0,
    };

    // Send through WebSocket if open, fallback to HTTP POST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse(res, 'Failed to send message');
      } catch (err: any) {
        setError(err.message || 'Failed to send message.');
      }
    }
  };

  // Action: Send Encrypted Temporary Image from Camera
  const sendImageMessage = async (
    imageDataUrl: string,
    options: { autoDestructSeconds?: number; viewOnce?: boolean; caption?: string } = {}
  ) => {
    if (!roomId || !token || !imageDataUrl) return;

    const activeKey = roomKeyRef.current || (await getDerivedRoomKey(roomId));
    roomKeyRef.current = activeKey;

    let cipherImageData = imageDataUrl;
    let cipherCaption = options.caption || '';
    let isEncrypted = false;

    try {
      cipherImageData = await encryptText(imageDataUrl, activeKey);
      if (cipherCaption) {
        cipherCaption = await encryptText(cipherCaption, activeKey);
      }
      isEncrypted = true;
    } catch {
      cipherImageData = imageDataUrl;
    }

    const payload = {
      type: 'SEND_MESSAGE',
      messageType: 'image',
      imageData: cipherImageData,
      text: cipherCaption,
      isEncrypted,
      viewOnce: !!options.viewOnce,
      autoDestructSeconds: options.autoDestructSeconds || roomData?.autoDestructSeconds || 0,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse(res, 'Failed to send image');
      } catch (err: any) {
        setError(err.message || 'Failed to send image.');
      }
    }
  };

  // Action: Destroy / Delete message immediately (e.g. view-once dissolution)
  const destroyMessage = (messageId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'DESTROY_MESSAGE', messageId }));
    } else if (roomId && token) {
      fetch(`/api/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    setRoomData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.filter((m) => m.id !== messageId),
      };
    });
  };

  // Action: End my side (Two-sided termination model)
  const endMySide = async () => {
    if (!roomId || !token) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonResponse(res, 'Failed to end chat');

      if (data.destroyed) {
        // Both participants have ended -> Permanent destruction
        isExplicitlyLeavingRef.current = true;
        clearSession(roomId);
        setBothEndedNotice(true);
        setStatus('DESTROYED');
        setRoomData(null);
        if (wsRef.current) wsRef.current.close();
      } else {
        // One side ended:
        // Hide other person's messages from local view immediately!
        setRoomData((prev) => {
          if (!prev) return null;
          const isHost = role === 'host';
          const updatedHostEnded = isHost ? true : prev.hostEnded;
          const updatedGuestEnded = !isHost ? true : prev.guestEnded;

          // Keep only my own messages
          const myMessagesOnly = prev.messages.filter((m) => m.sender === role);

          return {
            ...prev,
            hostEnded: updatedHostEnded,
            guestEnded: updatedGuestEnded,
            status: 'ENDED',
            messages: myMessagesOnly,
          };
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error ending conversation.');
    }
  };

  // Action: Update Settings
  const updateSettings = async (autoDestructSeconds: number) => {
    if (!roomId || !token) return;
    try {
      await fetch(`/api/rooms/${roomId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ autoDestructSeconds }),
      });
      setRoomData((prev) => (prev ? { ...prev, autoDestructSeconds } : null));
    } catch {
      // ignore
    }
  };

  // Action: Send Typing
  const sendTyping = (isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TYPING', isTyping }));
    }
  };

  // Reset to landing page
  const resetToLanding = () => {
    isExplicitlyLeavingRef.current = true;
    if (roomId) clearSession(roomId);
    if (wsRef.current) wsRef.current.close();
    setRoomId(null);
    setToken(null);
    setRole(null);
    setRoomData(null);
    setStatus('IDLE');
    setGuestKnocked(null);
    setError(null);
    setKnockDeclined(false);
    setBothEndedNotice(false);
    setOtherParticipantEndedNotice(null);
    window.history.pushState({}, '', '/');
  };

  return {
    roomId,
    role,
    token,
    roomData,
    status,
    guestKnocked,
    connectionState,
    error,
    knockDeclined,
    peerTyping,
    bothEndedNotice,
    otherParticipantEndedNotice,
    createRoom,
    knock,
    openDoor,
    keepDoorClosed,
    sendMessage,
    sendImageMessage,
    destroyMessage,
    endMySide,
    updateSettings,
    sendTyping,
    resetToLanding,
  };
}
