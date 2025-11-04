import { useQuery, useMutation } from "@tanstack/react-query";
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
export const useRecord = () => {
  return useMutation({
    mutationFn: async ({ roomName, username }: { roomName: string; username: string }) => {
      const url = `${CONVEX_HTTP_URL}/startEgress`;
      console.log("Starting recording for room:", roomName, "by user:", username);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName,
          username,
        }),
      });

      console.log("Recording response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Recording error response:", errorText);
        throw new Error(`Failed to start recording: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const egressInfo = await res.json();
      console.log("Recording started successfully:", egressInfo);
      return egressInfo;
    },
    retry: 1, // Only retry once for recording
  });
};

export const useStopRecording = () => {
  return useMutation({
    mutationFn: async ({ egressId }: { egressId: string }) => {
      if (!egressId) {
        throw new Error("Egress ID is required to stop recording");
      }

      const url = `${CONVEX_HTTP_URL}/stopEgress`;
      console.log("Stopping recording with egressId:", egressId);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          egressId,
        }),
      });

      console.log("Stop recording response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Stop recording error response:", errorText);
        throw new Error(`Failed to stop recording: ${res.status} ${res.statusText} - ${errorText}`);
      }

      const result = await res.json();
      console.log("Recording stopped successfully:", result);
      return result;
    },
    retry: 1,
  });
};