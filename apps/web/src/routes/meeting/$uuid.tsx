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
import { useToken, useRecord, useStopRecording, useEnableAgent, useDisableAgent, useAgentStatus } from "@/hooks/live-kit";
import { authClient } from "@/lib/auth-client";
import {
  PhoneOff,
  Disc,
  PenTool,
  ChevronLeft,
  Loader2,
  Layout,
  Share2,
  Check,
  Bot,
  BotOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
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
    'tutor', // Pass role as 'tutor'
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

  // Agent hooks
  const enableAgentMutation = useEnableAgent();
  const disableAgentMutation = useDisableAgent();
  const { data: agentStatus } = useAgentStatus(uuid, roomInstance.state === "connected");

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
          const result = data as { egressId: string };
          setEgressId(result.egressId);
          setRecording(true);
          setShowRecordingPrompt(false);
          setStatus("Recording started successfully!");
        },
        onError: (error) => {
          console.error("Failed to start recording:", error);
          setStatus(`Failed to start recording: ${error.message}`);
          setShowRecordingPrompt(false);
          // Ensure recording state is false if it failed to start
          setRecording(false);
          setEgressId(null);
        },
      }
    );
  }

  function handleStopRecording() {
    console.log("handleStopRecording called, egressId:", egressId);
    if (egressId) {
      console.log("Attempting to stop recording with egressId:", egressId);
      stopRecording(
        { egressId },
        {
          onSuccess: (data) => {
            console.log("Recording stopped successfully, response:", data);
            setRecording(false);
            setEgressId(null);
            setStatus("Recording stopped successfully!");
          },
          onError: (error) => {
            console.error("Failed to stop recording:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            console.log("Error details:", error);
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

  const handleShareLink = async () => {
    const meetingUrl = `${window.location.origin}/meeting/${uuid}`;

    try {
      await navigator.clipboard.writeText(meetingUrl);
      setLinkCopied(true);
      toast.success("Meeting link copied to clipboard!", {
        description: "Share this link with your students to invite them to the class."
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link", {
        description: "Please try again or copy the URL manually."
      });
    }
  };

  const handleToggleAgent = async () => {
    if (agentEnabled || agentStatus?.active) {
      // Disable agent
      disableAgentMutation.mutate(
        { roomName: uuid },
        {
          onSuccess: () => {
            setAgentEnabled(false);
            toast.success("AI Assistant disabled");
          },
          onError: (error) => {
            toast.error("Failed to disable AI Assistant", {
              description: error.message,
            });
          },
        }
      );
    } else {
      // Enable agent
      enableAgentMutation.mutate(
        { roomName: uuid },
        {
          onSuccess: () => {
            setAgentEnabled(true);
            toast.success("AI Assistant enabled", {
              description: "The assistant is now listening and ready to answer questions.",
            });
          },
          onError: (error) => {
            toast.error("Failed to enable AI Assistant", {
              description: error.message,
            });
          },
        }
      );
    }
  };

  // Recording prompt modal
  if (showRecordingPrompt) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card rounded-xl border border-border max-w-md w-full p-8 shadow-lg">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Record Session
              </h2>
              <p className="text-sm text-muted-foreground">
                This class will be recorded and available for students to review later.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleStartRecording}
                disabled={isRecordingLoading}
                className="w-full h-11"
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
                variant="outline"
                onClick={() => setShowRecordingPrompt(false)}
                className="w-full h-11"
              >
                Skip for Now
              </Button>

              <button
                onClick={() => {
                  setShowRecordingPrompt(false);
                  localStorage.setItem(`no-recording-${uuid}`, 'true');
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Don't ask again for this class
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">Connecting to class...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <RoomContext.Provider value={roomInstance}>

        {/* Top Bar */}
        <header className="h-16 px-6 flex items-center justify-between z-10 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-sm font-medium text-foreground">
                {username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recording && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-red-500 tracking-wide">Recording</span>
              </div>
            )}
            {(agentEnabled || agentStatus?.active) && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Bot className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-medium text-blue-500 tracking-wide">AI Assistant Active</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex relative overflow-hidden px-6 pb-24 gap-4">
          {/* Video Conference Area */}
          <div className={`flex-1 h-full transition-all duration-500 rounded-xl overflow-hidden border border-border bg-card ${showWhiteboard ? 'w-1/2' : 'w-full'}`}>
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
            <div className="w-1/2 h-full rounded-xl overflow-hidden border border-border bg-card animate-in slide-in-from-right-10 duration-500">
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-3">
                  <PenTool className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-xs text-muted-foreground font-medium">Whiteboard</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Unified Bottom Control Bar */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-1 p-1.5 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg">

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/meetings" })}
              className="h-10 w-10 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWhiteboard}
              className={`h-10 w-10 rounded-full transition-all ${showWhiteboard
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              title="Whiteboard"
            >
              <Layout className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleShareLink}
              className={`h-10 w-10 rounded-full transition-all duration-300 ${linkCopied
                ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              title="Share Meeting Link"
            >
              {linkCopied ? (
                <Check className="w-4 h-4 animate-in zoom-in duration-200" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                handleStopRecording();
              }}
              disabled={isRecordingLoading || isStopRecordingLoading}
              className={`h-10 w-10 rounded-full transition-all ${recording
                ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              title={recording ? "Stop Recording" : "Start Recording"}
            >
              {isRecordingLoading || isStopRecordingLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Disc className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleAgent}
              disabled={enableAgentMutation.isPending || disableAgentMutation.isPending}
              className={`h-10 w-10 rounded-full transition-all ${(agentEnabled || agentStatus?.active)
                ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                }`}
              title={(agentEnabled || agentStatus?.active) ? "Disable AI Assistant" : "Enable AI Assistant"}
            >
              {enableAgentMutation.isPending || disableAgentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (agentEnabled || agentStatus?.active) ? (
                <Bot className="w-4 h-4" />
              ) : (
                <BotOff className="w-4 h-4" />
              )}
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/meetings" })}
              className="h-10 w-10 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
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