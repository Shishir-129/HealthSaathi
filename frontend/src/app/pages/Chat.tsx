import { useState } from "react";
import { Send, Plus, Clock, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your HealthAI assistant. How can I help you with your health concerns today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [chatHistory] = useState<ChatHistory[]>([
    {
      id: "1",
      title: "Recent headache symptoms",
      lastMessage: "Try to stay hydrated...",
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: "2",
      title: "Sleep quality issues",
      lastMessage: "Establish a regular sleep...",
      timestamp: new Date(Date.now() - 86400000),
    },
    {
      id: "3",
      title: "Diet recommendations",
      lastMessage: "Include more vegetables...",
      timestamp: new Date(Date.now() - 172800000),
    },
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I understand your concern. Based on what you've told me, I recommend consulting with a healthcare professional for a proper diagnosis. In the meantime, make sure to stay hydrated and get adequate rest.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm your HealthAI assistant. How can I help you with your health concerns today?",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="h-full flex">
      {/* Chat History Sidebar */}
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Recent Conversations
            </h3>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {chat.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {chat.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-white border-b p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">
            Chat with HealthAI
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ask me anything about your health concerns
          </p>
        </header>

        {/* Messages Container */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-blue-500 to-green-500 text-white"
                      : "bg-white border border-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.sender === "user"
                        ? "text-blue-100"
                        : "text-gray-400"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Describe your symptoms or ask a health question..."
                className="flex-1 px-4 py-6 text-base border-2 focus:border-blue-500"
              />
              <Button
                onClick={handleSend}
                className="px-8 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
                size="lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              ⚠️ This is an AI assistant. Always consult healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
