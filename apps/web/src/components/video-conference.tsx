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


  interface Transcript {
    text: string
    speaker: string
    type: 'FINAL' | 'PARTIAL'
    timestamp: number
  }

  const [transcripts, setTranscripts] = useState<Transcript[]>([])

  const onDataReceived = React.useCallback((msg: any) => {
    try {
      if (msg?.topic === "transcription" && msg?.payload) {
        const decodedText = new TextDecoder("utf-8").decode(msg.payload)
        try {
          const parsed = JSON.parse(decodedText)
          if (parsed?.text) {
            setTranscripts((prev) => {
              // For PARTIAL transcripts, replace the last one from same speaker
              if (parsed.type === 'PARTIAL' && prev.length > 0) {
                const lastTranscript = prev[prev.length - 1]
                if (lastTranscript.speaker === parsed.speaker && lastTranscript.type === 'PARTIAL') {
                  return [...prev.slice(0, -1), {
                    text: parsed.text,
                    speaker: parsed.speaker || 'Unknown',
                    type: parsed.type || 'FINAL',
                    timestamp: parsed.timestamp || Date.now()
                  }]
                }
              }
              // Keep only last 20 transcripts to avoid memory issues
              const newTranscripts = [...prev, {
                text: parsed.text,
                speaker: parsed.speaker || 'Unknown',
                type: parsed.type || 'FINAL',
                timestamp: parsed.timestamp || Date.now()
              }]
              return newTranscripts.slice(-20)
            })
          }
        } catch {
          setTranscripts((prev) => [...prev.slice(-19), {
            text: decodedText,
            speaker: 'Unknown',
            type: 'FINAL',
            timestamp: Date.now()
          }])
        }
      }
    } catch {
      // Silently ignore malformed messages
    }
  }, [])

  useDataChannel("transcription", onDataReceived)

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background text-foreground overflow-hidden">
      <div className="flex-1 flex flex-col bg-background relative">
        <div className="relative flex-1 p-0">
          <GridLayout
            tracks={tracks}
            style={{ height: "calc(100% - 80px)" }}
            className="relative z-10 h-full overflow-hidden"
          >
            <ParticipantTile className="border border-border bg-card" />
          </GridLayout>
        </div>

        <div className="relative border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="relative z-10">
            <ControlBar />
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-0 border-t lg:border-t-0 lg:border-l border-border bg-card h-1/2 lg:h-full">
        <div className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-xs font-medium text-muted-foreground">
              {status}
            </span>
          </div>
        </div>


        {transcripts.length > 0 && (
          <div className="border-b border-border p-3 bg-gradient-to-b from-muted/30 to-transparent">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground font-medium">Live Subtitles</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {transcripts.slice(-5).map((t, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${t.type === 'PARTIAL'
                      ? 'text-muted-foreground/70 italic'
                      : 'text-foreground'
                    } ${i === transcripts.slice(-5).length - 1 ? 'font-medium' : 'opacity-60'}`}
                >
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 p-3 bg-card overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center mt-4">No messages yet</div>
          ) : (
            <ul className="space-y-2">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={`flex flex-col gap-1 p-2 rounded-lg text-sm ${m.from === "me" ? "bg-accent text-accent-foreground" : "bg-muted/50 border border-border"
                    }`}
                >
                  <strong className="text-muted-foreground text-xs">{m.from}</strong>
                  <span className="text-foreground break-words">{m.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-3 border-t border-border bg-card">
          <div className="flex flex-col gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${message.trim()
                ? "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
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