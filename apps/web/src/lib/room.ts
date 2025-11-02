import { Room } from "livekit-client";
import { LIVEKIT_URL, CONVEX_HTTP_URL } from './constant';


export  async function joinRoom(roomName: string, identity: string): Promise<Room> {
    let room: Room;
  
  // Use fetch instead of axios, similar to your index.tsx pattern
  const res = await fetch(`${CONVEX_HTTP_URL}/getToken?roomName=${roomName}&participantName=${identity}`);
  
  if (!res.ok) {
    throw new Error(`Failed to get token: ${res.status} ${res.statusText}`);
  }
  
  const token = await res.text(); // The response is just the token string
  
  room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });
  
  if (!LIVEKIT_URL) {
    throw new Error("LiveKit URL is missing");
  }
  
  await room.connect(LIVEKIT_URL, token);

  console.log(" Connected to room:", room.name);
  room.on("dataReceived", (payload, participant) => {
    const message = new TextDecoder().decode(payload);
    console.log(`${participant?.identity}: ${message}`);
  });
  return room;
}

export function sendMessage(msg: string, room: Room) {
    if (!room) return;
    room.localParticipant.publishData(
      new TextEncoder().encode(msg),
      { reliable: true } 
    );
    console.log("Sent:", msg);
  }
  
