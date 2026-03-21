import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User } from 'lucide-react';

export default function Chatbot({ isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! I am your AI Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare conversation history for LM Studio (OpenAI format)
            const openaiMessages = [
                { role: "system", content: "You are a helpful AI assistant for the AgroLink platform." }
            ];

            const rawHistory = messages.filter((m, idx) => !(idx === 0 && m.sender === 'bot'));
            rawHistory.push(userMessage);

            for (const msg of rawHistory) {
                openaiMessages.push({
                    role: msg.sender === 'bot' ? 'assistant' : 'user',
                    content: msg.text
                });
            }

            const response = await fetch('http://localhost:1234/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: openaiMessages,
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("LM Studio API Error details:", errorData);
                throw new Error(errorData.error?.message || 'Network response was not ok. Is LM Studio running on port 1234?');
            }

            const data = await response.json();
            const botReply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

            setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
        } catch (error) {
            console.error('Error communicating with Gemini API:', error);
            setMessages((prev) => [...prev, {
                sender: 'bot',
                text: `Error: ${error.message}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[6000]">
            {/* Chat Window */}
            <div className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 h-[500px] flex flex-col border border-gray-100 overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-[#1a7935] text-white p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center space-x-2">
                        <Bot className="h-6 w-6 text-[#b0db3d]" />
                        <h3 className="font-bold text-lg">AI Assistant</h3>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col space-y-3">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-end space-x-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-[#b0db3d] text-[#1a7935]' : 'bg-[#1a7935] text-white'}`}>
                                    {msg.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={`p-3 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-[#1a7935] text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-2 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a7935] focus:border-transparent text-sm text-gray-800"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-[#1a7935] hover:bg-[#145d29] text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
