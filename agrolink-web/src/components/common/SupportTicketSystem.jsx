import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Send, X, Clock, CheckCircle, AlertCircle, Trash, Check, CheckCheck, Pencil } from 'lucide-react';

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
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const messagesContainerRef = useRef(null);

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
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const fetchTickets = async () => {
        if (!user) return;
        try {
            setLoading(true);
            let url = isAdmin ? '/api/tickets' : `/api/tickets/user/${user.id}`;
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
            const res = await axios.get(`/api/tickets/${ticketId}/messages`);
            const fetchedMessages = res.data;
            setMessages(fetchedMessages);

            const hasUnread = fetchedMessages.some(m => m.sender?.id !== user.id && m.status !== 'READ');
            if (hasUnread) {
                await axios.put(`/api/tickets/${ticketId}/messages/read`, null, { params: { userId: user.id } });
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/tickets/create', {
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
            await axios.post(`/api/tickets/${selectedTicket.id}/messages`, {
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
            await axios.delete(`/api/tickets/messages/${messageId}?userId=${user.id}`);
            fetchMessages(selectedTicket.id);
        } catch (error) {
            console.error("Failed to delete message", error);
            alert("Failed to delete message. Admins may have already replied.");
        }
    };

    const submitEdit = async (messageId) => {
        if (!editingText.trim()) return;
        try {
            await axios.put(`/api/tickets/messages/${messageId}`, {
                userId: user.id,
                newText: editingText
            });
            setEditingMessageId(null);
            fetchMessages(selectedTicket.id);
        } catch (error) {
            console.error("Failed to edit message", error);
            alert("Failed to edit message. Admins may have already replied.");
        }
    };

    const canEditDelete = (msg, index) => {
        if (msg.sender?.id !== user.id) return false;
        const subsequentMessages = messages.slice(index + 1);
        return !subsequentMessages.some(m => m.sender?.id !== user.id);
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!confirm("Are you sure you want to completely delete this ticket? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/tickets/${ticketId}`, { params: { requesterId: user.id } });
            if (selectedTicket?.id === ticketId) setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            console.error("Failed to delete ticket", error);
            alert("Failed to delete ticket.");
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 w-full relative">
            {/* Ticket List */}
            <div className={`w-full ${selectedTicket ? 'hidden md:flex md:w-1/3' : 'flex'} bg-white rounded-xl shadow-sm border border-gray-200 flex-col h-[600px] overflow-hidden`}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl shrink-0">
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

                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 scroll-smooth">
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
                                    {isAdmin && <TicketStatusBadge status={ticket.status} />}
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
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedTicket.subject}</h3>
                            {isAdmin && <p className="text-sm text-gray-500">Ticket ID: #{selectedTicket.id.substring(0, 8)}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            {isAdmin && <TicketStatusBadge status={selectedTicket.status} />}
                            <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                            {/* Admin Actions */}
                            {isAdmin && (
                                <select
                                    className="text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-md px-2 py-1 outline-none focus:border-green-500 cursor-pointer"
                                    value={selectedTicket.status}
                                    onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        if (!confirm(`Mark ticket as ${newStatus.replace('_', ' ')}?`)) return;
                                        try {
                                            await axios.put(`/api/tickets/${selectedTicket.id}/status?status=${newStatus}&requesterId=${user.id}`);
                                            fetchTickets();
                                            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                                        } catch (err) {
                                            alert("Failed to update status. Only admins can update the status.");
                                        }
                                    }}
                                >
                                    <option value="OPEN">OPEN</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                    <option value="CLOSED">CLOSED</option>
                                </select>
                            )}
                            {(isAdmin || selectedTicket.user?.id === user.id) && (
                                <button onClick={() => handleDeleteTicket(selectedTicket.id)} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors" title="Delete Ticket">
                                    <Trash className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages */}
                    <div 
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] scroll-smooth"
                    >
                        {/* Initial Description as first message */}
                        <div className={`flex ${selectedTicket.user?.id === user.id ? 'justify-end' : 'justify-start'} group w-full`}>
                            <div className={`rounded-lg py-1.5 px-3 max-w-[85%] sm:max-w-[75%] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative ${
                                selectedTicket.user?.id === user.id 
                                ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' 
                                : 'bg-white text-[#111b21] rounded-tl-none'
                            }`}>
                                {selectedTicket.user?.id !== user.id && (
                                    <p className="text-[12px] font-medium text-[#1f7eb6] mb-0.5">{selectedTicket.user?.fullName || 'User'}</p>
                                )}
                                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{selectedTicket.description}</p>
                                <div className="flex justify-end items-center gap-1 mt-1 -mb-0.5">
                                    <p className="text-[11px] text-[#667781]">
                                        {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {messages.map((msg, index) => {
                            const isMe = msg.sender?.id === user.id;

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group w-full`}>
                                    <div className={`rounded-lg py-1.5 px-3 max-w-[85%] sm:max-w-[75%] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative ${
                                        isMe
                                        ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                                        : 'bg-white text-[#111b21] rounded-tl-none'
                                    }`}>
                                        {!isMe && (
                                            <p className="text-[12px] font-medium text-[#1f7eb6] mb-0.5">
                                                {msg.sender?.fullName || 'Support'}
                                            </p>
                                        )}
                                        {editingMessageId === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px] mt-1 mb-1">
                                                <textarea
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    className="w-full text-sm p-2 rounded border border-green-300 focus:outline-none focus:border-green-500 resize-none bg-white font-normal"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingMessageId(null)} className="text-[11px] text-gray-500 hover:text-gray-700">Cancel</button>
                                                    <button onClick={() => submitEdit(msg.id)} className="text-[11px] text-green-600 font-bold hover:text-green-700">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                                                {msg.message}
                                                {msg.edited && <span className="text-[11px] text-[#667781] italic ml-1">(edited)</span>}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5">
                                            {/* Edit/Delete buttons - only show if eligible */}
                                            {canEditDelete(msg, index) && editingMessageId !== msg.id && (
                                                <>
                                                    <button
                                                        onClick={() => { setEditingMessageId(msg.id); setEditingText(msg.message); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 flex-shrink-0"
                                                        title="Edit message"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteMessage(msg.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 flex-shrink-0"
                                                        title="Delete message"
                                                    >
                                                        <Trash className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <p className="text-[11px] text-[#667781] flex-shrink-0">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {isMe && (
                                                    <span className="flex-shrink-0 text-[#667781] ml-0.5 mt-0.5">
                                                        {msg.status === 'READ' ? (
                                                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                                        ) : msg.status === 'DELIVERED' ? (
                                                            <CheckCheck className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-100 bg-white shrink-0">
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
                <div className="hidden md:flex flex-1 h-[600px] bg-gray-50 rounded-xl border border-dashed border-gray-200 items-center justify-center flex-col text-gray-400">
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
