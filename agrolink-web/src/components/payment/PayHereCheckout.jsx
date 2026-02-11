import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const PayHereCheckout = ({ orderId, amount, items, customerDetails, onDismiss }) => {
    const formRef = useRef(null);
    const [hash, setHash] = useState(null);
    const [merchantId, setMerchantId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [amountFormatted, setAmountFormatted] = useState(null);

    useEffect(() => {
        const fetchHash = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/payment/hash/${orderId}`);
                const data = response.data;
                setHash(data.hash);
                setMerchantId(data.merchant_id);
                setAmountFormatted(data.amount); // Store backend formatted amount
                setLoading(false);
            } catch (err) {
                console.error("Error fetching payment hash:", err);
                setError("Failed to initialize payment. Please try again.");
                setLoading(false);
            }
        };

        if (orderId) {
            fetchHash();
        }
    }, [orderId]);

    useEffect(() => {
        if (hash && merchantId && formRef.current) {
            // Auto-submit the form once hash is ready
            formRef.current.submit();
        }
    }, [hash, merchantId]);

    if (error) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                    <h3 className="text-red-600 font-bold text-lg mb-2">Payment Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={onDismiss}
                        className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-[#1a7935] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-900 font-medium">Redirecting to PayHere...</p>
                    <p className="text-sm text-gray-500 mt-2">Please do not close this window</p>
                </div>
            </div>
        );
    }

    return (
        <form
            ref={formRef}
            method="post"
            action="https://sandbox.payhere.lk/pay/checkout"
            className="hidden"
        >
            <input type="hidden" name="merchant_id" value={merchantId} />
            <input type="hidden" name="return_url" value="http://localhost:5173/profile" />
            <input type="hidden" name="cancel_url" value="http://localhost:5173/checkout" />
            <input type="hidden" name="notify_url" value="http://localhost:8080/api/payment/notify" />

            <input type="hidden" name="order_id" value={orderId} />
            <input type="hidden" name="items" value={items} />
            <input type="hidden" name="currency" value="LKR" />
            <input type="hidden" name="amount" value={amountFormatted || amount} />

            <input type="hidden" name="first_name" value={customerDetails.first_name} />
            <input type="hidden" name="last_name" value={customerDetails.last_name} />
            <input type="hidden" name="email" value={customerDetails.email} />
            <input type="hidden" name="phone" value={customerDetails.phone} />
            <input type="hidden" name="address" value={customerDetails.address} />
            <input type="hidden" name="city" value={customerDetails.city} />
            <input type="hidden" name="country" value="Sri Lanka" />

            <input type="hidden" name="hash" value={hash} />
        </form>
    );
};

export default PayHereCheckout;
