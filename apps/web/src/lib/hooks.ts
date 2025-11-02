import { useQuery } from "@tanstack/react-query";
import { CONVEX_HTTP_URL } from "./constant";

export const useToken = (roomName: string, participantName: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["token", roomName, participantName],
    queryFn: async () => {
      const url = `${CONVEX_HTTP_URL}/getToken?roomName=${encodeURIComponent(roomName)}&userName=${encodeURIComponent(participantName)}`;
      console.log("Fetching token from:", url);
      const res = await fetch(url);
      
      console.log("Token response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Token error response:", errorText);
        throw new Error(`Failed to get token: ${res.status} ${res.statusText} - ${errorText}`);
      }
      
      return await res.text(); // The response is just the token string
    },
    enabled: enabled && !!roomName && !!participantName,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};