import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { sendMessage } from "@/lib/room";
import { LIVEKIT_URL } from "@/lib/constant";
import {
  RoomAudioRenderer,
  RoomContext,
} from "@livekit/components-react";
import '@livekit/components-styles';
import MyVideoConference from "@/components/video-conference";
import { useToken, useRecord, useStopRecording } from "@/hooks/live-kit";
import { authClient } from "@/lib/auth-client";
import {
  PhoneOff,
  Disc,
  PenTool,
  ChevronLeft,
  Loader2,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  from: string;
  text: string;
  timestamp?: Date;
}

export const Route = createFileRoute("/meeting/$uuid")({
  component: MeetingPageComponent,
});

function MeetingPageComponent() {
  const { uuid } = useParams({ from: "/meeting/$uuid" });
  const navigate = useNavigate();
  const [message, setMessage] = useState<string>("");
  const [status, setStatus] = useState<string>("Idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>("")
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [recording, setRecording] = useState(false);
  const [egressId, setEgressId] = useState<string | null>(null);
  const [showRecordingPrompt, setShowRecordingPrompt] = useState(false);
  const { data: session } = authClient.useSession()

  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

  useEffect(() => {
    if (session?.user.name) {
      setUsername(session.user.name)
      console.log("username", session.user.name)
    }
  }, [session?.user.name]);

  const { data: token, isLoading: isTokenLoading, error: tokenError } = useToken(
    uuid,
    username,
    !!username
  );

  // Use the useRecord hook for recording
  const startRecordingMutation = useRecord();
  const {
    mutate: startRecording,
    isPending: isRecordingLoading,

  } = startRecordingMutation;

  // Use the useStopRecording hook for stopping recording
  const stopRecordingMutation = useStopRecording();
  const {
    mutate: stopRecording,
    isPending: isStopRecordingLoading,
  } = stopRecordingMutation;

  // Helper to validate UUID format
  const isValidUUID = (uuid: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
  };

  // Validate UUID on mount
  useEffect(() => {
    if (!isValidUUID(uuid)) {
      setStatus("Invalid room name format. Please check your link or create a new room.");
      setTimeout(() => {
        navigate({ to: "/meetings" });
      }, 3000);
    }
  }, [uuid, navigate]);

  useEffect(() => {
    if (tokenError) {
      console.error("Token error:", tokenError);
      setStatus("Failed to get token. Please try again.");
    }
  }, [tokenError]);


  async function handleJoinRoom(token: string): Promise<void> {
    if (!username) {
      navigate({ to: "/login" })
      return;
    }
    try {
      setStatus("Connecting to room...");
      if (!LIVEKIT_URL) {
        throw new Error("LiveKit URL is missing");
      }
      console.log("Livekit URL", LIVEKIT_URL)
      await roomInstance.connect(LIVEKIT_URL, token);

      setStatus(`Joined room: ${roomInstance.name}`);

      // Show recording prompt after successfully joining (if user hasn't declined before)
      setTimeout(() => {
        const hasDeclinedRecording = localStorage.getItem(`no-recording-${uuid}`);
        if (!hasDeclinedRecording) {
          setShowRecordingPrompt(true);
        }
      }, 1000);

      roomInstance.on("dataReceived", (payload, participant) => {
        const text = new TextDecoder().decode(payload);
        setMessages((prev) => [
          ...prev,
          { from: participant?.identity ?? "unknown", text },
        ]);
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      setStatus("Failed to join room. Please try again.");
      setTimeout(() => {
        navigate({ to: "/meetings" });
      }, 3000);
    }
  }

  function handleStartRecording() {
    startRecording(
      { roomName: uuid, userName: username },
      {
        onSuccess: (data) => {
          console.log("Recording started successfully:", data);
          setEgressId(data.egressId);
          setRecording(true);
          setShowRecordingPrompt(false);
          setStatus("Recording started successfully!");
        },
        onError: (error) => {
          console.error("Failed to start recording:", error);
          setStatus(`Failed to start recording: ${error.message}`);
          setShowRecordingPrompt(false);
        },
      }
    );
  }

  function handleStopRecording() {
    if (egressId) {
      stopRecording(
        { egressId },
        {
          onSuccess: () => {
            console.log("Recording stopped successfully");
            setRecording(false);
            setEgressId(null);
            setStatus("Recording stopped successfully!");
          },
          onError: (error) => {
            console.error("Failed to stop recording:", error);
            setStatus(`Failed to stop recording: ${error.message}`);
          },
        }
      );
    } else {
      console.warn("No egressId available to stop recording");
      setRecording(false);
      setStatus("No active recording to stop");
    }
  }

  useEffect(() => {
    if (token && roomInstance.state === "disconnected" && username) {
      handleJoinRoom(token);
    }
  }, [token, roomInstance.state, username]);

  useEffect(() => {
    return () => {
      if (roomInstance.state === "connected") {
        roomInstance.disconnect();
      }
    };
  }, [roomInstance]);

  useEffect(() => {
    if (!roomInstance) return;

    const handleDisconnected = () => {
      console.log('LiveKit room disconnected');
      navigate({ to: "/meetings" });
    };

    roomInstance.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      roomInstance.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [roomInstance, navigate]);

  function handleSend(): void {
    if (!roomInstance || roomInstance.state !== "connected") {
      setStatus("Join a room first");
      return;
    }

    const messageText = message || "Hello from client";
    sendMessage(messageText, roomInstance);

    if (message) {
      setMessages((prev) => [...prev, { from: "me", text: message }]);
    }
    setMessage("");
  }

  const toggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard);
  };

  // Recording prompt modal
  if (showRecordingPrompt) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-zinc-900 rounded-none border border-zinc-800 max-w-md w-full p-8 relative">

          <div className="text-center space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-zinc-50 tracking-tight">
                Record Session
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                This meeting will be recorded for later access.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleStartRecording}
                disabled={isRecordingLoading}
                className="w-full h-10 bg-zinc-50 hover:bg-zinc-200 text-zinc-900 rounded-none font-medium transition-all"
              >
                {isRecordingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Recording
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowRecordingPrompt(false)}
                className="w-full h-10 text-zinc-400 hover:text-zinc-50 hover:bg-transparent rounded-none"
              >
                Skip
              </Button>

              <button
                onClick={() => {
                  setShowRecordingPrompt(false);
                  localStorage.setItem(`no-recording-${uuid}`, 'true');
                }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Don't ask again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while connecting
  if (!token || roomInstance.state === "disconnected" || isTokenLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <Loader2 className="w-6 h-6 text-zinc-50 animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">Connecting</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden">
      <RoomContext.Provider value={roomInstance}>

        {/* Top Bar - Minimal */}
        <header className="h-14 px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
              <span className="text-xs font-medium text-zinc-400 tracking-wide uppercase">
                {username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recording && (
              <div className="flex items-center gap-2 px-3 py-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-medium text-red-500 tracking-wider uppercase">REC</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex relative overflow-hidden px-6 pb-24 gap-4">
          {/* Video Conference Area */}
          <div className={`flex-1 h-full transition-all duration-500 rounded-lg overflow-hidden border border-zinc-900 bg-zinc-900/50 ${showWhiteboard ? 'w-1/2' : 'w-full'}`}>
            <MyVideoConference
              handleSend={handleSend}
              message={message}
              setMessage={setMessage}
              messages={messages}
              status={status}
            />
          </div>

          {/* Whiteboard Area */}
          {showWhiteboard && (
            <div className="w-1/2 h-full rounded-lg overflow-hidden border border-zinc-900 bg-zinc-900/50 animate-in slide-in-from-right-10 duration-500">
              <div className="flex items-center justify-center h-full text-zinc-600">
                <div className="text-center space-y-4">
                  <PenTool className="w-8 h-8 mx-auto opacity-20" />
                  <p className="text-xs uppercase tracking-widest opacity-50">Whiteboard</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Unified Bottom Control Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-1 p-1.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full shadow-2xl">

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/meetings" })}
              className="h-10 w-10 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-zinc-800 mx-1" />

            {/* Standard Controls Placeholder - In a real app these would be hooked up */}
            {/* Assuming MyVideoConference has its own controls, we might want to hide them and put them here,
                    but for now we are adding the requested extra controls here */}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWhiteboard}
              className={`h-10 w-10 rounded-full transition-all ${showWhiteboard
                ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              title="Whiteboard"
            >
              <Layout className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => recording ? handleStopRecording() : handleStartRecording()}
              disabled={isRecordingLoading || isStopRecordingLoading}
              className={`h-10 w-10 rounded-full transition-all ${recording
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              title={recording ? "Stop Recording" : "Start Recording"}
            >
              {isRecordingLoading || isStopRecordingLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Disc className="w-4 h-4" />
              )}
            </Button>

            <div className="w-px h-4 bg-zinc-800 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/meetings" })}
              className="h-10 w-10 rounded-full hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors"
              title="Leave"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}