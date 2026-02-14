import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, CheckCircle, Clock } from 'lucide-react';

export default function FarmerRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('notifications'); // notifications, all_requests

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        if (!user) return;

        try {
            // Fetch notifications for top seller matches
            const notifResponse = await fetch(`/api/notifications/${user.id}`);
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

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const handleViewDetails = async (notification) => {
        if (!notification.relatedId) return;
        setDetailsLoading(true);
        try {
            const response = await fetch(`/api/requests/${notification.relatedId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedRequest(data);
            } else {
                console.error("Failed to fetch request details");
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setSelectedRequest(null);
    };

    const handleAcceptRequest = async () => {
        if (!selectedRequest || !user) return;

        try {
            const response = await fetch(`/api/requests/${selectedRequest.id}/accept/${user.id}`, {
                method: 'POST'
            });

            if (response.ok) {
                // Show success feedback
                alert('Request accepted successfully! An order has been created.');
                closeDetails();
                // Optionally refresh requests or remove the notification
            } else {
                console.error("Failed to accept request");
                alert('Failed to accept request.');
            }
        } catch (error) {
            console.error("Error accepting request:", error);
            alert('Error accepting request.');
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
                                                <button
                                                    onClick={() => handleViewDetails(req)}
                                                    className="text-green-600 font-medium hover:underline"
                                                >
                                                    {detailsLoading && selectedRequest?.id === req.relatedId ? 'Loading...' : 'View Details'}
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

            {/* Request Details Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
                            <button onClick={closeDetails} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                                <p className="text-lg font-medium text-gray-900">{selectedRequest.category}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">{selectedRequest.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</label>
                                    <p className="font-semibold text-gray-900">{selectedRequest.quantity} {selectedRequest.unit}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget</label>
                                    <p className="font-semibold text-green-600">LKR {selectedRequest.budget}</p>
                                </div>
                            </div>
                            {selectedRequest.buyer && (
                                <div className="pt-4 border-t border-gray-100 mt-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Requested By</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
                                            {selectedRequest.buyer.avatarUrl ? (
                                                <img src={selectedRequest.buyer.avatarUrl} alt={selectedRequest.buyer.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-700 font-bold">
                                                    {selectedRequest.buyer.fullName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedRequest.buyer.fullName}</p>
                                            <p className="text-xs text-gray-500">{selectedRequest.buyer.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={closeDetails} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors">
                                Close
                            </button>
                            <button
                                onClick={handleAcceptRequest}
                                className="px-5 py-2.5 bg-green-600 text-white font-medium hover:bg-green-700 rounded-xl shadow-lg shadow-green-200 transition-colors"
                            >
                                Accept Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
