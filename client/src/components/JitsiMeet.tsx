import { useEffect, useRef } from "react";

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeet({
  roomName,
  displayName,
  onClose,
}: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Load Jitsi script if not already loaded
    const loadJitsi = () => {
      return new Promise<void>(resolve => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const existingScript = document.querySelector(
          `script[src="https://meet.jit.si/external_api.js"]`
        ) as HTMLScriptElement | null;
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve());
          return;
        }
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    loadJitsi().then(() => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;

      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomName.replace(/\s+/g, "-").toLowerCase(),
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone",
            "camera",
            "closedcaptions",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup",
            "chat",
            "recording",
            "raisehand",
            "videoquality",
            "filmstrip",
            "tileview",
            "download",
            "help",
          ],
        },
      });

      apiRef.current.addEventListener("readyToClose", () => {
        onClose();
      });

      apiRef.current.addEventListener("videoConferenceLeft", () => {
        onClose();
      });
    });

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
        <span className="font-semibold text-sm">📹 {roomName}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition-colors"
        >
          Leave & Close
        </button>
      </div>
      {/* Jitsi container */}
      <div ref={containerRef} className="flex-1 w-full" />
    </div>
  );
}
