import { useTRPC } from "@/utils/trpc";
import { useQuery, useMutation } from "@tanstack/react-query";


const SERVER_URL = "http://localhost:3000";

export const useToken = (roomName: string, participantName: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: ["token", roomName, participantName],
      queryFn: async () => {
        const url = `${SERVER_URL}/getToken?roomName=${roomName}&participantName=${participantName}`;
        console.log("Fetching token from:", url);
        const res = await fetch(url);
        
        console.log("Token response status:", res.status, res.statusText);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Token error response:", errorText);
          throw new Error(`Failed to get token: ${res.status} ${res.statusText} - ${errorText}`);
        }
        
        const data = await res.json(); // The response is JSON with { token: "..." }    
        console.log("Token data:", data);
        return data.token;
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