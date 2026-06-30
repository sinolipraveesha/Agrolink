import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Send, FileText, CheckCircle, XCircle } from 'lucide-react';
import PayHereCheckout from '../../components/payment/PayHereCheckout';

const OfferMessage = ({ msg, isMe, onAccept }) => {
    const [offer, setOffer] = useState(null);

    useEffect(() => {
        if (msg.relatedOfferId) {
            fetch(`/api/chat/offers/${msg.relatedOfferId}`)
                .then(res => res.json())
                .then(data => setOffer(data))
                .catch(err => console.error("Error fetching offer details", err));
        }
    }, [msg.relatedOfferId]);

    const isPending = offer?.status === 'PENDING';

    return (
        <div className="flex flex-col items-center my-4">
            <div className={`bg-gradient-to-r from-green-50 to-blue-50 border ${isPending ? 'border-green-200' : 'border-gray-300 opacity-80'} rounded-2xl p-6 w-full max-w-md shadow-sm`}>
                <div className="flex items-center gap-3 mb-4 border-b border-green-100 pb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Custom Offer</h3>
                        <p className="text-xs text-gray-500">Proposed by {msg.sender?.fullName}</p>
                    </div>
                </div>

                {offer ? (
                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Description:</span>
                            <span className="text-gray-800 font-medium text-right max-w-[60%]">{offer.offerMetadata}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Delivery Time:</span>
                            <span className="text-gray-800 font-bold">{offer.deliveryTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm bg-white p-3 rounded-xl border border-green-100">
                            <span className="text-gray-500 font-medium">Total Price:</span>
                            <span className="text-green-700 font-black text-lg">Rs. {offer.totalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                            <span className="text-gray-500 font-medium">Status:</span>
                            <span className={`font-bold uppercase text-xs px-2 py-1 rounded-md ${isPending ? 'bg-yellow-100 text-yellow-700' : (offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                                {offer.status}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    </div>
                )}
                
                {(!isMe) && offer && isPending && ( // Only the recipient can accept/decline
                    <div className="flex gap-3 mt-4 pt-4 border-t border-green-100">
                        <button 
                            onClick={async () => {
                                const updatedOffer = await onAccept(msg.relatedOfferId);
                                if (updatedOffer) setOffer(updatedOffer);
                            }}
                            className="flex-1 bg-green-600 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700"
                        >
                            <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                        <button 
                            onClick={async () => {
                                const updatedOffer = await onDecline(msg.relatedOfferId);
                                if (updatedOffer) setOffer(updatedOffer);
                            }}
                            className="flex-1 bg-red-50 text-red-600 font-medium py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100"
                        >
                            <XCircle className="w-4 h-4" /> Decline
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ChatApp() {
    const { conversationId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [stompClient, setStompClient] = useState(null);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerDetails, setOfferDetails] = useState({ price: '', delivery: '', description: '' });
    const [conversation, setConversation] = useState(null);
    const [paymentProps, setPaymentProps] = useState(null);
    const messagesEndRef = useRef(null);

    const markAsRead = async () => {
        if (!conversationId || !user) return;
        try {
            await fetch(`/api/chat/conversations/${conversationId}/read?userId=${user.id}`, { method: 'POST' });
        } catch (e) {
            console.error("Failed to mark as read", e);
        }
    };

    // Fetch message history and conversation details on load
    useEffect(() => {
        if (!conversationId || !user) return;
        
        fetch(`/api/chat/conversations/${conversationId}`)
            .then(res => res.json())
            .then(data => setConversation(data))
            .catch(err => console.error("Failed to fetch conversation", err));

        fetch(`/api/chat/conversations/${conversationId}/messages`)
            .then(res => res.json())
            .then(data => {
                setMessages(data);
                if (data.some(m => !m.read && m.sender?.id !== user.id)) {
                    markAsRead();
                }
            })
            .catch(err => console.error("Failed to fetch messages", err));

        // Setup WebSocket with relative URL so Vite proxies it correctly (supports HTTPS/Mobile)
        const socket = new SockJS('/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log('Connected to Chat WS');
                client.subscribe(`/topic/conversation.${conversationId}`, message => {
                    const parsedMsg = JSON.parse(message.body);
                    if (parsedMsg.type === 'READ_RECEIPT') {
                        setMessages(prev => prev.map(m => 
                            (m.sender?.id !== parsedMsg.senderId) ? { ...m, read: true } : m
                        ));
                    } else {
                        setMessages(prev => [...prev, parsedMsg]);
                        if (parsedMsg.sender?.id !== user.id && parsedMsg.type !== 'SYSTEM') {
                            markAsRead();
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker error', frame.headers['message']);
            }
        });

        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, [conversationId, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const payload = {
            conversationId,
            senderId: user.id,
            content: newMessage,
            type: 'TEXT'
        };

        try {
            setNewMessage('');
            
            await fetch(`/api/chat/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("Error sending", err);
            alert("Failed to send message: " + err.message);
        }
    };

    const handleCreateOffer = async (e) => {
        e.preventDefault();
        
        if (!conversation) {
            alert("Conversation details not loaded yet.");
            return;
        }

        // Determine who is the buyer based on conversation roles
        let buyerId;
        if (conversation.farmer.id === user.id) {
            buyerId = conversation.buyer.id;
        } else {
            buyerId = conversation.farmer.id; // technically the offer should go to the buyer, but handles both directions
        }
        
        const payload = {
            conversationId,
            sellerId: user.id,
            buyerId: buyerId,
            price: Number(offerDetails.price),
            deliveryTime: offerDetails.delivery,
            metadata: offerDetails.description
        };

        try {
            const res = await fetch('/api/chat/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                setShowOfferModal(false);
                setOfferDetails({ price: '', delivery: '', description: '' });
            }
        } catch(error) {
            console.error("Error creating offer", error);
        }
    };

    const handleAcceptOffer = async (offerId) => {
        try {
            const res = await fetch(`/api/chat/offers/${offerId}/accept`, { method: 'POST' });
            if (res.ok) {
                const updatedOffer = await res.json();
                
                setPaymentProps({
                    orderId: updatedOffer.relatedOrderId,
                    amount: updatedOffer.totalPrice,
                    items: "Negotiated Custom Offer",
                    customerDetails: {
                        first_name: user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Buyer",
                        last_name: user?.user_metadata?.full_name?.split(' ')[1] || "Guest",
                        email: user?.email || "buyer@agrolink.lk", 
                        phone: user?.phone || "0771234567", 
                        address: "Agrolink Marketplace",
                        city: "Colombo"
                    }
                });
                return updatedOffer;
            }
        } catch (error) {
            console.error('Accept error', error);
        }
        return null;
    };

    const handleDeclineOffer = async (offerId) => {
        if (!confirm('Are you sure you want to decline this offer?')) return null;
        try {
            const res = await fetch(`/api/chat/offers/${offerId}/decline`, { method: 'POST' });
            if (res.ok) {
                return await res.json();
            }
        } catch (error) {
            console.error('Decline error', error);
        }
        return null;
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
            <div className="bg-white shadow-sm rounded-t-2xl p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Negotiation Chat</h2>
                    {conversation?.request && (
                        <p className="text-sm text-gray-500">Request: {conversation.request.category} - {conversation.request.quantity} {conversation.request.unit}</p>
                    )}
                </div>
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded">
                    Back
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2]">
                {messages.map((msg, i) => {
                    const isMe = msg.sender?.id === user?.id;
                    const isSystem = msg.type === 'SYSTEM';

                    if (msg.type === 'OFFER') {
                        return <OfferMessage key={i} msg={msg} isMe={isMe} onAccept={handleAcceptOffer} onDecline={handleDeclineOffer} />;
                    }

                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative`}>
                            <div className={`max-w-[75%] px-3 py-2 rounded-lg shadow-sm relative ${
                                isMe 
                                    ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-none' 
                                    : 'bg-white text-gray-900 rounded-tl-none border border-gray-100'
                            }`}>
                                {/* WhatsApp tail */}
                                <div className={`absolute top-0 w-3 h-3 ${
                                    isMe 
                                        ? '-right-[10px] bg-[#dcf8c6]' 
                                        : '-left-[10px] bg-white'
                                }`} style={{
                                    clipPath: isMe ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 0 0, 100% 100%)'
                                }}></div>

                                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 -mb-1 float-right clear-both ml-4">
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                        <svg viewBox="0 0 16 15" width="16" height="15" className={`${msg.read ? 'text-[#53bdeb]' : 'text-gray-400'} fill-current`}>
                                            <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-b-2xl border-t flex gap-3">
                {conversation?.farmer?.id === user?.id && (
                    <button 
                        type="button"
                        onClick={() => setShowOfferModal(true)}
                        className="bg-blue-100 text-blue-700 p-3 rounded-xl hover:bg-blue-200 flex items-center justify-center font-bold px-4 whitespace-nowrap"
                        title="Create Offer"
                    >
                        + Offer
                    </button>
                )}
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button 
                    type="button" // Use a normal button with onClick to guarantee execution
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>

            {/* Offer Modal */}
            {showOfferModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Create Custom Offer</h3>
                        <form onSubmit={handleCreateOffer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Total Price (LKR)</label>
                                <input type="number" required value={offerDetails.price} onChange={e => setOfferDetails({...offerDetails, price: e.target.value})} className="mt-1 w-full border rounded-lg p-3 bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Delivery Time</label>
                                <input type="text" placeholder="e.g. 3 Days" required value={offerDetails.delivery} onChange={e => setOfferDetails({...offerDetails, delivery: e.target.value})} className="mt-1 w-full border rounded-lg p-3 bg-gray-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Description / Scope</label>
                                <textarea required value={offerDetails.description} onChange={e => setOfferDetails({...offerDetails, description: e.target.value})} className="mt-1 w-full border rounded-lg p-3 bg-gray-50 h-24"></textarea>
                            </div>
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setShowOfferModal(false)} className="px-5 py-2 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Send Offer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {paymentProps && (
                <PayHereCheckout 
                    {...paymentProps} 
                    onDismiss={() => setPaymentProps(null)} 
                />
            )}
        </div>
    );
}
