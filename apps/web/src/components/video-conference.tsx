"use client"

import React, { useState } from "react"
import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
  useDataChannel,
} from "@livekit/components-react"
import { Track } from "livekit-client"

interface Message {
  from: string
  text: string
  timestamp?: Date
}

interface VideoConferenceProps {
  handleSend: () => void
  message: string
  setMessage: (message: string) => void
  messages: Message[]
  status: string
}

export default function MyVideoConference({ handleSend, message, setMessage, messages, status }: VideoConferenceProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )


  const [transcripts, setTranscripts] = useState<string[]>([])

  const onDataReceived = React.useCallback((msg: any) => {
    try {
      if (msg?.topic === "transcription" && msg?.payload) {
        const decodedText = new TextDecoder("utf-8").decode(msg.payload)
        try {
          const parsed = JSON.parse(decodedText)
          const text = typeof parsed === "string" ? parsed : (parsed?.text ?? decodedText)
          setTranscripts((prev) => [...prev, String(text)])
        } catch {
          setTranscripts((prev) => [...prev, decodedText])
        }
      }
    } catch {
      console.error("Malformed data channel message")
    }
  }, [])

  useDataChannel(onDataReceived)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-zinc-900 text-zinc-100 rounded-none overflow-hidden">
      <div className="flex-1 flex flex-col bg-zinc-950 relative">
        <div className="relative flex-1 p-0">
          <GridLayout
            tracks={tracks}
            style={{ height: "calc(100% - 80px)" }}
            className="relative z-10 h-full overflow-hidden"
          >
            <ParticipantTile className="border border-zinc-800 bg-zinc-900" />
          </GridLayout>
        </div>

        <div className="relative border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
          <div className="relative z-10">
            <ControlBar />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-0 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900 h-1/2 lg:h-full">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              {status}
            </span>
          </div>
        </div>


        {transcripts.length > 0 && (
          <div className="border-b border-zinc-800 p-3 bg-zinc-900/50 overflow-y-auto max-h-40">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Transcripts</div>
            <ul className="space-y-1">
              {transcripts.map((t, i) => (
                <li key={i} className="text-zinc-300 text-xs lg:text-sm break-words">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 p-3 bg-zinc-900 overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <div className="text-zinc-600 text-sm text-center mt-4">No messages yet</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex flex-col gap-1 p-2 rounded-lg text-sm ${m.from === "me" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-900/50 border border-zinc-800"
                    }`}
                >
                  <strong className="text-zinc-500 text-xs">{m.from}</strong>
                  <span className="text-zinc-300 break-words">{m.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t border-zinc-800 bg-zinc-900">
          <div className="flex flex-col gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-zinc-800 rounded-md text-sm bg-zinc-950 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${message.trim()
                  ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 cursor-pointer"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}