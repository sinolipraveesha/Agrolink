import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                // Map backend data to frontend structure
                const mapped = data.map(o => ({
                    id: o.id,
                    customer: o.buyer ? o.buyer.fullName : 'Unknown',
                    items: o.items ? o.items.map(i => `${i.product.name} x${i.quantity}`).join(', ') : 'No Items',
                    total: o.totalAmount,
                    status: o.status,
                    date: new Date(o.createdAt).toLocaleDateString(),
                    issue: ''
                }));
                setOrders(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const [filter, setFilter] = useState('all');

    const handleStatusChange = (id, newStatus) => {
        // Optimistic update
        setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    };

    const handleFarmerAccept = async (id) => {
        try {
            const res = await fetch(`/api/orders/${id}/farmer-accept`, {
                method: 'PUT'
            });
            if (res.ok) {
                handleStatusChange(id, 'accepted');
                alert("Order Accepted! Visible to nearby drivers.");
            } else {
                alert("Failed to accept order");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    if (loading) return <div className="p-10 text-center">Loading Orders...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Order Management / ඇණවුම් කළමනාකරණය</h1>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Order ID, Customer..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-[#1a7935] focus:border-[#1a7935]"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#1a7935]"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Ready for Driver</option>
                        <option value="ready_to_ship">Driver Assigned</option>
                        <option value="shipped">Shipped</option>
                        <option value="disputed">Disputed</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Rs)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-xs">{order.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{order.customer}</td>
                                <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{order.items}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800">{order.total}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'disputed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {order.status === 'accepted' ? 'Waiting for Driver' : order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => handleFarmerAccept(order.id)}
                                            className="ml-2 text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
                                        >
                                            Accept Order
                                        </button>
                                    )}
                                    {order.status === 'accepted' && (
                                        <span className="text-xs text-gray-400 italic">Waiting for Driver...</span>
                                    )}
                                    <button className="text-gray-400 hover:text-gray-600 ml-2">Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
