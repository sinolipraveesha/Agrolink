import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Plus, Send, X, Clock, CheckCircle, AlertCircle, Trash, Check, CheckCheck, Pencil, ArrowUpDown, Zap, Lightbulb, ChevronDown, ChevronUp, ThumbsUp, BookOpen } from 'lucide-react';

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

const PriorityBadge = ({ priority }) => {
    const config = {
        URGENT: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500', label: 'URGENT' },
        HIGH:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500', label: 'HIGH' },
        MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500', label: 'MEDIUM' },
        LOW:    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500', label: 'LOW' },
    };
    const c = config[priority] || config.MEDIUM;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

export default function SupportTicketSystem({ isAdmin = false }) {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortByPriority, setSortByPriority] = useState(false);

    // Ticket Deflection (RAG suggestions)
    const [deflectionSuggestions, setDeflectionSuggestions] = useState([]);
    const [deflectionLoading, setDeflectionLoading] = useState(false);
    const [expandedSuggestion, setExpandedSuggestion] = useState(null);
    const [dismissedIds, setDismissedIds] = useState(new Set());
    const [deflected, setDeflected] = useState(false);
    const deflectionTimer = useRef(null);

    // Create Form State
    const [newTicket, setNewTicket] = useState({ subject: '', description: '' });

    // Chat State
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const messagesContainerRef = useRef(null);

    // Debounced knowledge base search
    const searchKnowledge = (subject, description) => {
        if (deflectionTimer.current) clearTimeout(deflectionTimer.current);
        const query = (subject + ' ' + description).trim();
        if (query.length < 4) {
            setDeflectionSuggestions([]);
            return;
        }
        deflectionTimer.current = setTimeout(async () => {
            setDeflectionLoading(true);
            try {
                const res = await axios.get('/api/knowledge/search', { params: { q: query, limit: 3 } });
                setDeflectionSuggestions(res.data || []);
                setDismissedIds(new Set()); // reset dismissed on new search
            } catch {
                setDeflectionSuggestions([]);
            } finally {
                setDeflectionLoading(false);
            }
        }, 500);
    };

    const handleDeflect = () => {
        setDeflected(true);
        setTimeout(() => {
            setShowCreateModal(false);
            setDeflected(false);
            setDeflectionSuggestions([]);
            setExpandedSuggestion(null);
            setDismissedIds(new Set());
            setNewTicket({ subject: '', description: '' });
        }, 1500);
    };

    const visibleSuggestions = deflectionSuggestions.filter(s => !dismissedIds.has(s.id));

    // Save-to-knowledge-base (admin)
    const [saveKbModal, setSaveKbModal] = useState(false);
    const [saveKbForm, setSaveKbForm] = useState({ question: '', answer: '', category: 'Other', keywords: '' });
    const [saveKbLoading, setSaveKbLoading] = useState(false);

    const openSaveKb = () => {
        setSaveKbForm({
            question: selectedTicket?.subject || '',
            answer: newMessage,
            category: 'Other',
            keywords: '',
        });
        setSaveKbModal(true);
    };

    const handleSaveKb = async (e) => {
        e.preventDefault();
        setSaveKbLoading(true);
        try {
            await axios.post('/api/knowledge', {
                question: saveKbForm.question,
                answer: saveKbForm.answer,
                category: saveKbForm.category,
                keywords: saveKbForm.keywords,
                sourceTicketId: selectedTicket?.id || null,
            });
            setSaveKbModal(false);
        } catch {
            alert('Failed to save to knowledge base');
        } finally {
            setSaveKbLoading(false);
        }
    };

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
                description: newTicket.description
                // priority is intentionally omitted — backend NLP will auto-assign it
            });
            setShowCreateModal(false);
            setNewTicket({ subject: '', description: '' });
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
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => setSortByPriority(p => !p)}
                                title={sortByPriority ? 'Sorting by priority (click to reset)' : 'Sort by priority'}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                    sortByPriority
                                        ? 'bg-red-50 border-red-200 text-red-600'
                                        : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                Priority
                            </button>
                        )}
                        {!isAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 scroll-smooth">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading...</div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No tickets found.</div>
                    ) : (
                        (() => {
                            const priorityRank = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 };
                            const displayTickets = sortByPriority
                                ? [...tickets].sort((a, b) =>
                                    (priorityRank[b.priority] ?? 1) - (priorityRank[a.priority] ?? 1)
                                  )
                                : tickets;
                            return displayTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                                        ticket.priority === 'URGENT' ? 'border-l-4 border-l-red-400' :
                                        ticket.priority === 'HIGH'   ? 'border-l-4 border-l-orange-400' : ''
                                    } ${selectedTicket?.id === ticket.id ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : 'bg-white border-gray-100 hover:border-green-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-1.5">
                                        <h3 className="font-bold text-gray-800 line-clamp-1 flex-1 mr-2">{ticket.subject}</h3>
                                        {isAdmin && <TicketStatusBadge status={ticket.status} />}
                                    </div>
                                    {isAdmin && (
                                        <div className="mb-1.5">
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">{ticket.description}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        {isAdmin && <span className="font-medium text-gray-600">{ticket.user?.fullName}</span>}
                                    </div>
                                </div>
                            ));
                        })()
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
                            {isAdmin && (
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-sm text-gray-500">#{selectedTicket.id.substring(0, 8)}</p>
                                    <PriorityBadge priority={selectedTicket.priority} />
                                </div>
                            )}
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
                                {isAdmin && newMessage.trim() && (
                                    <button
                                        type="button"
                                        onClick={openSaveKb}
                                        title="Save this reply to Knowledge Base"
                                        className="bg-amber-100 text-amber-700 p-3 rounded-xl hover:bg-amber-200 transition-colors border border-amber-200"
                                    >
                                        <BookOpen className="h-5 w-5" />
                                    </button>
                                )}
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

                    {/* Save-to-KB Modal */}
                    {saveKbModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                                <div className="p-5 border-b border-gray-100 bg-amber-50 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-amber-600" />
                                        <h3 className="font-bold text-gray-800">Save to Knowledge Base</h3>
                                    </div>
                                    <button onClick={() => setSaveKbModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                                </div>
                                <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700">
                                    This reply will be saved as an admin-verified knowledge entry and used for future ticket deflection suggestions.
                                </div>
                                <form onSubmit={handleSaveKb} className="p-5 space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Question / Trigger phrase</label>
                                        <input
                                            required
                                            value={saveKbForm.question}
                                            onChange={e => setSaveKbForm(p => ({ ...p, question: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Answer (authoritative)</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={saveKbForm.answer}
                                            onChange={e => setSaveKbForm(p => ({ ...p, answer: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                                            <select
                                                value={saveKbForm.category}
                                                onChange={e => setSaveKbForm(p => ({ ...p, category: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none"
                                            >
                                                {['Orders','Payments','Products','Account','Delivery','Other'].map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords</label>
                                            <input
                                                value={saveKbForm.keywords}
                                                onChange={e => setSaveKbForm(p => ({ ...p, keywords: e.target.value }))}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 outline-none"
                                                placeholder="space separated"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">Source ticket: <span className="font-mono">{selectedTicket?.id}</span></p>
                                    <div className="flex gap-3 pt-1">
                                        <button type="button" onClick={() => setSaveKbModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saveKbLoading}
                                            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-60"
                                        >
                                            <BookOpen className="h-4 w-4" />
                                            {saveKbLoading ? 'Saving...' : 'Save to KB'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
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
                            <button onClick={() => {
                                setShowCreateModal(false);
                                setDeflectionSuggestions([]);
                                setExpandedSuggestion(null);
                                setDismissedIds(new Set());
                                setNewTicket({ subject: '', description: '' });
                            }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Deflected success state */}
                        {deflected ? (
                            <div className="p-10 flex flex-col items-center gap-3 text-center">
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                                    <ThumbsUp className="h-7 w-7 text-green-600" />
                                </div>
                                <p className="font-bold text-gray-800">Great! Glad that helped.</p>
                                <p className="text-sm text-gray-500">No ticket was created.</p>
                            </div>
                        ) : (
                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={newTicket.subject}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setNewTicket(prev => ({ ...prev, subject: val }));
                                        searchKnowledge(val, newTicket.description);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="Brief summary of issue"
                                />
                            </div>

                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
                                <Zap className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                                <span>Priority is assigned automatically based on your message content using sentiment analysis.</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newTicket.description}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setNewTicket(prev => ({ ...prev, description: val }));
                                        searchKnowledge(newTicket.subject, val);
                                    }}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
                                    placeholder="Describe your issue in detail..."
                                />
                            </div>

                            {/* RAG Suggestion Panel */}
                            {(deflectionLoading || visibleSuggestions.length > 0) && (
                                <div className="border border-amber-200 rounded-xl bg-amber-50 overflow-hidden">
                                    <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200 bg-amber-100">
                                        <Lightbulb className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                        <span className="text-xs font-semibold text-amber-800">
                                            {deflectionLoading ? 'Searching for answers...' : `${visibleSuggestions.length} suggestion${visibleSuggestions.length !== 1 ? 's' : ''} found`}
                                        </span>
                                    </div>
                                    {deflectionLoading && (
                                        <div className="px-3 py-3 flex gap-1.5">
                                            {[0,1,2].map(i => (
                                                <div key={i} className="h-2 bg-amber-200 rounded animate-pulse flex-1" style={{animationDelay: `${i * 150}ms`}} />
                                            ))}
                                        </div>
                                    )}
                                    {visibleSuggestions.map(s => (
                                        <div key={s.id} className="border-t border-amber-200 first:border-t-0">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedSuggestion(expandedSuggestion === s.id ? null : s.id)}
                                                className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-amber-100 transition-colors"
                                            >
                                                <span className="flex-1 text-xs font-medium text-gray-800 leading-relaxed">{s.question}</span>
                                                <span className="flex-shrink-0 mt-0.5 text-amber-600">
                                                    {expandedSuggestion === s.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                                </span>
                                            </button>
                                            {expandedSuggestion === s.id && (
                                                <div className="px-3 pb-3 space-y-2">
                                                    <p className="text-xs text-gray-600 leading-relaxed bg-white rounded-lg p-2.5 border border-amber-100">{s.answer}</p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleDeflect}
                                                            className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <ThumbsUp className="h-3 w-3" />
                                                            Yes, this helped!
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDismissedIds(prev => new Set([...prev, s.id]))}
                                                            className="px-3 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                >
                                    {visibleSuggestions.length > 0 ? 'Submit Ticket Anyway' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
