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

export interface RoomData {
  id: string;
  role: 'host' | 'guest';
  hostName: string;
  guestName?: string;
  status: RoomStatus;
  createdAt: number;
  hostConnected: boolean;
  guestConnected: boolean;
  hostEnded: boolean;
  guestEnded: boolean;
  messages: Message[];
  autoDestructSeconds: number;
}

export interface KnockInfo {
  guestName: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface StoredSession {
  roomId: string;
  token: string;
  role: 'host' | 'guest';
  userName: string;
}
