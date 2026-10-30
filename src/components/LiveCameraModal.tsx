"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Video,
  X,
  RefreshCw,
  Check,
  RotateCcw,
  Upload,
  AlertCircle,
  Play,
  Square,
  Sparkles,
} from "lucide-react";

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto?: (dataUrl: string) => void;
  onCaptureVideo?: (dataUrl: string) => void;
  title?: string;
  defaultMode?: "photo" | "video";
}

export default function LiveCameraModal({
  isOpen,
  onClose,
  onCapturePhoto,
  onCaptureVideo,
  title = "Live Mobile Camera & Video Capture",
  defaultMode = "photo",
}: LiveCameraModalProps) {
  const [activeMode, setActiveMode] = useState<"photo" | "video">(defaultMode);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>("");

  // Captured media preview state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);

  // Video recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const nativePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const nativeVideoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setStreamActive(false);
  }, []);

  // Start live stream
  const startStream = useCallback(async (facing: "environment" | "user") => {
    stopStream();
    setCameraError("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera streaming is not supported on this browser. Please use native camera below.");
      return;
    }

    try {
      // Try back camera first on mobile phones
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: activeMode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
        // Fallback without exact constraints
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: activeMode === "video",
        });
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn("Live camera access failed:", err);
      setCameraError(
        "Camera stream unavailable (permissions or HTTPS required). Use the 1-tap phone camera buttons below."
      );
      setStreamActive(false);
    }
  }, [stopStream, activeMode]);

  // Handle modal open/close & mode switch
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedVideo(null);
      setIsRecording(false);
      setRecordSeconds(0);
      void startStream(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startStream, stopStream]);

  // Toggle front / rear camera
  const handleToggleFacingMode = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    void startStream(next);
  };

  // SNAP PHOTO FROM LIVE STREAM
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCapturedPhoto(dataUrl);
    stopStream();
  };

  // START RECORDING LIVE VIDEO
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    recordedChunksRef.current = [];

    try {
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      let selectedMime = "";
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(mediaStreamRef.current, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime || "video/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setCapturedVideo(reader.result);
          }
        };
        reader.readAsDataURL(blob);
        stopStream();
      };

      recorder.start(500); // 500ms chunk interval
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 45) {
            // Auto-stop at 45 seconds to keep size light for mobile network
            handleStopRecording();
            return 45;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (e: any) {
      console.error("Recording error:", e);
      alert("Video recording could not be started on this device. Use phone native recorder.");
    }
  };

  // STOP RECORDING LIVE VIDEO
  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Retake
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedVideo(null);
    setIsRecording(false);
    setRecordSeconds(0);
    void startStream(facingMode);
  };

  // Confirm photo
  const handleConfirmPhoto = () => {
    if (capturedPhoto && onCapturePhoto) {
      onCapturePhoto(capturedPhoto);
      onClose();
    }
  };

  // Confirm video
  const handleConfirmVideo = () => {
    if (capturedVideo && onCaptureVideo) {
      onCaptureVideo(capturedVideo);
      onClose();
    }
  };

  // Native phone camera handlers
  const handleNativePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && onCapturePhoto) {
        onCapturePhoto(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNativeVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && onCaptureVideo) {
        onCaptureVideo(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150000,
        background: "rgba(10, 15, 30, 0.95)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          maxHeight: "96vh",
          background: "#0f172a",
          borderRadius: "20px",
          border: "1.5px solid #334155",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7)",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "12px 16px",
            background: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#f8fafc" }}>
            {activeMode === "photo" ? (
              <Camera size={18} color="#2dd4bf" />
            ) : (
              <Video size={18} color="#f43f5e" />
            )}
            <span style={{ fontSize: "13px", fontWeight: 800 }}>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {streamActive && !capturedPhoto && !capturedVideo && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                title="Switch Camera (Front/Rear)"
                style={{
                  background: "#334155",
                  border: "none",
                  color: "#cbd5e1",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <RotateCcw size={13} />
                <span>Flip</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#334155",
                border: "none",
                color: "#f8fafc",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs (Photo vs Video) */}
        {!capturedPhoto && !capturedVideo && (
          <div
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              display: "flex",
              gap: "8px",
              borderBottom: "1px solid #334155",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveMode("photo");
                setCapturedPhoto(null);
                setCapturedVideo(null);
                void startStream(facingMode);
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: activeMode === "photo" ? "#0f766e" : "transparent",
                color: activeMode === "photo" ? "#ffffff" : "#94a3b8",
                fontWeight: activeMode === "photo" ? 800 : 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Camera size={14} />
              <span>Live Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode("video");
                setCapturedPhoto(null);
                setCapturedVideo(null);
                void startStream(facingMode);
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: activeMode === "video" ? "#e11d48" : "transparent",
                color: activeMode === "video" ? "#ffffff" : "#94a3b8",
                fontWeight: activeMode === "video" ? 800 : 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Video size={14} />
              <span>Live Video Clip</span>
            </button>
          </div>
        )}

        {/* Viewfinder / Preview Body */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "360px",
            background: "#020617",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {/* Active Live Video Stream */}
          {!capturedPhoto && !capturedVideo && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: streamActive ? "block" : "none",
                }}
              />

              {!streamActive && (
                <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                  <Camera size={38} color="#64748b" style={{ margin: "0 auto 8px" }} />
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>
                    Starting Mobile Camera...
                  </p>
                  {cameraError && (
                    <div
                      style={{
                        marginTop: "10px",
                        background: "#451a03",
                        border: "1px solid #b45309",
                        color: "#fde68a",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "11.5px",
                        maxWidth: "340px",
                      }}
                    >
                      {cameraError}
                    </div>
                  )}
                </div>
              )}

              {/* Recording indicator badge */}
              {isRecording && (
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    background: "rgba(225, 29, 72, 0.9)",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "11px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <span>
                    REC 00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:45
                  </span>
                </div>
              )}
            </>
          )}

          {/* Captured Photo Preview */}
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}

          {/* Captured Video Preview */}
          {capturedVideo && (
            <video
              src={capturedVideo}
              controls
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          )}
        </div>

        {/* Action Controls Footer */}
        <div
          style={{
            padding: "16px",
            background: "#1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* STATE 1: Live Viewfinder Controls */}
          {!capturedPhoto && !capturedVideo && (
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              {/* Native Mobile Camera (Quick 1-Tap Fallback) */}
              <button
                type="button"
                onClick={() => {
                  if (activeMode === "photo") {
                    nativePhotoInputRef.current?.click();
                  } else {
                    nativeVideoInputRef.current?.click();
                  }
                }}
                title="Open Phone Native Camera"
                style={{
                  background: "#334155",
                  color: "#cbd5e1",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={14} color="#facc15" />
                <span>Phone App</span>
              </button>

              {/* Shutter / Record Trigger */}
              {activeMode === "photo" ? (
                <button
                  type="button"
                  onClick={handleSnapPhoto}
                  disabled={!streamActive}
                  style={{
                    width: "66px",
                    height: "66px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "4px solid #0f766e",
                    boxShadow: "0 0 20px rgba(45, 212, 191, 0.5)",
                    cursor: streamActive ? "pointer" : "not-allowed",
                    display: "grid",
                    placeItems: "center",
                    transition: "transform 0.1s ease",
                  }}
                  title="Snap Live Photo"
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      background: "#0f766e",
                    }}
                  />
                </button>
              ) : !isRecording ? (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={!streamActive}
                  style={{
                    width: "66px",
                    height: "66px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "4px solid #e11d48",
                    boxShadow: "0 0 20px rgba(225, 29, 72, 0.5)",
                    cursor: streamActive ? "pointer" : "not-allowed",
                    display: "grid",
                    placeItems: "center",
                  }}
                  title="Start Live Recording"
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "#e11d48",
                    }}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  style={{
                    width: "66px",
                    height: "66px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "4px solid #e11d48",
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    animation: "pulse 1s infinite",
                  }}
                  title="Stop Recording"
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      background: "#e11d48",
                    }}
                  />
                </button>
              )}

              {/* Gallery / Storage File Browse */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                title="Select from Phone Gallery"
                style={{
                  background: "#334155",
                  color: "#cbd5e1",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Upload size={14} />
                <span>Gallery</span>
              </button>
            </div>
          )}

          {/* STATE 2: Captured Review Controls */}
          {(capturedPhoto || capturedVideo) && (
            <div style={{ width: "100%", display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleRetake}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  background: "#334155",
                  color: "#f8fafc",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <RotateCcw size={15} />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={capturedPhoto ? handleConfirmPhoto : handleConfirmVideo}
                style={{
                  flex: 1.4,
                  padding: "12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#059669",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.4)",
                }}
              >
                <Check size={16} strokeWidth={3} />
                <span>{capturedPhoto ? "✓ Attach Photo" : "✓ Attach Video"}</span>
              </button>
            </div>
          )}

          {/* Hidden Direct Mobile Inputs for System Camera & Gallery */}
          <input
            ref={nativePhotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleNativePhotoFile}
            style={{ display: "none" }}
          />

          <input
            ref={nativeVideoInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleNativeVideoFile}
            style={{ display: "none" }}
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept={activeMode === "photo" ? "image/*" : "video/*"}
            onChange={activeMode === "photo" ? handleNativePhotoFile : handleNativeVideoFile}
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
