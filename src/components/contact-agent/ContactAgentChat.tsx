"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  ExternalLink,
  Phone,
  CheckCircle2,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResourceFeedbackInline } from "./ResourceFeedbackInline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  messageId?: string; // assistant message id for analytics
  contacts?: Contact[];
  interactions?: { resourceId: string; interactionId: string }[];
}

interface Contact {
  id: string;
  name: string;
  resourceType: string;
  state: string;
  county: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  documentTypesProvided: string[];
  notes: string | null;
  estimatedCost: number | null;
  processingTimeDays: number | null;
  acceptsMailRequests: boolean;
  acceptsOnlineRequests: boolean;
  appointmentRequired: boolean;
  isTribal?: boolean;
  stats?: {
    totalFeedback: number;
    successCount: number;
    contactedCount: number;
    successRate: number | null;
    avgRating: number | null;
  };
}

interface ContactAgentChatProps {
  sessionContext?: {
    state?: string;
    county?: string;
    claimType?: string;
    intakeSessionId?: string;
    recaWorkflowStage?: number | null;
    recaWorkflowSection?: string | null;
    recaCompletionPercent?: number | null;
    missingDocuments?: Array<{ documentType: string; status: string }>;
    documentStatusCounts?: Record<string, number>;
  };
  onContactSelected?: (contact: Contact) => void;
}

const SUGGESTED_TOPICS = [
  "Find Medical Records",
  "Get Birth Certificate",
  "Check RECA Eligibility",
  "Compensation Info",
];

