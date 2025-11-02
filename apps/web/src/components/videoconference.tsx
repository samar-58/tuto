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
    <div className="flex flex-col lg:flex-row h-full bg-card text-foreground rounded-xl">
      <div className="flex-1 flex flex-col bg-gradient-to-br from-purple-50/30 via-white to-purple-100/20 dark:from-purple-950/20 dark:via-background dark:to-purple-900/10">
        <div className="relative flex-1 p-3 lg:p-4">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-purple-200/10 rounded-xl"></div>
          <div className="absolute top-4 right-4 w-24 h-24 bg-purple-200/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-purple-300/5 rounded-full blur-3xl"></div>
          
          <GridLayout
            tracks={tracks}
            style={{ height: "calc(100% - 80px)" }}
            className="relative z-10 h-full rounded-xl overflow-hidden shadow-lg"
          >
            <ParticipantTile className="rounded-xl border-2 border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-br from-white/90 via-purple-50/50 to-purple-100/30 dark:from-background/90 dark:via-purple-950/30 dark:to-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm" />
          </GridLayout>
        </div>
        
        <div className="relative border-t border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-r from-purple-50/80 via-white/90 to-purple-100/70 dark:from-purple-950/30 dark:via-background/80 dark:to-purple-900/20 backdrop-blur-sm">
          {/* Control bar decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent opacity-50"></div>
          <div className="relative z-10">
            <ControlBar />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-2 lg:gap-4 p-2 lg:p-4 border-t lg:border-t-0 lg:border-l border-border bg-card h-1/2 lg:h-full">
        <div className="relative overflow-hidden px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-purple-50 via-purple-100 to-purple-50 dark:from-purple-950/30 dark:via-purple-900/40 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
          <div className="relative flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm lg:text-base font-medium text-purple-800 dark:text-purple-200">
              {status}
            </span>
          </div>
        </div>
    
         
        {transcripts.length > 0 && (
          <div className="border border-border rounded-lg p-2 lg:p-3 bg-background overflow-y-auto max-h-40 ">
            <div className="text-xs lg:text-sm text-muted-foreground mb-1">LearnBetter Transcriptions</div>
            <ul className="space-y-1">
              {transcripts.map((t, i) => (
                <li key={i} className="text-foreground text-xs lg:text-sm break-words">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 border border-border rounded-lg p-2 lg:p-3 bg-background overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm">No messages yet</div>
          ) : (
            <ul className="space-y-1 lg:space-y-2">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex gap-2 p-1 lg:p-2 rounded-lg text-sm lg:text-base ${
                    m.from === "me" ? "bg-purple-100 text-purple-900 dark:bg-purple-900/30" : "bg-muted"
                  }`}
                >
                  <strong className="text-muted-foreground min-w-fit text-xs lg:text-sm">{m.from}:</strong>
                  <span className="text-foreground break-words">{m.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1 lg:gap-2 shrink-0">
          <label>
            <div className="text-xs lg:text-sm text-muted-foreground mb-1">Message</div>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-2 lg:px-3 py-1 lg:py-2 border border-input rounded-lg text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-primary focus:border-transparent"
            />
          </label>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`px-3 lg:px-4 py-1 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-colors border ${
              message.trim()
                ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer border-transparent"
                : "bg-muted text-muted-foreground cursor-not-allowed border-border"
            }`}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}