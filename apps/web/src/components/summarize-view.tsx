import { useState, useRef, useEffect } from 'react';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Loader2,
    Music,
    Send,
    Copy,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummarizeViewProps {
    meetingId: string;
    playlistUrl: string;
}

export default function SummarizeView({ meetingId, playlistUrl }: SummarizeViewProps) {
    const [transcription, setTranscription] = useState('');
    const [isExtractingAudio, setIsExtractingAudio] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const trpc = useTRPC();
    const extractAudioMutation = useMutation(trpc.videoToMp3.videoToMp3.mutationOptions());
    const startTranscriptionMutation = useMutation(trpc.videoToMp3.startTranscription.mutationOptions());

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: `${import.meta.env.VITE_SERVER_URL}/summarize`,
        }),
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleExtractAudio = async () => {
        setIsExtractingAudio(true);
        try {
            const result = await extractAudioMutation.mutateAsync({
                videoUrl: playlistUrl,
            });
            toast.success('Audio extraction started!');

            const transcriptionResult = await startTranscriptionMutation.mutateAsync({
                key: result.key,
            });

            setTranscription(transcriptionResult.transcription);
            setInputValue(transcriptionResult.transcription);
            toast.success('Transcription complete! You can now ask questions about the content.');
        } catch (err) {
            console.error('Audio extraction failed:', err);
            toast.error('Failed to extract audio. Please try again.');
        } finally {
            setIsExtractingAudio(false);
        }
    };

    const handleCopyMessage = async (messageId: string, text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedMessageId(messageId);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        sendMessage(
            { text: inputValue },
            { body: { meetingId } }
        );
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const getMessageText = (message: typeof messages[0]) => {
        return message.parts
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map(part => part.text)
            .join('');
    };

    return (
        <div className="flex flex-col h-full">
            {!transcription && (
                <div className="mb-4">
                    <Button
                        onClick={handleExtractAudio}
                        disabled={isExtractingAudio}
                        variant="outline"
                        size="sm"
                    >
                        {isExtractingAudio ? (
                            <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Music className="w-3 h-3 mr-2" />
                                Extract & Transcribe
                            </>
                        )}
                    </Button>
                </div>
            )}

            {transcription && (
                <div className="mb-4 p-3 bg-muted/30 rounded border border-border/50 max-h-32 overflow-y-auto">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{transcription}</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 mb-2">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground">
                            {transcription ? "Ask a question about the recording" : "Extract audio to start"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((message) => {
                            const messageText = getMessageText(message);
                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex",
                                        message.role === 'user' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[85%] px-3 py-2 rounded",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}
                                    >
                                        <div className="text-sm whitespace-pre-wrap">{messageText}</div>
                                        {message.role === 'assistant' && (
                                            <button
                                                onClick={() => handleCopyMessage(message.id, messageText)}
                                                className="mt-1 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                            >
                                                {copiedMessageId === message.id ? (
                                                    <>
                                                        <Check className="w-3 h-3" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3 h-3" />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {status === 'streaming' && (
                            <div className="flex justify-start">
                                <div className="bg-muted px-3 py-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
                
            <div className="border-t border-border pt-2">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={transcription ? "Ask a question..." : "Extract audio first..."}
                        disabled={!transcription || status === 'streaming'}
                        className="flex-1 min-h-[40px] max-h-[120px] resize-none text-sm"
                        rows={1}
                    />
                    <Button
                        type="submit"
                        disabled={!inputValue.trim() || status === 'streaming' || !transcription}
                        size="icon"
                        className="h-[40px] w-[40px] flex-shrink-0"
                    >
                        {status === 'streaming' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
