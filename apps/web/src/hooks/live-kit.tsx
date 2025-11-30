import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Effect } from "effect";


const SERVER_URL = "http://localhost:3000";

const getToken = (roomName: string, participantName: string, role: 'tutor' | 'student' = 'tutor') => Effect.gen(function* () {
  if (!roomName || !participantName) {
    yield* Effect.die(new Error("Room name and participant name are required"));
  }
  const url = `${SERVER_URL}/getToken?roomName=${roomName}&participantName=${participantName}&role=${role}`;
  const res = yield* Effect.tryPromise({
    try: async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to get token: ${res.status} ${res.statusText}`);
      }
      return res;
    },
    catch: (error) => {
      return Effect.die(new Error(`Failed to get token: ${error}`));
    }
  });
  return res;
}).pipe(Effect.map((res) => res.json().then((data) => data.token)));


export const useToken = (roomName: string, participantName: string, role: 'tutor' | 'student' = 'tutor', enabled: boolean = true) => {
  return useQuery({
    queryKey: ["token", roomName, participantName, role],
    queryFn: async () => {
      return Effect.runPromise(getToken(roomName, participantName, role));
    },
    enabled: enabled && !!roomName && !!participantName,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRecord = () => {
  const trpc = useTRPC();
  return useMutation(trpc.engress.startEngress.mutationOptions());
};

export const useStopRecording = () => {
  const trpc = useTRPC();
  return useMutation(trpc.engress.stopEngress.mutationOptions());
};

export const useEnableAgent = () => {
  const trpc = useTRPC();
  return useMutation(trpc.meeting.enableAgent.mutationOptions());
};

export const useDisableAgent = () => {
  const trpc = useTRPC();
  return useMutation(trpc.meeting.disableAgent.mutationOptions());
};

export const useAgentStatus = (roomName: string, enabled: boolean = true) => {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.meeting.getAgentStatus.queryOptions({ roomName }),
    enabled: enabled && !!roomName,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};