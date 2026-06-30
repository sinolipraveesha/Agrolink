import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, MapPin, XCircle, Check, Star } from 'lucide-react';
import ReviewModal from '../../components/common/ReviewModal';

const MyOrders = () => {
    const { user } = useAuth();
    const location = useLocation();
    const isEmbedded = location.pathname.includes('/farmer/') || location.pathname.includes('/driver/') || location.pathname.includes('/supplier/');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // all, ongoing, completed, cancelled

    useEffect(() => {
        if (user) {
            console.log("Fetching all orders for user:", user.id);
            Promise.all([
                axios.get(`/api/orders?buyerId=${user.id}`).catch(() => ({ data: [] })),
                axios.get(`/api/farmershop-orders?buyerId=${user.id}`).catch(() => ({ data: [] }))
            ])
                .then(([regularRes, shopRes]) => {
                    const regularOrders = Array.isArray(regularRes.data) ? regularRes.data.map(o => ({ ...o, isShopOrder: false })) : [];
                    const shopOrders = Array.isArray(shopRes.data) ? shopRes.data.map(o => ({ ...o, isShopOrder: true })) : [];

                    console.log(`🔍 DIAGNOSTIC: Found ${regularOrders.length} Regular Orders and ${shopOrders.length} Shop Orders`);

                    const allOrders = [...regularOrders, ...shopOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

                    console.log("Merged orders:", allOrders);
                    setOrders(allOrders);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch orders", err);
                    setLoading(false);
                });
        } else {
            console.log("User not logged in yet");
        }
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'packing': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ready_to_ship': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'shipped':
            case 'dispatched': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'accepted': return <CheckCircle className="h-4 w-4" />;
            case 'packing': return <Package className="h-4 w-4" />;
            case 'ready_to_ship': return <Package className="h-4 w-4" />;
            case 'shipped':
            case 'dispatched': return <Truck className="h-4 w-4" />;
            case 'delivered': return <CheckCircle className="h-4 w-4" />;
            case 'cancelled': return <XCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const [reviewConfig, setReviewConfig] = useState(null);

    const openReviewModal = (orderId, revieweeId, name, productId = null, shopProductId = null) => {
        setReviewConfig({
            orderId,
            revieweeId,
            revieweeName: name,
            productId,
            shopProductId,
            reviewerId: user.id
        });
    };

    const closeReviewModal = () => {
        setReviewConfig(null);
    };

    const handleReviewSuccess = () => {
        // Optionally refresh orders or show success message
        closeReviewModal();
    };

    if (loading) return (
        <div className={`${isEmbedded ? '' : 'min-h-screen'} flex justify-center items-center ${isEmbedded ? 'py-20' : 'bg-gray-50'}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935]"></div>
        </div>
    );

    const tabs = [
        { id: 'all', label: 'All Orders' },
        { id: 'ongoing', label: 'Ongoing' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'all') return true;
        if (activeTab === 'ongoing') {
            return ['pending', 'accepted', 'packing', 'ready_to_ship', 'shipped', 'dispatched'].includes(order.status);
        }
        if (activeTab === 'completed') return order.status === 'delivered';
        if (activeTab === 'cancelled') return order.status === 'cancelled';
        return true;
    });

    return (
        <div className={`${isEmbedded ? '' : 'min-h-screen bg-gray-50 py-20 px-4'}`}>
            <div className={`container mx-auto ${isEmbedded ? '' : 'max-w-5xl'}`}>
                {/* Tab Filter UI */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white p-1.5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-white shadow-lg border border-gray-100 text-[#1a7935] scale-[1.05]'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl shadow-sm text-center border border-gray-100">
                        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No orders yet</h3>
                        <p className="text-gray-400 mt-2">Start shopping to see your orders here.</p>
                        <a href="/" className="inline-block mt-6 px-6 py-2 bg-[#1a7935] text-white rounded-lg font-bold hover:bg-[#145d29] transition-colors">
                            Go to Marketplace
                        </a>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative group"
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4 border-b border-gray-50 pb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 font-medium">Order ID: <span className="font-mono text-gray-700">#{order.id?.substring(0, 8)}</span></p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{order.createdAt && new Date(order.createdAt).toLocaleDateString()} at {order.createdAt && new Date(order.createdAt).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 w-fit uppercase tracking-wider ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            <span>{order.status?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {order.items?.slice(0, 2).map(item => ( // Show only first 2 items in preview
                                        <div key={item.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                                            <div className="h-16 w-16 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                {item.product?.imageUrl ? (
                                                    <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 text-sm">{item.product?.name || item.customItemName || 'Custom Item'}</h4>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#1a7935] text-sm">Rs. {item.priceAtTime * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {order.items?.length > 2 && (
                                        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">+{order.items.length - 2} more items</p>
                                    )}

                                    {/* Waiting for Driver Preview */}
                                    {order.status === 'accepted' && (
                                        <div className="flex justify-end pt-1">
                                            <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-yellow-100 uppercase tracking-tighter">
                                                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse focus-within:animate-none"></div>
                                                Waiting for Driver...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/80 px-3 py-2 rounded-lg border border-gray-100">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="truncate max-w-[200px]">{order.deliveryAddress || 'No address provided'}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 w-full md:w-auto">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                            <span className="text-xl font-black text-[#1a7935]">Rs. {order.totalAmount}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#1a7935] group-hover:underline flex items-center gap-1 transition-all">
                                            Click to View Full Details &rarr;
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="relative">
                                <div className="absolute left-0 top-4 w-full h-1 bg-gray-100 z-0 -translate-y-1/2"></div>
                                <div className={`absolute left-0 top-4 h-1 bg-green-500 z-0 -translate-y-1/2 transition-all duration-1000`}
                                    style={{
                                        width: (selectedOrder.isShopOrder ?
                                            ['pending', 'packing', 'dispatched', 'delivered'].indexOf(selectedOrder.status) * 33.3 :
                                            ['pending', 'accepted', 'ready_to_ship', 'shipped', 'delivered'].indexOf(selectedOrder.status) * 25) + '%'
                                    }}
                                ></div>
                                <div className="relative z-10 flex justify-between">
                                    {(selectedOrder.isShopOrder ?
                                        ['Placed', 'Packing', 'Dispatched', 'Delivered'] :
                                        ['Placed', 'Accepted', 'Driver', 'Shipped', 'Delivered']
                                    ).map((step, idx) => {
                                        const stepsArray = selectedOrder.isShopOrder ?
                                            ['pending', 'packing', 'dispatched', 'delivered'] :
                                            ['pending', 'accepted', 'ready_to_ship', 'shipped', 'delivered'];

                                        const currentStepIdx = stepsArray.indexOf(selectedOrder.status);
                                        const isActive = idx <= currentStepIdx;
                                        return (
                                            <div key={step} className="flex flex-col items-center gap-2 px-2 relative z-10">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-500 ${isActive ? 'border-green-500 text-green-600 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-gray-200 text-gray-300'}`}>
                                                    {isActive ? <CheckCircle className="h-4 w-4" /> : <div className="w-2 h-2 bg-gray-200 rounded-full"></div>}
                                                </div>
                                                <span className={`text-xs font-bold ${isActive ? 'text-green-700' : 'text-gray-300'}`}>{step}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Driver Info Section (Only for Regular Orders) */}
                            {!selectedOrder.isShopOrder && ['ready_to_ship', 'shipped', 'delivered'].includes(selectedOrder.status) && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                            <Truck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Logistics Partner</p>
                                            <p className="font-bold text-gray-800">{selectedOrder.driver?.fullName || 'Assigned Driver'}</p>
                                            <p className="text-sm text-gray-600">Vehicle: {selectedOrder.driver?.vehicleNumber || 'Standard Delivery'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">

                                        {selectedOrder.status !== 'delivered' && (
                                            <a
                                                href={`/track?jobId=${selectedOrder.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                            >
                                                <MapPin className="h-4 w-4" /> Track Live
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Seller Status (For Shop Orders) */}
                            {selectedOrder.isShopOrder && ['packing', 'dispatched'].includes(selectedOrder.status) && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                            {selectedOrder.status === 'packing' ? <Package className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                                                {selectedOrder.status === 'packing' ? 'Seller is preparing your order' : 'Order is on the way!'}
                                            </p>
                                            <p className="font-bold text-gray-800">Farmer Shop Item</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Waiting for Driver Banner */}
                            {selectedOrder.status === 'accepted' && (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center gap-4">
                                    <div className="animate-pulse bg-yellow-400 w-3 h-3 rounded-full"></div>
                                    <div>
                                        <p className="font-bold text-yellow-800">Waiting for Driver</p>
                                        <p className="text-sm text-yellow-600">Your order is ready! Searching for nearby drivers...</p>
                                    </div>
                                </div>
                            )}

                            {/* Seller Info (For Review) */}
                            {(selectedOrder.status === 'delivered' || selectedOrder.status === 'shipped') && selectedOrder.farmer && (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-green-600 uppercase tracking-wide">Seller</p>
                                            <p className="font-bold text-gray-800">{selectedOrder.farmer.fullName || 'Farmer'}</p>
                                            <p className="text-sm text-gray-600">From Agrolink Network</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openReviewModal(selectedOrder.id, selectedOrder.farmer.id, selectedOrder.farmer.fullName || 'Farmer')}
                                        className="bg-white text-green-600 border border-green-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-50 shadow-sm transition-colors"
                                    >
                                        Review Seller
                                    </button>
                                </div>
                            )}

                            {/* Items List */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4">Ordered Items</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map(item => (
                                        <div key={item.id} className="flex gap-4 items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                                            <div className="h-16 w-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.product?.imageUrl ?
                                                    <img src={item.product.imageUrl} className="w-full h-full object-cover" />
                                                    : <div className="flex h-full items-center justify-center text-gray-300"><Package /></div>
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{item.product?.name || item.customItemName || 'Custom Item'}</h4>
                                                <p className="text-sm text-gray-500">Unit Price: Rs. {item.priceAtTime}</p>
                                                {selectedOrder.status === 'delivered' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openReviewModal(
                                                                selectedOrder.id,
                                                                null,
                                                                item.product?.name || 'Product',
                                                                !selectedOrder.isShopOrder ? item.product?.id : null,
                                                                selectedOrder.isShopOrder ? item.product?.id || item.shopProductId : null
                                                            );
                                                        }}
                                                        className="mt-2 text-[10px] font-bold text-[#1a7935] hover:underline flex items-center gap-1"
                                                    >
                                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                        Review this product
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg text-[#1a7935]">x{item.quantity}</p>
                                                <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {item.product?.unit}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span>Rs. {selectedOrder.totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Delivery Fee</span>
                                    <span>Rs. 0.00 (Free)</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg text-gray-800">
                                    <span>Total Paid</span>
                                    <span className="text-[#1a7935]">Rs. {selectedOrder.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reviewConfig && (
                <ReviewModal
                    isOpen={!!reviewConfig}
                    onClose={closeReviewModal}
                    revieweeName={reviewConfig.revieweeName}
                    orderId={reviewConfig.orderId}
                    revieweeId={reviewConfig.revieweeId}
                    productId={reviewConfig.productId}
                    shopProductId={reviewConfig.shopProductId}
                    reviewerId={reviewConfig.reviewerId}
                    onReviewSuccess={handleReviewSuccess}
                />
            )}
        </div>
    );
};

export default MyOrders;
