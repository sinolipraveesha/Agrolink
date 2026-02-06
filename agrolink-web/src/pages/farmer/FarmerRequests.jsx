import React, { useState, useEffect } from 'react';
import { Bell, Search, CheckCircle, Clock } from 'lucide-react';

export default function FarmerRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notifications'); // notifications, all_requests

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        try {
            // Fetch notifications for top seller matches
            const notifResponse = await fetch(`http://localhost:8080/api/notifications/${user.id}`);
            const notifications = await notifResponse.json();

            // In a real app we'd fetch actual request details from the notification.relatedId
            // For now, we'll just show the notifications as "Requests"
            setRequests(notifications);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Buyer Requests</h1>
                    <p className="text-gray-500">View and respond to custom offers from buyers</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-4">
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        My Notifications
                    </button>
                    <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Market Requests
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No new requests</h3>
                        <p className="text-gray-500 mt-2">You're all caught up! Check back later.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map((req) => (
                            <div key={req.id} className={`p-6 hover:bg-gray-50 transition-colors ${!req.isRead ? 'bg-blue-50/50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Bell className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{req.title}</h4>
                                            <p className="text-gray-600 mt-1">{req.message}</p>
                                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                                {/* Mock Response Button */}
                                                <button className="text-green-600 font-medium hover:underline">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {!req.isRead && (
                                        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
