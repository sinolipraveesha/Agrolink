import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { DollarSign, ShoppingBag, Truck, TrendingUp, Loader2, CheckCircle, XCircle, Star, User } from 'lucide-react';

export default function FarmerDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        earnings: 0,
        pending: 0,
        shipped: 0
    });
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                try {
                    // Fetch Orders
                    const ordersRes = await axios.get(`http://localhost:8080/api/orders?farmerId=${user.id}`);
                    const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                    setOrders(ordersData);

                    // Calc stats
                    const pendingCount = ordersData.filter(o => o.status === 'pending').length;
                    const earnings = ordersData
                        .filter(o => o.status === 'delivered')
                        .reduce((acc, curr) => acc + curr.totalAmount, 0);

                    setStats({
                        earnings,
                        pending: pendingCount,
                        shipped: ordersData.filter(o => ['shipping', 'delivered'].includes(o.status)).length
                    });

                    // Fetch Reviews
                    const reviewsRes = await axios.get(`http://localhost:8080/api/reviews/profile/${user.id}`);
                    const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
                    setReviews(reviewsData);

                    if (reviewsData.length > 0) {
                        const total = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                        setAverageRating(total / reviewsData.length);
                    }

                } catch (error) {
                    console.error("Failed to load farmer data", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    const handleAcceptOrder = async (orderId) => {
        try {
            await axios.put(`http://localhost:8080/api/orders/${orderId}/farmer-accept`);
            alert("Order Accepted! Assigning to logistics...");
            // Refresh orders
            const res = await axios.get(`http://localhost:8080/api/orders?farmerId=${user.id}`);
            setOrders(res.data);
        } catch (error) {
            console.error("Failed to accept order", error);
            alert("Failed to accept order");
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-[#1a7935]" /></div>;

    const statCards = [
        { label: 'Total Earnings', value: `Rs. ${stats.earnings}`, icon: DollarSign, color: 'bg-green-500' },
        { label: 'Pending Orders', value: stats.pending, icon: ShoppingBag, color: 'bg-orange-500' },
        { label: 'Active Shipments', value: stats.shipped, icon: Truck, color: 'bg-blue-500' },
        { label: 'Market Trend', value: '+15%', icon: TrendingUp, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Farmer!</h1>
                    <p className="text-gray-500">Here is your daily activity overview</p>
                </div>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* Client Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Customer Reputation</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    />
                                ))}
                            </div>
                            <span className="font-bold text-gray-700">{averageRating.toFixed(1)} / 5.0</span>
                            <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
                        </div>
                    </div>
                </div>

                {reviews.length === 0 ? (
                    <p className="text-gray-500 italic">No reviews yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reviews.slice(0, 6).map((review) => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                                        {review.reviewer?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-xs font-bold text-gray-500">{review.reviewer?.email?.split('@')[0] || 'Anonymous'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.color} bg-opacity-10 text-${stat.color.split('-')[1]}-600`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Orders Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Recent Orders / නව ඇණවුම්</h3>
                </div>

                {orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p>No active orders at the moment.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-sm">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Order ID</th>
                                    <th className="px-6 py-4 font-medium">Buyer</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Items</th>
                                    <th className="px-6 py-4 font-medium">Total</th>
                                    <th className="px-6 py-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Array.isArray(orders) && orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">#{order.id.substring(0, 8)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                            <div>{order.buyer ? order.buyer.getFullName || order.buyer.email : 'Unknown'}</div>
                                            <div className="text-xs text-gray-400">{order.deliveryAddress}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border capitalize ${order.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                order.status === 'accepted' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.items?.length || 0} Items
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[#1a7935]">Rs. {order.totalAmount}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="text-[#1a7935] hover:underline text-sm font-bold"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Order Details</h3>
                                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Buyer Info */}
                            <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                                <div className="bg-white p-2 rounded-full h-fit text-[#1a7935]">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#1a7935] uppercase tracking-wide mb-1">Delivery To</p>
                                    <p className="font-bold text-gray-800">{selectedOrder.buyer?.getFullName || selectedOrder.buyer?.email || 'Unknown Buyer'}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress}</p>
                                    <p className="text-sm text-gray-600">{selectedOrder.contactNumber}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="font-bold text-gray-800 mb-4">Pack These Items:</h4>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                            {/* Product Img Placeholder */}
                                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                                {item.product?.imageUrl ?
                                                    <img src={item.product.imageUrl} className="w-full h-full object-cover" alt="" />
                                                    : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800">{item.product?.name || item.customItemName}</p>
                                                <p className="text-sm text-gray-500">Unit Price: Rs. {item.priceAtTime}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-[#1a7935]">x{item.quantity}</p>
                                                <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {item.product?.unit || 'Units'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <span className="text-gray-500">Total Order Value</span>
                                <span className="text-2xl font-bold text-[#1a7935]">Rs. {selectedOrder.totalAmount}</span>
                            </div>

                            {/* Actions */}
                            {selectedOrder.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            handleAcceptOrder(selectedOrder.id);
                                            setSelectedOrder(null);
                                        }}
                                        className="flex-1 bg-[#1a7935] text-white py-3 rounded-xl font-bold hover:bg-[#145d29] flex justify-center items-center gap-2 shadow-lg shadow-green-900/10"
                                    >
                                        <CheckCircle className="h-5 w-5" /> Accept Order
                                    </button>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="flex-1 bg-white text-red-500 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-50"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
