import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/utils/trpc";

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

interface Meeting {
    id: string;
    name: string;
    description: string;
    userId: string;
    hasEgress: boolean;
    createdAt: string;
    updatedAt: string;
}

interface GetRecordingsResponse {
    meetings: Meeting[];
}


