import { Button } from "@/components/ui/button"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useCreateMeeting } from "@/hooks/use-meetings"

export const Route = createFileRoute("/meetings")({
  component: RoomsPage,
});

function RoomsPage() {
  const navigate = useNavigate()
  const [topic, setTopic] = useState("")
  const [username, setUsername] = useState("SamarSayed")

  const { data: session } = authClient.useSession()
  const createMeetingMutation = useCreateMeeting()

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const createRoom = async () => {
    // Validate inputs
    if (!topic.trim()) {
      toast.error("Please enter a meeting topic");
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter your username");
      return;
    }

    // Check if user is authenticated
    if (!session?.user?.id) {
      toast.error("Please sign in to create a meeting");
      return;
    }

    const roomName = generateUUID();

    // Use TanStack Query mutation to create meeting
    createMeetingMutation.mutate(
      {
        id: roomName,
        name: topic,
        description: `Meeting created by ${username}`,
      },
      {
        onSuccess: (data) => {
          console.log("Meeting created:", data.meeting);
          toast.success("Meeting created successfully!");
          navigate({ to: "/meeting/$uuid", params: { uuid: roomName } });
        },
        onError: (error) => {
          console.error("Error creating meeting:", error);
          toast.error(error instanceof Error ? error.message : "Failed to create meeting");
        },
      }
    );
  }


  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-sm space-y-12">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            New Meeting
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Start a secure session instantly.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                Topic
              </label>
              <Input
                id="topic"
                type="text"
                placeholder="What's this meeting about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="border-0 border-b border-zinc-200 dark:border-zinc-800 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 bg-transparent shadow-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors h-auto text-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Your display name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border-0 border-b border-zinc-200 dark:border-zinc-800 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-zinc-900 dark:focus-visible:border-zinc-100 bg-transparent shadow-none placeholder:text-zinc-300 dark:placeholder:text-zinc-700 transition-colors h-auto text-lg"
              />
            </div>
          </div>

          <Button
            onClick={createRoom}
            disabled={createMeetingMutation.isPending}
            className="w-full h-12 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-full transition-all duration-300 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMeetingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Meeting...
              </>
            ) : (
              <>
                Start Session
                <ArrowRight className="w-4 h-4 ml-2 opacity-50 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}