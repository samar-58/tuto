import { Button } from "@/components/ui/button"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/meetings")({
  component: RoomsPage,
});

function RoomsPage() {
    const navigate = useNavigate()
    const  [ topic, setTopic ] = useState("")
    const  [ username, setUsername ] = useState("SamarSayed")

    const generateUUID = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const createRoom = async () => {
            const roomName = generateUUID();
            navigate({ to: "/meeting/$uuid", params: { uuid: roomName} })
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-white flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm border border-purple-200 rounded-xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">LearnBetter Meeting Room</h1>
            <p className="text-gray-600">Create a new meeting room to get started</p>
            </div>
            <div className="mb-4">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Topic
              </label>
              <Input 
                id="topic"
                type="text" 
                placeholder="Enter the topic for your meeting..." 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
              <Input 
                id="username"
                type="text" 
                placeholder="Enter the username for your meeting..." 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <Button onClick={createRoom} className="w-full px-6 py-3 text-base bg-purple-600 hover:bg-purple-700">
            Create LearnBetter Meeting
            </Button>
        </div>
        </div>
    )
    }