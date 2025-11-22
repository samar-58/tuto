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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-8">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Start Recording?
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Would you like to record this meeting session? The recording will be stored and you'll be able to access it later.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleStartRecording}
                disabled={isRecordingLoading}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isRecordingLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Starting Recording...
                  </>
                ) : (
                  <>
                    🔴 Start Recording
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRecordingPrompt(false)}
                className="w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Skip for Now
              </button>

              <button
                onClick={() => {
                  setShowRecordingPrompt(false);
                  localStorage.setItem(`no-recording-${uuid}`, 'true');
                }}
                className="w-full px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Don't ask again for this meeting
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Meeting ID: <span className="font-mono">{uuid.substring(0, 8)}...</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                By recording, you confirm all participants have consented to be recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while connecting
  if (!token || roomInstance.state === "disconnected" || isTokenLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-zinc-700 dark:text-zinc-300 font-medium">Connecting to meeting...</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:bg-background">
      <RoomContext.Provider value={roomInstance}>
        <div data-lk-theme="default" className="flex h-[calc(100vh-80px)] p-4 lg:p-6">
          <div className={`transition-all duration-300 ${showWhiteboard ? 'w-1/2 pr-2' : 'w-full'}`}>
            <div className="h-full rounded-xl border border-border bg-card shadow-sm">
              <MyVideoConference
                handleSend={handleSend}
                message={message}
                setMessage={setMessage}
                messages={messages}
                status={status}
              />
            </div>
          </div>

          {showWhiteboard && (
            <div className="w-1/2 pl-2">
              <div className="h-full rounded-xl border border-border bg-card relative overflow-hidden">
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                  <div className="text-center space-y-4">
                    <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <p className="text-lg font-medium">Whiteboard</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recording toggle button */}
        <button
          onClick={() => {
            if (recording) {
              handleStopRecording();
            } else {
              handleStartRecording();
            }
          }}
          disabled={isRecordingLoading || isStopRecordingLoading}
          className={`fixed bottom-6 right-6 z-50 px-5 py-2.5 rounded-full font-medium shadow-md transition-colors border flex items-center gap-2 ${
            recording
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-zinc-800 text-white hover:bg-zinc-900'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isStopRecordingLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Stopping...
            </>
          ) : isRecordingLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Starting...
            </>
          ) : recording ? (
            <>
              <span className="w-3 h-3 bg-white rounded-full"></span>
              Stop Recording
            </>
          ) : (
            <>
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              Start Recording
            </>
          )}
        </button>

        {/* Whiteboard toggle button */}
        <button
          onClick={toggleWhiteboard}
          className={`fixed bottom-20 right-6 z-50 px-5 py-2.5 rounded-full font-medium shadow-md transition-colors border ${
            showWhiteboard
              ? 'bg-destructive text-destructive-foreground hover:opacity-90'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {showWhiteboard ? '✕ Close Board' : '📝 Open Board'}
        </button>

        {/* Back to meetings button */}
        <button
          onClick={() => navigate({ to: "/meetings" })}
          className="fixed bottom-6 left-6 z-50 px-4 py-2 rounded-full font-medium shadow-md transition-colors border bg-zinc-600 text-white hover:bg-zinc-700"
        >
          ← Back to Meetings
        </button>

        {/* Meeting Info */}
        <div className="fixed top-6 left-6 z-50 px-4 py-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="text-sm">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {username} • Meeting ID
              {recording && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  REC
                </span>
              )}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">{uuid}</div>
            {egressId && (
              <div className="text-zinc-500 dark:text-zinc-500 text-xs mt-1">
                Recording ID: {egressId.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>

        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}