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
                const response = await axios.get(`/api/payment/hash/${orderId}`);
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

    const handlePayHereSubmit = () => {
        if (formRef.current) {
            formRef.current.submit();
        }
    };

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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 border-4 border-[#1a7935] border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Initializing Payment</h3>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Redirecting you to the secure PayHere sandbox gateway...
                    </p>

                    {/* Choice Buttons */}
                    <div className="pt-6 border-t border-gray-100 flex flex-col gap-3">
                        <button
                            onClick={handlePayHereSubmit}
                            className="w-full py-3 bg-[#1a7935] text-white rounded-xl font-bold text-sm hover:bg-[#145d29] transition-all shadow-md"
                        >
                            Proceed to Pay (Sandbox)
                        </button>

                        <button
                            onClick={() => {
                                // Simulate successful payment redirect for testing
                                window.location.href = `${window.location.origin}/my-orders?payment=mock_success&orderId=${orderId}`;
                            }}
                            className="w-full py-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all border border-blue-100"
                        >
                            DEBUG: Mock Success (Phone Test)
                        </button>

                        <button
                            onClick={onDismiss}
                            className="w-full py-2 text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
                        >
                            Cancel and Go Back
                        </button>
                    </div>
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
            <input type="hidden" name="return_url" value={`${window.location.origin}/my-orders`} />
            <input type="hidden" name="cancel_url" value={`${window.location.origin}/checkout`} />
            {/* Note: Notify URL won't work on localhost/local network without a publictunnel like Ngrok */}
            <input type="hidden" name="notify_url" value="/api/payment/notify" />

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
