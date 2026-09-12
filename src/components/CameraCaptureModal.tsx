import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, Shield, EyeOff, Timer, AlertCircle, Upload } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureAndSend: (
    imageDataUrl: string,
    options: { autoDestructSeconds: number; viewOnce: boolean; caption?: string }
  ) => Promise<void>;
  defaultDestructSeconds: number;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCaptureAndSend,
  defaultDestructSeconds,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Ephemeral delivery options
  const [viewOnce, setViewOnce] = useState(false);
  const [autoDestructSeconds, setAutoDestructSeconds] = useState(defaultDestructSeconds || 30);
  const [caption, setCaption] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = (activeStream?: MediaStream | null) => {
    const s = activeStream || stream;
    if (s) {
      s.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
    setStream(null);
  };

  // Start camera
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsInitializing(true);
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. You can allow camera access in browser settings or use the file picker.'
          : err.message || 'Unable to access device camera.';
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    } else if (!isOpen) {
      stopCameraStream();
      setCapturedImage(null);
      setCaption('');
      setCameraError(null);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  // Flip between front and rear camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture current frame from <video> into canvas
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    // Max dimension 1024 for fast encryption and crisp ephemeral viewing
    const maxDim = 1024;
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > height && width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else if (height > maxDim) {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontal if front-facing user camera for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

    stopCameraStream();
    setCapturedImage(dataUrl);
  };

  // Fallback for native camera file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          stopCameraStream();
          setCapturedImage(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleSend = async () => {
    if (!capturedImage || isSending) return;
    setIsSending(true);
    try {
      await onCaptureAndSend(capturedImage, {
        autoDestructSeconds: viewOnce ? 10 : autoDestructSeconds,
        viewOnce,
        caption: caption.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                {capturedImage ? 'Review Temporary Photo' : 'Private Camera'}
              </h3>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>AES-GCM End-to-End Encrypted</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close camera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[360px] overflow-hidden">
          {capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={capturedImage}
                alt="Captured temporary"
                className="max-h-[60dvh] w-auto max-w-full object-contain rounded-2xl select-none pointer-events-none"
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/60 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 shadow">
                <Shield className="w-3 h-3" />
                <span>Encrypted In-Memory</span>
              </div>
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center max-w-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-zinc-200 font-medium">Camera Notice</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{cameraError}</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-700"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Take Photo / Upload with Device</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover max-h-[60dvh]"
              />

              {/* Viewfinder Target Framing */}
              <div className="absolute inset-8 pointer-events-none border-2 border-white/20 rounded-3xl flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-zinc-400">
                  Starting camera...
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Controls Bar */}
        <div className="p-3 sm:p-4 bg-zinc-900 border-t border-zinc-800/80 space-y-3">
          {capturedImage ? (
            <div className="space-y-3">
              {/* Ephemeral settings for this photo */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                {/* View-once switch */}
                <button
                  type="button"
                  onClick={() => setViewOnce(!viewOnce)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                    viewOnce
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{viewOnce ? 'View Once: Active' : 'View Once'}</span>
                </button>

                {/* Auto-destruct timer selector */}
                {!viewOnce && (
                  <div className="flex items-center gap-1 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-1 text-xs text-zinc-400">
                    <Timer className="w-3 h-3 ml-1.5 text-zinc-500" />
                    {[15, 30, 60, 300].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setAutoDestructSeconds(sec)}
                        className={`px-2 py-0.5 rounded-lg font-mono text-[11px] transition cursor-pointer ${
                          autoDestructSeconds === sec
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'hover:text-zinc-200 text-zinc-400'
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional ephemeral caption */}
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={100}
                placeholder="Add an optional ephemeral caption..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition"
              />

              {/* Action Buttons: Retake vs Send */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  {isSending ? (
                    <span>Encrypting & Sending...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Send Encrypted Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              {/* Native file upload fallback icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 rounded-2xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition border border-zinc-700/60 cursor-pointer"
                title="Select from gallery or device"
              >
                <Upload className="w-4 h-4" />
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={handleSnap}
                disabled={isInitializing || !!cameraError}
                className="w-16 h-16 rounded-full border-4 border-emerald-400/30 p-1 flex items-center justify-center group active:scale-95 transition cursor-pointer disabled:opacity-30"
                title="Take Photo"
              >
                <div className="w-full h-full rounded-full bg-emerald-500 group-hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-zinc-950" />
                </div>
              </button>

              {/* Flip camera front/back */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                disabled={isInitializing || !!cameraError}
                className="w-11 h-11 rounded-2xl bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition border border-zinc-700/60 cursor-pointer disabled:opacity-30"
                title="Flip Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
