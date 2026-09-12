import React, { useState, useEffect, useRef } from 'react';
import { Send, Timer, Shield, Info, AlertTriangle, Clock, Camera, EyeOff, Lock } from 'lucide-react';
import { RoomData, Message } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { EphemeralImageModal } from './EphemeralImageModal';

interface ChatViewProps {
  roomData: RoomData;
  role: 'host' | 'guest';
  onSendMessage: (text: string, autoDestructSeconds?: number) => Promise<void>;
  onSendImage: (
    imageDataUrl: string,
    options: { autoDestructSeconds: number; viewOnce: boolean; caption?: string }
  ) => Promise<void>;
  onDestroyMessage: (messageId: string) => void;
  onSendTyping: (isTyping: boolean) => void;
  peerTyping: boolean;
  otherParticipantEndedNotice: string | null;
  onUpdateTimer: (seconds: number) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  roomData,
  role,
  onSendMessage,
  onSendImage,
  onDestroyMessage,
  onSendTyping,
  peerTyping,
  otherParticipantEndedNotice,
  onUpdateTimer,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedTimer, setSelectedTimer] = useState<number>(roomData.autoDestructSeconds || 0);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const isHost = role === 'host';
  const myEnded = isHost ? roomData.hostEnded : roomData.guestEnded;
  const otherEnded = isHost ? roomData.guestEnded : roomData.hostEnded;
  const otherName = isHost ? roomData.guestName || 'Guest' : roomData.hostName;

  // Periodic tick for self-destruct timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomData.messages, peerTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || myEnded) return;

    const text = inputText;
    setInputText('');
    onSendTyping(false);

    await onSendMessage(text, selectedTimer);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onSendTyping(e.target.value.length > 0);

    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const timerOptions = [
    { label: 'Off', value: 0 },
    { label: '15s', value: 15 },
    { label: '30s', value: 30 },
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
  ];

  return (
    <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto h-[calc(100dvh-60px)] min-h-0 bg-zinc-950">
      {/* Informational Sub-Header Bar */}
      <div className="px-3 sm:px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Shield className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="truncate">
            Zero logs • Direct ephemeral room
          </span>
        </div>

        {/* Auto-Destruct Timer Toggle */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowTimerMenu(!showTimerMenu)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer border ${
              selectedTimer > 0
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-zinc-200'
            }`}
            title="Auto-Destruct Timer"
          >
            <Timer className="w-3 h-3" />
            <span>Destruct: {selectedTimer > 0 ? `${selectedTimer}s` : 'Off'}</span>
          </button>

          {showTimerMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl z-20 py-1 text-xs">
              <span className="px-3 py-1 text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                Message Expiry
              </span>
              {timerOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedTimer(opt.value);
                    onUpdateTimer(opt.value);
                    setShowTimerMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-800 text-xs transition flex items-center justify-between ${
                    selectedTimer === opt.value ? 'text-emerald-400 font-semibold' : 'text-zinc-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedTimer === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notices regarding ended sides */}
      {otherEnded && (
        <div className="mx-3 sm:mx-4 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            {otherName} has ended their side of the conversation. You can still see your side until you also end.
          </span>
        </div>
      )}

      {myEnded && (
        <div className="mx-3 sm:mx-4 mt-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0 text-zinc-400" />
          <span>
            You've closed your side of this conversation. When {otherName} ends their side, all messages will be permanently destroyed.
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {roomData.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2 select-none">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
              <Shield className="w-5 h-5" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">Room open</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Messages and camera photos exist only in this session and vanish upon completion.
            </p>
          </div>
        ) : (
          roomData.messages.map((msg) => {
            const isMe = msg.sender === role;
            const remainingSeconds = msg.expiresAt
              ? Math.max(0, Math.ceil((msg.expiresAt - now) / 1000))
              : null;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
              >
                {/* Sender Name & Timestamp */}
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-zinc-500">
                  <span className={`font-medium ${isMe ? 'text-emerald-400/90' : 'text-zinc-400'}`}>
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {remainingSeconds !== null && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-mono text-[10px] ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <Clock className="w-2.5 h-2.5" />
                      {remainingSeconds}s
                    </span>
                  )}
                </div>

                {/* Message Bubble: Image vs Text */}
                {msg.messageType === 'image' && msg.imageData ? (
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-2 rounded-2xl shadow-md space-y-1.5 ${
                      isMe
                        ? 'bg-emerald-950/80 border border-emerald-500/40 rounded-tr-xs'
                        : 'bg-zinc-900 border border-zinc-700/70 rounded-tl-xs'
                    }`}
                  >
                    <div
                      onClick={() => setActiveImageModal(msg)}
                      className="relative rounded-xl overflow-hidden cursor-pointer group bg-black/60 max-w-sm"
                    >
                      <img
                        src={msg.imageData}
                        alt="Encrypted temporary capture"
                        className={`w-full max-h-64 sm:max-h-80 object-cover rounded-xl transition duration-200 group-hover:scale-[1.01] ${
                          msg.viewOnce && !isMe ? 'filter blur-sm hover:blur-none transition' : ''
                        }`}
                        onContextMenu={(e) => e.preventDefault()}
                      />

                      {/* Header overlay badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/75 backdrop-blur-md text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                          <Lock className="w-2.5 h-2.5" />
                          <span>AES-256</span>
                        </span>
                        {msg.viewOnce && (
                          <span className="bg-amber-500/90 text-zinc-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>View Once</span>
                          </span>
                        )}
                      </div>

                      {/* Hover action hint */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition flex items-center justify-center pointer-events-none">
                        <span className="bg-zinc-900/80 backdrop-blur-md border border-zinc-700 text-zinc-200 text-[11px] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow">
                          Tap to view full photo
                        </span>
                      </div>
                    </div>

                    {msg.text && (
                      <p className="text-xs px-1 text-zinc-200 break-words leading-relaxed">
                        {msg.text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-zinc-800 text-zinc-100 rounded-tl-xs border border-zinc-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Peer Typing Indicator */}
        {peerTyping && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-2 animate-pulse">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{otherName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Keyboard-Aware Chat Composer */}
      <div className="p-2 sm:p-3 border-t border-zinc-800/80 bg-zinc-950 safe-bottom">
        {myEnded ? (
          <div className="text-center py-2 text-xs text-zinc-500">
            You ended your side. You cannot send new messages.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            {/* Camera Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              disabled={myEnded}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 transition flex-shrink-0 active:scale-95 cursor-pointer disabled:opacity-40"
              title="Capture & send private ephemeral photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            <div className="flex-1 relative rounded-2xl bg-zinc-900 border border-zinc-800 focus-within:border-emerald-500/80 transition shadow-inner">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a private message..."
                className="w-full pl-3.5 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 bg-transparent resize-none focus:outline-none max-h-32"
              />

              {selectedTimer > 0 && (
                <div className="absolute right-2.5 bottom-2.5 text-amber-400 text-[10px] font-mono flex items-center gap-0.5 bg-amber-500/10 px-1 rounded">
                  <Timer className="w-2.5 h-2.5" />
                  {selectedTimer}s
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || myEnded}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold transition flex-shrink-0 active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureAndSend={onSendImage}
        defaultDestructSeconds={selectedTimer > 0 ? selectedTimer : 30}
      />

      {/* Ephemeral Lightbox */}
      <EphemeralImageModal
        message={activeImageModal}
        onClose={() => setActiveImageModal(null)}
        onDestroyMessage={onDestroyMessage}
        role={role}
      />
    </div>
  );
};
