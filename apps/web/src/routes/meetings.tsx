import { Button } from "@/components/ui/button"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useTRPC } from "@/utils/trpc"
import { useMutation } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/meetings")({
  component: RoomsPage,
});

function RoomsPage() {
  const navigate = useNavigate()
  const [topic, setTopic] = useState("")
  const [username, setUsername] = useState("")
  const trpc = useTRPC()
  const { data: session } = authClient.useSession()


  useEffect(() => {
    if (session?.user.name) {
      setUsername(session.user.name)
    }
  }, [session?.user.name]);

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };


  const createMeetingMutation = useMutation(trpc.meeting.createMeeting.mutationOptions());

  const handleCreateMeeting = async () => {
    try {
      const meetingId = generateUUID();
      await createMeetingMutation.mutateAsync({
        id: meetingId,
        name: topic,
        description: `Meeting created by ${username}`,
      });
      toast.success("Meeting created successfully");
      navigate({ to: "/meeting/$uuid", params: { uuid: meetingId } });

    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create meeting");
      return null;
    }
  }


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background overflow-hidden">


        <div className="flex-1 overflow-y-auto">
          <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            <div className="flex-1 flex items-center justify-center p-4 py-12 relative z-10">
              <div className="w-full max-w-md animate-fade-in">
                <div className="mb-8 text-center animate-slide-up">
                  <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">New Class</h1>
                  <p className="text-muted-foreground">Start a live session with your students</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-8 shadow-lg hover:shadow-xl transition-all duration-300 animate-slide-up [animation-delay:100ms]">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="topic" className="text-sm font-medium">
                        Class Topic
                      </label>
                      <Input
                        id="topic"
                        type="text"
                        placeholder="e.g., Mathematics - Chapter 5"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="username" className="text-sm font-medium">
                        Your Name
                      </label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Display name for students"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-11 transition-all duration-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>

                    <Button
                      onClick={handleCreateMeeting}
                      disabled={createMeetingMutation.isPending || !topic.trim() || !username.trim()}
                      className="w-full h-11 mt-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
                    >
                      {createMeetingMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Start Session
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center animate-fade-in [animation-delay:200ms]">
                  <p className="text-sm text-muted-foreground">
                    Students will be able to join using your class link
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}