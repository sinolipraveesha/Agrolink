import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

import { useGeolocation } from '../../hooks/useGeolocation';

import PayHereCheckout from '../../components/payment/PayHereCheckout';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Sri Lanka',
    });

    const { location: gpsLocation, error: gpsError, loading: gpsLoading } = useGeolocation(true); // Auto-detect location
    const [paymentOrder, setPaymentOrder] = useState(null); // State to trigger PayHere

    const totalAmount = getCartTotal();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const { user } = useAuth(); // Assuming useAuth is imported at top.

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("Please login to place an order.");
            navigate('/login');
            return;
        }

        // Check required fields
        if (!formData.first_name || !formData.email || !formData.phone || !formData.address || !formData.city) {
            alert("Please fill in all required fields.");
            return;
        }

        const confirmPay = window.confirm(`Proceed to pay Rs. ${totalAmount} via PayHere?`);
        if (!confirmPay) return;

        if (!gpsLocation) {
            const proceedWithoutLoc = window.confirm("⚠️ Location not detected yet! The driver won't be able to find you on the map. \n\nProceed anyway?");
            if (!proceedWithoutLoc) return;
        }

        try {
            console.log("Submitting Order Payload:", {
                buyerId: user.id,
                deliveryAddress: `${formData.address}, ${formData.city}, Sri Lanka`,
                deliveryLatitude: gpsLocation?.lat,
                deliveryLongitude: gpsLocation?.lng
            });

            const payload = {
                buyerId: user.id,
                deliveryAddress: `${formData.address}, ${formData.city}, Sri Lanka`,
                deliveryLatitude: gpsLocation?.lat, // Send GPS Lat
                deliveryLongitude: gpsLocation?.lng, // Send GPS Lng
                contactNumber: formData.phone,
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity
                }))
            };

            const response = await axios.post('http://localhost:8080/api/orders/checkout', payload);

            if (response.status === 200) {
                // Instead of clearing cart immediately, we launch Payment.
                // Note: Real-world app might optimize status to "PENDING_PAYMENT"
                const createdOrders = response.data; // This is a List<Order>

                if (createdOrders && createdOrders.length > 0) {
                    const orderId = createdOrders[0].id;

                    setPaymentOrder({
                        orderId: orderId,
                        amount: totalAmount, // Note: Backend re-calculates amount per order!
                        items: cart.map(item => item.name).join(", "),
                        customerDetails: formData
                    });

                    // Clear cart locally as order is created in DB (waiting for payment)
                    clearCart();
                } else {
                    alert("Order created but no details returned. Please check profile.");
                    navigate('/');
                }
            }
        } catch (error) {
            console.error("Order placement failed", error);
            alert("Failed to place order. Please try again.");
        }
    };

    React.useEffect(() => {
        if (cart.length === 0 && !paymentOrder) { // Only redirect if not paying
            navigate('/cart');
        }
    }, [cart, navigate, paymentOrder]);

    if (cart.length === 0 && !paymentOrder) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4">
            <div className="container mx-auto max-w-4xl">
                <button
                    onClick={() => navigate('/cart')}
                    className="mb-8 flex items-center text-gray-500 hover:text-[#1a7935] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-[#1a7935]" />
                    Checkout
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Billing Details */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center">
                            Billing Details
                            {gpsLocation ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Location Detected
                                </span>
                            ) : gpsLoading ? (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <svg className="animate-spin h-3 w-3 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Detecting...
                                </span>
                            ) : (
                                <div className="flex flex-col items-end">
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 mb-1">
                                        ⚠️ {gpsError || "Location Failed"}
                                    </span>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-[10px] text-blue-600 underline hover:text-blue-800"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </h3>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text" name="first_name" required value={formData.first_name} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text" name="last_name" required value={formData.last_name} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email" name="email" required value={formData.email} onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text" name="address" required value={formData.address} onChange={handleChange}
                                    placeholder="Street address"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text" name="city" required value={formData.city} onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-[#1a7935] focus:border-[#1a7935]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text" name="country" value="Sri Lanka" readOnly
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="hidden"
                                id="pay-submit-btn"
                            >
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Order</h3>
                            <div className="max-h-60 overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span className="text-gray-600">{item.name} x {item.quantity}</span>
                                        <span className="font-medium text-gray-900">Rs. {item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-3 space-y-2 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs. {totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span className="text-[#1a7935] font-bold">Free</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between text-xl font-bold text-[#1a7935]">
                                    <span>Total</span>
                                    <span>Rs. {totalAmount}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => document.getElementById('pay-submit-btn').click()}
                                className="w-full bg-[#1a7935] text-white py-4 rounded-xl font-bold hover:bg-[#145d29] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/10"
                            >
                                <CreditCard className="h-5 w-5" />
                                Pay with PayHere
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                                <ShieldCheck className="h-3 w-3" />
                                Secure Payment Gateway
                            </div>
                        </div>
                    </div>
                </div>

                {/* Render PayHere Checkout Overlay Component when payment is initiated */}
                {paymentOrder && (
                    <PayHereCheckout
                        {...paymentOrder}
                        onDismiss={() => setPaymentOrder(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Checkout;
