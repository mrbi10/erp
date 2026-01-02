import React, { useState, useRef, useEffect } from "react";
import { BASE_URL } from "../constants/API";

export default function AssistantButton({ user }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, loading, open]);

    useEffect(() => {
    if (open) loadHistory();
}, [open]);


    const loadHistory = async () => {
    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BASE_URL}/assistant/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        const formatted = data.messages.map(m => ({
            role: m.role,
            content: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        setMessages(formatted);
    } catch (err) {
        console.log("History load failed:", err);
    }
};


    // Helper to get current time
    const getTime = () => {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        const userMessage = { role: "user", content: text, time: getTime() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/assistant`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();
            const botMessage = { role: "assistant", content: data.reply || "No response", time: getTime() };
            setMessages((prev) => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = { role: "assistant", content: "I'm having trouble connecting right now.", time: getTime() };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* --- Floating Launcher --- */}
            <button
                onClick={() => setOpen(true)}
                className={`
          fixed bottom-8 right-8 z-50 group
          flex items-center justify-center w-16 h-16
          bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600
          bg-[length:200%_200%] animate-gradient-xy
          text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.3)]
          hover:shadow-[0_8px_40px_rgb(79,70,229,0.5)]
          hover:scale-105 active:scale-95
          transition-all duration-300 ease-out border border-white/20
          ${open ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"}
        `}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {/* Notification Dot Pulse */}
                <span className="absolute top-0 right-0 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 border-2 border-white"></span>
                </span>
            </button>

            {/* --- Main Chat Window --- */}
            <div
                className={`
          fixed bottom-8 right-8 z-50
          w-[380px] max-w-[calc(100vw-2rem)] h-[650px] max-h-[calc(100vh-6rem)]
          bg-white/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/60
          border border-white/40
          rounded-[2rem] shadow-2xl
          flex flex-col overflow-hidden
          transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) origin-bottom-right
          ${open
                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                        : "opacity-0 translate-y-12 scale-90 pointer-events-none"
                    }
        `}
            >
                {/* --- Header --- */}
                <div className="bg-white/50 backdrop-blur-md p-5 shrink-0 flex justify-between items-center border-b border-gray-100/50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-800 text-sm">AI Assistant</h2>
                            <p className="text-gray-500 text-xs font-medium">Always active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Clear Chat"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                {/* --- Chat Body --- */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth custom-scrollbar"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent' }}
                >
                    {/* Empty State / Suggestions */}
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                                <svg className="text-indigo-500" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>

                            <div className="text-center space-y-1">
                                <h3 className="text-gray-800 font-bold text-lg">
                                    Hello <span className="font-bold text-green-700">{user?.name}</span> 👋
                                </h3>
                                <p className="text-gray-500 text-sm max-w-[220px] mx-auto">
                                    Ask me anything about attendance, marks, fees, or MNMJEC info.
                                </p>
                            </div>

                            <div className="flex flex-wrap justify-center gap-2 max-w-[280px]">
                                {["My attendance", "My marks", "College info", "Help me"].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSend(suggestion)}
                                        className="text-xs bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full transition-all shadow-sm"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message List */}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"} group animate-slideUp`}
                        >
                            <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>

                                <div className={`
                  p-4 rounded-2xl shadow-sm text-sm leading-relaxed relative
                  ${msg.role === "user"
                                        ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none"
                                        : "bg-white border border-gray-100 text-gray-700 rounded-tl-none"
                                    }
                `}>
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex w-full justify-start animate-in fade-in duration-300">
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- Footer / Input --- */}
                <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
                    <div className="relative flex items-end bg-gray-50 hover:bg-white border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:bg-white rounded-[1.5rem] transition-all duration-300 shadow-sm">
                        <textarea
                            className="w-full bg-transparent px-5 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none max-h-32 custom-scrollbar"
                            placeholder="Ask me anything..."
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px'; // Auto-grow
                            }}
                            onKeyDown={handleKeyDown}
                            style={{ minHeight: "52px" }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            className={`
                mb-2 mr-2 p-2.5 rounded-full flex items-center justify-center transition-all duration-300
                ${loading || !input.trim()
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed scale-90"
                                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
                                }
              `}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            )}
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">Powered by AI</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
}