export function ContactAgentChat({
  sessionContext,
  onContactSelected,
}: ContactAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "**Hi! I'm your Acquisition Assistant.**\n\nI'm here to help you track down documents and understand the RECA program.\n\nI can help you:\n• **Find Hospitals** & clinics for medical proofs\n• **Locate Vital Records** (birth/death/marriage)\n• **Answer Questions** about eligibility & compensation\n• **Find Archives** for employment history\n\nWhat are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [supportText, setSupportText] = useState("");
  const [supportStatus, setSupportStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/contact-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionContext,
          chatSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Persist the session ID so subsequent messages have memory
      if (data.chatSessionId && !chatSessionId) {
        setChatSessionId(data.chatSessionId);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        contacts: data.contacts || [],
        interactions: data.interactions || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    handleSend(topic);
  };

  const sendFeedback = async (messageId: string, rating: "up" | "down") => {
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSessionId,
          messageId,
          rating,
          source: "contact_agent",
        }),
      });
    } catch {
      // Non-blocking
    }
  };

  const handleRequestSupport = async () => {
    if (!supportText.trim() || supportStatus === "sending") return;
    setSupportStatus("sending");
    try {
      const res = await fetch("/api/support/chat-escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSessionId,
          intakeSessionId: sessionContext?.intakeSessionId,
          message: supportText,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSupportStatus("sent");
      setSupportText("");
      setTimeout(() => setSupportStatus("idle"), 2500);
    } catch {
      setSupportStatus("error");
      setTimeout(() => setSupportStatus("idle"), 2500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex h-[600px] flex-col border-0 shadow-none sm:border sm:shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 border-b bg-gray-50/50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shadow-sm">
          <Bot className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900">
                Acquisition Assistant
              </h3>
              <p className="text-xs text-muted-foreground">
                Expert in locating RECA documents
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {sessionContext?.recaWorkflowSection
                ? `On: ${sessionContext.recaWorkflowSection}`
                : "General"}
            </Badge>
          </div>

          {/* Lightweight support request */}
          <div className="mt-2 flex gap-2">
            <Input
              value={supportText}
              onChange={(e) => setSupportText(e.target.value)}
              placeholder="Need a human? Describe the issue (sends to support)."
              className="h-9"
            />
            <Button
              onClick={handleRequestSupport}
              disabled={!supportText.trim() || supportStatus === "sending"}
              size="sm"
              variant="outline"
            >
              {supportStatus === "sending"
                ? "Sending..."
                : supportStatus === "sent"
                  ? "Sent"
                  : supportStatus === "error"
                    ? "Error"
                    : "Send"}
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
        {messages.map((message, index) => (
          <div key={index}>
            {/* Message bubble */}
            <div
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "rounded-br-none bg-blue-600 text-white"
                    : "rounded-bl-none bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="font-medium text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            {...props}
                            className="mb-2 leading-relaxed last:mb-0"
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="mb-2 ml-4 list-disc" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="mb-2 ml-4 list-decimal" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="mb-1" />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong {...props} className="font-semibold" />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    {message.messageId && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-sage-600 hover:text-sage-900"
                          onClick={() => sendFeedback(message.messageId!, "up")}
                        >
                          👍 Helpful
                        </button>
                        <button
                          type="button"
                          className="text-xs text-sage-600 hover:text-sage-900"
                          onClick={() =>
                            sendFeedback(message.messageId!, "down")
                          }
                        >
                          👎 Not helpful
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* Show suggested topics only after the first assistant message */}
            {index === 0 && message.role === "assistant" && (
              <div className="ml-11 mt-3 flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="cursor-pointer bg-blue-50 px-3 py-1.5 text-blue-700 transition-colors hover:bg-blue-100"
                    onClick={() => handleTopicClick(topic)}
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            {/* Contact cards */}
            {message.contacts && message.contacts.length > 0 && (
              <div className="ml-11 mt-3 space-y-2">
                {message.contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="group cursor-pointer p-4 transition-all hover:border-blue-200 hover:shadow-md"
                    onClick={() => onContactSelected?.(contact)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold transition-colors group-hover:text-blue-700">
                            {contact.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {contact.resourceType.replace(/_/g, " ")}
                            {contact.county && ` • ${contact.county} County`}
                          </p>
                        </div>
                        {contact.isTribal && (
                          <Badge
                            variant="outline"
                            className="border-terracotta-200 bg-terracotta-50 text-[10px] text-terracotta-700"
                          >
                            Tribal
                          </Badge>
                        )}
                      </div>

                      {/* Social proof */}
                      {contact.stats && contact.stats.totalFeedback >= 3 && (
                        <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-green-200 bg-green-50 p-2">
                          {contact.stats.successRate !== null &&
                            contact.stats.successRate > 0 && (
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-semibold">
                                  {Math.round(contact.stats.successRate)}%
                                  success rate
                                </span>
                              </div>
                            )}
                          {contact.stats.avgRating !== null &&
                            contact.stats.avgRating > 0 && (
                              <div className="flex items-center gap-2 text-amber-600">
                                <Star className="h-4 w-4 fill-amber-400" />
                                <span className="text-xs font-semibold">
                                  {contact.stats.avgRating.toFixed(1)} star
                                  rating
                                </span>
                              </div>
                            )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-medium">
                              {contact.stats.contactedCount}
                              {contact.stats.contactedCount === 1
                                ? " person"
                                : " people"}
                              used this
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1 text-xs">
                        {contact.phone && (
                          <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="hover:text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.website && (
                          <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            <a
                              href={contact.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>

                      {(contact.estimatedCost !== null ||
                        contact.processingTimeDays !== null) && (
                        <div className="flex gap-3 pt-1 text-xs text-muted-foreground">
                          {contact.estimatedCost !== null && (
                            <span>Cost: ${contact.estimatedCost}</span>
                          )}
                          {contact.processingTimeDays !== null && (
                            <span>
                              Processing: ~{contact.processingTimeDays} days
                            </span>
                          )}
                        </div>
                      )}

                      {/* Immediate feedback */}
                      <ResourceFeedbackInline
                        resourceId={contact.id}
                        resourceName={contact.name}
                        interactionId={
                          message.interactions?.find(
                            (i) => i.resourceId === contact.id
                          )?.interactionId
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Bot className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-none bg-gray-100 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-sm font-medium text-gray-500">
                Thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., I need medical records from St. George..."
            disabled={isLoading}
            className="flex-1 border-gray-300 bg-white focus-visible:ring-blue-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
