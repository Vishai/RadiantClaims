"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ResourceFeedbackInline } from "./ResourceFeedbackInline";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  };
  onContactSelected?: (contact: Contact) => void;
}

export function ContactAgentChat({
  sessionContext,
  onContactSelected,
}: ContactAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        'Hi! I\'m here to help you find contacts for documents you need for your RECA claim. You can ask me things like:\n\n• "I need my birth certificate from St. George, Utah"\n• "Where can I get medical records from Las Vegas?"\n• "Help me find school records from 1955"\n\nWhat document are you looking for?',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex h-[600px] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <Bot className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold">Contact Finder Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Find institutional contacts for your documents
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div key={index}>
            {/* Message bubble */}
            <div
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-2 last:mb-0" />
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
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </p>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* Contact cards */}
            {message.contacts && message.contacts.length > 0 && (
              <div className="ml-11 mt-3 space-y-2">
                {message.contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                    onClick={() => onContactSelected?.(contact)}
                  >
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {contact.resourceType.replace(/_/g, " ")}
                          {contact.county && ` • ${contact.county} County`}
                        </p>

                        {/* Social proof */}
                        {contact.stats && contact.stats.totalFeedback >= 3 && (
                          <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-green-200 bg-green-50 p-2">
                            {contact.stats.successRate !== null &&
                              contact.stats.successRate > 0 && (
                                <div className="flex items-center gap-2 text-green-700">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="text-sm font-semibold">
                                    {Math.round(contact.stats.successRate)}%
                                    success rate
                                  </span>
                                </div>
                              )}
                            {contact.stats.avgRating !== null &&
                              contact.stats.avgRating > 0 && (
                                <div className="flex items-center gap-2 text-amber-600">
                                  <Star className="h-5 w-5 fill-amber-400" />
                                  <span className="text-sm font-semibold">
                                    {contact.stats.avgRating.toFixed(1)} star
                                    rating
                                  </span>
                                </div>
                              )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-5 w-5" />
                              <span className="text-sm font-medium">
                                {contact.stats.contactedCount}{" "}
                                {contact.stats.contactedCount === 1
                                  ? "person"
                                  : "people"}{" "}
                                used this
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <a
                              href={`tel:${contact.phone}`}
                              className="hover:underline"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:underline"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.website && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <ExternalLink className="h-3 w-3" />
                            <a
                              href={contact.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>

                      {contact.address && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                          <span>
                            {contact.address}
                            {contact.city && `, ${contact.city}`}
                            {contact.zipCode && ` ${contact.zipCode}`}
                          </span>
                        </div>
                      )}

                      {(contact.estimatedCost !== null ||
                        contact.processingTimeDays !== null) && (
                        <div className="flex gap-3 text-xs text-muted-foreground">
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

                      <div className="flex flex-wrap gap-2">
                        {contact.acceptsOnlineRequests && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            Online requests
                          </span>
                        )}
                        {contact.acceptsMailRequests && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                            Mail requests
                          </span>
                        )}
                        {contact.appointmentRequired && (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                            Appointment required
                          </span>
                        )}
                      </div>

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
            <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about finding contacts..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
