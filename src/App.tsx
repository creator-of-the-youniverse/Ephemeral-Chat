/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useEphemeralRoom } from './hooks/useEphemeralRoom';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { LobbyView } from './components/LobbyView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { ChatView } from './components/ChatView';
import { EndChatModal } from './components/EndChatModal';
import { DestroyedNotice } from './components/DestroyedNotice';
import { BiometricLockModal } from './components/BiometricLockModal';
import { OfflineIndicator } from './components/PWAInstallButton';

export default function App() {
  const {
    roomId,
    role,
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
  } = useEphemeralRoom();

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isShieldLocked, setIsShieldLocked] = useState(false);

  const isHost = role === 'host';
  const otherName = isHost ? roomData?.guestName || 'Guest' : roomData?.hostName || 'Host';

  // Render Destroyed / Closed screen
  if (bothEndedNotice || (status === 'DESTROYED' && !roomData)) {
    return (
      <main className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center">
        <DestroyedNotice
          onStartNew={resetToLanding}
          message={error || 'The private room has been permanently destroyed.'}
          isExpiredOrNonExistent={!!error}
        />
        <OfflineIndicator />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      {status !== 'IDLE' && (
        <Header
          roomData={roomData}
          connectionState={connectionState}
          role={role}
          onOpenEndModal={() => setIsEndModalOpen(true)}
          onToggleLock={() => setIsShieldLocked(true)}
          onUpdateTimer={(sec) => updateSettings(sec)}
        />
      )}

      {/* Main Flow Views based on Room State Machine */}
      <div className="flex-1 flex flex-col w-full">
        {status === 'IDLE' && !roomId && (
          <LandingView onCreateRoom={createRoom} error={error} />
        )}

        {/* Host Lobby View (Waiting for guest or answering a knock) */}
        {isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED') && roomId && (
          <LobbyView
            roomId={roomId}
            roomData={roomData}
            guestKnocked={guestKnocked}
            onOpenDoor={openDoor}
            onKeepDoorClosed={keepDoorClosed}
          />
        )}

        {/* Guest Waiting Room View (Enter name & knock, or wait for host approval) */}
        {!isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED') && (
          <WaitingRoomView
            roomData={roomData}
            onKnock={knock}
            hasKnocked={status === 'GUEST_KNOCKED'}
            knockDeclined={knockDeclined}
            error={error}
          />
        )}

        {/* Active or Ended Two-Person Chat */}
        {(status === 'ACTIVE' || status === 'ENDED') && roomData && role && (
          <ChatView
            roomData={roomData}
            role={role}
            onSendMessage={sendMessage}
            onSendImage={sendImageMessage}
            onDestroyMessage={destroyMessage}
            onSendTyping={sendTyping}
            peerTyping={peerTyping}
            otherParticipantEndedNotice={otherParticipantEndedNotice}
            onUpdateTimer={updateSettings}
          />
        )}
      </div>

      {/* End Chat Confirmation Modal */}
      <EndChatModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirmEnd={endMySide}
        isHost={isHost}
        otherName={otherName}
      />

      {/* Privacy Screen Shield */}
      <BiometricLockModal
        isLocked={isShieldLocked}
        onUnlock={() => setIsShieldLocked(false)}
      />

      {/* Network Offline Toast */}
      <OfflineIndicator />
    </main>
  );
}
