import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Send, X, Clock, CheckCircle, AlertCircle, Trash } from 'lucide-react';

const TicketStatusBadge = ({ status }) => {
    const colors = {
        OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
        IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
        RESOLVED: 'bg-green-100 text-green-700 border-green-200',
        CLOSED: 'bg-gray-100 text-gray-700 border-gray-200'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.OPEN}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

export default function SupportTicketSystem({ isAdmin = false }) {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form State
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'MEDIUM' });

    // Chat State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
    }, [user, isAdmin]);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket.id);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => {
                fetchMessages(selectedTicket.id);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedTicket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        if (!user) return;
        try {
            setLoading(true);
            let url = isAdmin ? 'http://localhost:8080/api/tickets' : `http://localhost:8080/api/tickets/user/${user.id}`;
            const res = await axios.get(url);
            // Ensure we always set an array
            setTickets(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
            setTickets([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (ticketId) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/tickets/${ticketId}/messages`);
            setMessages(res.data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/api/tickets/create', {
                userId: user.id,
                subject: newTicket.subject,
                description: newTicket.description,
                priority: newTicket.priority
            });
            setShowCreateModal(false);
            setNewTicket({ subject: '', description: '', priority: 'MEDIUM' });
            fetchTickets();
        } catch (error) {
            console.error("Failed to create ticket", error);
            alert("Failed to create ticket");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await axios.post(`http://localhost:8080/api/tickets/${selectedTicket.id}/messages`, {
                senderId: user.id,
                message: newMessage
            });
            setNewMessage('');
            fetchMessages(selectedTicket.id);
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!confirm("Are you sure you want to delete this message?")) return;
        try {
            await axios.delete(`http://localhost:8080/api/tickets/messages/${messageId}?userId=${user.id}`);
            fetchMessages(selectedTicket.id);
        } catch (error) {
            console.error("Failed to delete message", error);
            alert("Failed to delete message. You can only delete your own messages.");
        }
    };

    const resolveTicket = async () => {
        if (!confirm("Are you sure you want to mark this ticket as RESOLVED?")) return;
        try {
            await axios.put(`http://localhost:8080/api/tickets/${selectedTicket.id}/status?status=RESOLVED`);
            fetchTickets();
            setSelectedTicket(prev => ({ ...prev, status: 'RESOLVED' }));
        } catch (error) {
            console.error("Failed to resolve ticket", error);
        }
    }

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Ticket List */}
            <div className={`w-full ${selectedTicket ? 'hidden md:block md:w-1/3' : ''} bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                        Support Tickets
                    </h2>
                    {!isAdmin && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No tickets found.</div>
                    ) : (
                        tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedTicket?.id === ticket.id ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : 'bg-white border-gray-100 hover:border-green-100'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 line-clamp-1">{ticket.subject}</h3>
                                    <TicketStatusBadge status={ticket.status} />
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    {isAdmin && <span className="font-medium text-gray-600">{ticket.user?.fullName}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {selectedTicket ? (
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedTicket.subject}</h3>
                            <p className="text-sm text-gray-500">Ticket ID: #{selectedTicket.id.substring(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <TicketStatusBadge status={selectedTicket.status} />
                            <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                            {/* Admin Actions */}
                            {isAdmin && selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                                <button onPress={resolveTicket} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 hover:bg-green-200">
                                    Mark Resolved
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {/* Initial Description as first message */}
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none py-3 px-4 max-w-[80%] shadow-sm">
                                <p className="text-xs font-bold text-gray-500 mb-1">{selectedTicket.user?.fullName} (User)</p>
                                <p className="text-gray-800">{selectedTicket.description}</p>
                                <p className="text-[10px] text-gray-400 mt-1 text-right">{new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        {messages.map((msg) => {
                            const isMe = msg.sender?.id === user.id;
                            const isSupport = !isMe && (isAdmin ? msg.sender?.id !== selectedTicket.user?.id : true); // Logic isn't perfect for generic chat, usually check role

                            // Better logic:
                            // If I am user, messages from me are right. Messages from others (admin) are left.
                            // If I am admin, messages from me are right. Messages from user are left.

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                    <div className={`rounded-2xl py-3 px-4 max-w-[80%] shadow-sm relative ${isMe
                                        ? 'bg-green-600 text-white rounded-tr-none'
                                        : 'bg-white border border-gray-200 rounded-tl-none'
                                        }`}>
                                        {!isMe && (
                                            <p className="text-xs font-bold text-gray-500 mb-1">
                                                {msg.sender?.fullName || 'Support'}
                                            </p>
                                        )}
                                        <p className={`${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.message}</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-[10px] mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {/* Delete button - only show for own messages */}
                                            {isMe && (
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-700 rounded"
                                                    title="Delete message"
                                                >
                                                    <Trash className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white">
                        {selectedTicket.status === 'CLOSED' ? (
                            <div className="text-center text-gray-500 bg-gray-100 p-3 rounded-lg">
                                This ticket is closed. You cannot reply.
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-200 items-center justify-center flex-col text-gray-400">
                    <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                    <p>Select a ticket to view conversation</p>
                </div>
            )}

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-lg">Create Support Ticket</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={newTicket.subject}
                                    onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="Brief summary of issue"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={newTicket.priority}
                                        onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newTicket.description}
                                    onChange={e => setNewTicket({ ...newTicket, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
                                    placeholder="Describe your issue in detail..."
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
