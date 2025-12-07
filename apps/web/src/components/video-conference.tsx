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
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <div className="flex h-full flex-col gap-4 lg:flex-row text-foreground">
      <Card className="flex-1 gap-0 p-0">


        <div className="relative flex-1">
          <GridLayout tracks={tracks} className="relative z-10 h-full overflow-hidden">
            <ParticipantTile className="border border-border bg-card/70 backdrop-blur-sm" />
          </GridLayout>
        </div>

        <div className="border-t border-border/80 bg-card/70 px-4 py-2">
          <ControlBar />
        </div>
      </Card>

      <Card className="w-full lg:w-80 h-full gap-0 p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">Chat</Badge>
            <span className="text-xs text-muted-foreground">{status}</span>
          </div>
          <Badge variant="outline" className="text-[11px]">{messages.length} messages</Badge>
        </div>

        {transcripts.length > 0 && (
          <div className="border-b border-border/80 px-5 py-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[11px]">Captions</Badge>
              <span className="text-[11px] text-muted-foreground">Live</span>
            </div>
            <ScrollArea className="mt-2 max-h-32 pr-2">
              <div className="space-y-1.5">
                {transcripts.slice(-5).map((t, i) => (
                  <div
                    key={i}
                    className={`rounded-md border border-border/70 bg-background/70 px-2.5 py-2 text-sm leading-relaxed ${t.type === "PARTIAL" ? "text-muted-foreground/80 italic" : "text-foreground"}`}
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-medium">{t.speaker || "Speaker"}</span>
                      <span className="uppercase tracking-wide">{t.type}</span>
                    </div>
                    {t.text}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex-1 px-5 py-3">
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center mt-4">No messages yet</div>
          ) : (
            <ScrollArea className="h-full pr-2">
              <ul className="space-y-2">
                {messages.map((m, i) => (
                  <li
                    key={i}
                    className={`flex flex-col gap-1 rounded-xl border px-3 py-2 text-sm ${m.from === "me"
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/80 bg-muted/60"
                      }`}
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">{m.from}</span>
                    <span className="text-foreground break-words leading-relaxed">{m.text}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-border/80 px-5 py-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!message.trim()}
            className="whitespace-nowrap"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}