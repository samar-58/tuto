import { useMutation } from "@tanstack/react-query";

interface CreateMeetingData {
    id: string;
    name: string;
    description: string;
}

interface CreateMeetingResponse {
    meeting: {
        id: string;
        name: string;
        description: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}

async function createMeeting(data: CreateMeetingData): Promise<CreateMeetingResponse> {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/createMeeting`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create meeting");
    }

    return response.json();
}

export function useCreateMeeting() {
    return useMutation({
        mutationFn: createMeeting,
    });
}
