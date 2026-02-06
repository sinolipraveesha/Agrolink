import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Edit2, Trash2, Calendar, DollarSign, Package, AlertCircle, X } from 'lucide-react';

export default function MyRequests() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentRequest, setCurrentRequest] = useState(null);
    const [editForm, setEditForm] = useState({
        category: '',
        description: '',
        budget: '',
        quantity: '',
        unit: ''
    });

    const categories = ['Vegetables', 'Fruits', 'Grains', 'Spices', 'Other'];
    const units = ['kg', 'g', 'items', 'bundles'];

    useEffect(() => {
        if (user) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/requests/buyer/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                // Sort by date descending
                setRequests(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this request?')) return;

        setDeleteLoading(id);
        try {
            const response = await fetch(`http://localhost:8080/api/requests/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setRequests(requests.filter(req => req.id !== id));
            } else {
                alert('Failed to delete request');
            }
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('Error deleting request');
        } finally {
            setDeleteLoading(null);
        }
    };

    const openEditModal = (request) => {
        setCurrentRequest(request);
        setEditForm({
            category: request.category,
            description: request.description,
            budget: request.budget,
            quantity: request.quantity,
            unit: request.unit
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8080/api/requests/${currentRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...editForm,
                    buyer: { id: user.id },
                    budget: parseFloat(editForm.budget),
                    quantity: parseInt(editForm.quantity)
                }),
            });

            if (response.ok) {
                const updatedRequest = await response.json();
                setRequests(requests.map(req => req.id === updatedRequest.id ? updatedRequest : req));
                setIsEditModalOpen(false);
                alert('Request updated successfully!');
            } else {
                alert('Failed to update request');
            }
        } catch (error) {
            console.error('Error updating request:', error);
            alert('Error updating request');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Marketplace
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">My Requests</h1>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-xl text-gray-500">No active requests found.</p>
                        <button
                            onClick={() => navigate('/post-request')}
                            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                        >
                            Post a Request
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {requests.map((request) => (
                            <div key={request.id} className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {request.status}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-1" />
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{request.category}</h3>
                                    <p className="text-gray-600 mb-4">{request.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                            <Package className="w-4 h-4 mr-2 text-green-600" />
                                            <span className="font-medium">{request.quantity} {request.unit}</span>
                                        </div>
                                        <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
                                            <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                                            <span className="font-medium">Budget: LKR {request.budget}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <button
                                        onClick={() => openEditModal(request)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors w-full md:w-auto flex justify-center"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(request.id)}
                                        disabled={deleteLoading === request.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full md:w-auto flex justify-center"
                                        title="Delete"
                                    >
                                        {deleteLoading === request.id ? (
                                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Request</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
                                        value={editForm.quantity}
                                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
                                        value={editForm.unit}
                                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                    >
                                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Budget (LKR)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
                                    value={editForm.budget}
                                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-green-500"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                            >
                                Update Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
