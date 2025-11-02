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
import MyVideoConference from "@/components/videoconference";
import { useToken } from "@/lib/hooks";
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
  const {data:session} = authClient.useSession()

  const [roomInstance] = useState(() => new Room({
    adaptiveStream: true,
    dynacast: true,
  }));

   useEffect(()=>{
    if(session?.user.name){
      setUsername(session.user.name)
      console.log("userrname",session.user.name)
    }
   },[session?.user.name]);

  const { data: token, isLoading: isTokenLoading, error: tokenError } = useToken(
    uuid,
    username,
    !!username
  );
  
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
    if(!username){
      navigate({to:"/test-auth"})
    }
    try {
      setStatus("Connecting to room...");
      if (!LIVEKIT_URL) {
        throw new Error("LiveKit URL is missing");
      }
      console.log("Livekit URL", LIVEKIT_URL)
      await roomInstance.connect(LIVEKIT_URL, token);

      setStatus(`Joined room: ${roomInstance.name}`);

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

  // // Show username popup
  // if (showUsernamePopup) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 dark:bg-background flex items-center justify-center p-4">
  //       <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-8">
  //         <div className="text-center space-y-6">
  //           <div className="space-y-2">
  //             <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
  //               <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  //               </svg>
  //             </div>
  //             <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
  //               Join Meeting
  //             </h2>
  //             <p className="text-sm text-zinc-600 dark:text-zinc-400">
  //               Enter your name to continue
  //             </p>
  //           </div>

  //           <div className="space-y-4">
  //             <div className="space-y-2">
  //               <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left">
  //                 Your Name
  //               </label>
  //               <input
  //                 id="username"
  //                 type="text"
  //                 value={tempUsername}
  //                 onChange={(e) => setTempUsername(e.target.value)}
  //                 onKeyPress={handleKeyPress}
  //                 placeholder="Enter your name"
  //                 autoFocus
  //                 className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
  //               />
  //             </div>

  //             <button
  //               onClick={handleUsernameSubmit}
  //               disabled={tempUsername.trim().length < 2}
  //               className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
  //             >
  //               Join Meeting
  //             </button>

  //             <button
  //               onClick={() => navigate({ to: "/meetings" })}
  //               className="w-full px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
  //             >
  //               Cancel
  //             </button>
  //           </div>

  //           <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
  //             <p className="text-xs text-zinc-500 dark:text-zinc-500">
  //               Meeting ID: <span className="font-mono">{uuid.substring(0, 8)}...</span>
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

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

        {/* Whiteboard toggle button */}
        <button
          onClick={toggleWhiteboard}
          className={`fixed bottom-6 right-6 z-50 px-5 py-2.5 rounded-full font-medium shadow-md transition-colors border ${
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
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 font-mono text-xs">{uuid}</div>
          </div>
        </div>

        <RoomAudioRenderer />
      </RoomContext.Provider>
    </div>
  );
}