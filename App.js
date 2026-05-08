"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";

// NOTE: Ensure this file exists in your /utils/ folder
import useHandleStreamResponse from "@/utils/useHandleStreamResponse";

export default function ChatGenius() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleFinish = useCallback((message) => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: message, type: "text" },
    ]);
    setStreamingMessage("");
    setIsLoading(false);
  }, []);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: handleFinish,
  });

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input, type: "text" };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input; // Save input for the API
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", { // Updated to a standard API path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to connect to AI");
      handleStreamResponse(response);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + error.message, type: "text" }]);
      setIsLoading(false);
    }
  }, [input, messages, isLoading, handleStreamResponse]);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header */}
      <div className="bg-[#FFFF64] p-6 border-b border-gray-800">
        <h1 className="text-4xl font-black text-black text-center tracking-widest">CHAT GENIUS</h1>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-4 rounded-xl max-w-xs ${m.role === "user" ? "bg-[#FFFF64] text-black" : "bg-gray-800"}`}>
              {m.type === "image" ? <img src={m.content} alt="AI Gen" className="rounded-lg" /> : m.content}
            </div>
          </div>
        ))}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="p-4 rounded-xl bg-gray-800 text-gray-300 italic">{streamingMessage}</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <input
            className="flex-1 bg-black border-2 border-gray-700 rounded-lg p-3 focus:border-[#FFFF64] outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button onClick={handleSendMessage} disabled={isLoading} className="bg-[#FFFF64] text-black p-3 rounded-lg font-bold">
            {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
}