import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, Filter, ShoppingBag, Truck, CheckCircle, 
    Clock, Package, MapPin, XCircle, ChevronRight, 
    Calendar, Phone, User, Check
} from 'lucide-react';

export default function SupplierOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest'
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (selectedOrder) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedOrder]);

    const fetchOrders = async () => {
        if (!user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/api/farmershop-orders?sellerId=${user.id}`);
            const sortedOrders = (res.data || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setOrders(sortedOrders);
        } catch (error) {
            console.error("Failed to fetch supplier orders", error);
            setError("Could not load your sales. Please check if the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchOrders();
        }
    }, [user?.id]);

    const handleStatusUpdate = async (e, orderId, newStatus) => {
        if (e) e.stopPropagation(); // Prevent modal from opening
        
        if (newStatus === 'cancelled' && !window.confirm("Are you sure you want to cancel this order?")) {
            return;
        }

        try {
            await axios.put(`/api/farmershop-orders/${orderId}/status?status=${newStatus}`);
            // Update local state for the list
            const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
            setOrders(updatedOrders);
            
            // Update selected order if modal is open
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'packing': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'dispatched': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        packing: orders.filter(o => o.status === 'packing').length,
        dispatched: orders.filter(o => o.status === 'dispatched').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    const statusCards = [
        { id: 'all', label: 'All Orders', count: statusCounts.all, icon: ShoppingBag, color: 'bg-gray-500', lightColor: 'bg-gray-50', textColor: 'text-gray-600' },
        { id: 'pending', label: 'New Orders', count: statusCounts.pending, icon: Clock, color: 'bg-yellow-500', lightColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
        { id: 'packing', label: 'To Pack', count: statusCounts.packing, icon: Package, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-700' },
        { id: 'dispatched', label: 'Shipped', count: statusCounts.dispatched, icon: Truck, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700' },
        { id: 'delivered', label: 'Delivered', count: statusCounts.delivered, icon: CheckCircle, color: 'bg-green-500', lightColor: 'bg-green-50', textColor: 'text-green-700' },
        { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled, icon: XCircle, color: 'bg-red-500', lightColor: 'bg-red-50', textColor: 'text-red-700' },
    ];

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'all' || (order.status && order.status.toLowerCase() === filter.toLowerCase());
        const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (order.buyer?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    }).sort((a, b) => {
        if (sortBy === 'newest') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        } else {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        }
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935]"></div>
            </div>
        );
    }

    return (
        <div className="pb-10">
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-fade-in">
                    <XCircle className="h-5 w-5" />
                    <p className="text-sm font-bold">{error}</p>
                    <button onClick={() => fetchOrders()} className="ml-auto text-xs bg-red-100 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors">Retry</button>
                </div>
            )}
            <div className="space-y-6 animate-fade-in relative z-0">

                {/* Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statusCards.map((card) => {
                        const Icon = card.icon;
                        const isActive = filter === card.id;
                        return (
                            <button
                                key={card.id}
                                onClick={() => setFilter(card.id)}
                                className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group ${
                                    isActive 
                                    ? `border-transparent shadow-lg scale-[1.02] ring-2 ring-offset-2 ${card.color.replace('bg-', 'ring-')}` 
                                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-md'
                                }`}
                            >
                                {/* Decorative background circle */}
                                <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${card.color}`}></div>
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : `${card.lightColor} ${card.textColor}`}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xl font-black ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                        {card.count}
                                    </span>
                                </div>
                                
                                <div className="relative z-10">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                                        {card.label}
                                    </p>
                                    <p className={`text-sm font-black mt-0.5 ${isActive ? 'text-white' : card.textColor}`}>
                                        {isActive ? 'Active View' : 'View Orders'}
                                    </p>
                                </div>

                                {/* Active background overlay */}
                                {isActive && (
                                    <div className={`absolute inset-0 z-0 ${card.color}`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID, Customer Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 w-full border border-gray-100 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a7935]/20 focus:border-[#1a7935] transition-all"
                        />
                    </div>
                    {/* Custom Sort Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-[#1a7935]/30 hover:shadow-sm transition-all group"
                        >
                            <Filter className={`h-4 w-4 transition-colors ${isSortDropdownOpen ? 'text-[#1a7935]' : 'text-gray-400 group-hover:text-[#1a7935]'}`} />
                            <span className="text-sm font-bold text-gray-600">
                                {sortBy === 'newest' ? 'Newest First' : 'Oldest First'}
                            </span>
                        </button>

                        {isSortDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsSortDropdownOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setSortBy('newest');
                                            setIsSortDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50 ${sortBy === 'newest' ? 'text-[#1a7935]' : 'text-gray-600'}`}
                                    >
                                        Newest First
                                        {sortBy === 'newest' && <Check className="h-4 w-4" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortBy('oldest');
                                            setIsSortDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-gray-50 ${sortBy === 'oldest' ? 'text-[#1a7935]' : 'text-gray-600'}`}
                                    >
                                        Oldest First
                                        {sortBy === 'oldest' && <Check className="h-4 w-4" />}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-gray-300">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-500">No orders found</h3>
                        <p className="text-gray-400">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {filteredOrders.map((order) => (
                            <div 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 border-b border-gray-50 pb-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded-md ${getStatusStyle(order.status).split(' ')[0]} bg-opacity-10 text-xs`}>
                                                    <Package className="h-3 w-3" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 tracking-wider font-mono">ORDER #{order.id?.substring(0, 8).toUpperCase()}</span>
                                                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                            <div className="flex items-center gap-4 text-sm mt-1">
                                                <span className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="font-black text-[#1a7935] text-lg">
                                                    Rs. {order.totalAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border ${getStatusStyle(order.status)} uppercase tracking-widest shadow-sm`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 group-hover:bg-[#1a7935]/5 transition-colors duration-300">
                                        <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                            <div className="relative">
                                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-[#1a7935] text-lg font-black border border-gray-200 shadow-sm group-hover:border-[#1a7935]/30 transition-all">
                                                    {order.buyer?.fullName?.[0] || 'U'}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                    <CheckCircle className="h-2 w-2 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800">{order.buyer?.fullName || 'Anonymous Buyer'}</p>
                                                <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                                    <ShoppingBag className="h-3 w-3" />
                                                    {order.items?.length || 0} Products Ordered
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            {['pending', 'packing'].includes(order.status) && (
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(e, order.id, 'cancelled')}
                                                    className="flex-1 sm:flex-none text-red-500 hover:bg-red-50 p-2.5 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                                    title="Cancel Order"
                                                >
                                                    <XCircle className="h-5 w-5" />
                                                </button>
                                            )}
                                            {order.status === 'pending' && (
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(e, order.id, 'packing')}
                                                    className="flex-1 sm:flex-none bg-[#1a7935] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#145d29] shadow-lg shadow-green-500/10 active:scale-95 transition-all"
                                                >
                                                    Accept Order
                                                </button>
                                            )}
                                            {order.status === 'packing' && (
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(e, order.id, 'dispatched')}
                                                    className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 shadow-lg shadow-blue-500/10 transition-all"
                                                >
                                                    Dispatch Items
                                                </button>
                                            )}
                                            {order.status === 'dispatched' && (
                                                <button 
                                                    onClick={(e) => handleStatusUpdate(e, order.id, 'delivered')}
                                                    className="flex-1 sm:flex-none bg-[#1a7935] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#145d29] shadow-lg shadow-green-500/10 transition-all"
                                                >
                                                    Complete Delivery
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal - Moved out of the animated container to fix backdrop coverage and blur */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative z-10" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1 uppercase">ID: {selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                                <XCircle className="h-7 w-7" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            {/* Visual Timeline */}
                            <div className="px-4">
                                <div className="relative pt-2 pb-4">
                                    <div className="absolute left-0 top-[1.5rem] w-full h-1 bg-gray-100 z-0 -translate-y-1/2"></div>
                                    <div 
                                        className="absolute left-0 top-[1.5rem] h-1 bg-green-500 z-0 -translate-y-1/2 transition-all duration-700"
                                        style={{ width: `${['pending', 'packing', 'dispatched', 'delivered'].indexOf(selectedOrder.status) * 33.3}%` }}
                                    ></div>
                                    <div className="relative z-10 flex justify-between">
                                        {['pending', 'packing', 'dispatched', 'delivered'].map((step, idx) => {
                                            const stepNames = ['Placed', 'Packing', 'Shipped', 'Complete'];
                                            const currentIdx = ['pending', 'packing', 'dispatched', 'delivered'].indexOf(selectedOrder.status);
                                            const isActive = idx <= currentIdx;
                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-500 ${isActive ? 'border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-gray-200 text-gray-300'}`}>
                                                        {isActive ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-green-600' : 'text-gray-300'}`}>{stepNames[idx]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Section: Customer & Delivery */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <User className="h-3.5 w-3.5" /> Customer Info
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="font-bold text-gray-900">{selectedOrder.buyer?.fullName}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                            <Phone className="h-3.5 w-3.5" />
                                            {selectedOrder.contactNumber || 'No contact provided'}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" /> Delivery Address
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedOrder.deliveryAddress}"</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Items Table */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Summary</h3>
                                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={item.id} className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-gray-50' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                    {item.product?.imageUrl ? (
                                                        <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <Package className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{item.product?.name || item.customItemName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Price per unit: Rs. {item.priceAtTime}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-[#1a7935]">Qty: {item.quantity}</p>
                                                <p className="font-bold text-gray-900">Rs. {item.priceAtTime * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-[#1a7935]/5 p-4 flex justify-between items-center border-t border-[#1a7935]/10">
                                        <span className="font-bold text-gray-700">Total Revenue</span>
                                        <span className="text-2xl font-black text-[#1a7935]">Rs. {selectedOrder.totalAmount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                            {selectedOrder.status === 'pending' && (
                                <button 
                                    onClick={(e) => handleStatusUpdate(null, selectedOrder.id, 'packing')}
                                    className="flex-1 bg-[#1a7935] text-white py-3 rounded-xl font-bold hover:bg-[#145d29] shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
                                >
                                    Confirm Order & Start Packing
                                </button>
                            )}
                            {selectedOrder.status === 'packing' && (
                                <button 
                                    onClick={(e) => handleStatusUpdate(null, selectedOrder.id, 'dispatched')}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                                >
                                    Mark as Shipped
                                </button>
                            )}
                            {selectedOrder.status === 'dispatched' && (
                                <button 
                                    onClick={(e) => handleStatusUpdate(null, selectedOrder.id, 'delivered')}
                                    className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                                >
                                    Confirm Final Delivery
                                </button>
                            )}
                            {['pending', 'packing'].includes(selectedOrder.status) && (
                                <button 
                                    onClick={(e) => handleStatusUpdate(null, selectedOrder.id, 'cancelled')}
                                    className="px-6 border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
