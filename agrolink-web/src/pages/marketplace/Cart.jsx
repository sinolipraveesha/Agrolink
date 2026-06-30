import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft, AlertCircle, Check } from 'lucide-react';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [toast, setToast] = React.useState(null);

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1a7935]">
                        <ShoppingBag className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Cart is Empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't added any fresh produce yet.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-[#1a7935] text-white py-3 rounded-xl font-bold hover:bg-[#145d29] transition-colors"
                    >
                        Start Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4">
            <div className="container mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <ShoppingBag className="h-8 w-8 text-[#1a7935]" />
                    Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                                {/* Image */}
                                <div className="h-24 w-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                    )}
                                </div>

                                 {/* Details */}
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                                    <p className="text-sm text-[#1a7935] font-medium">Rs. {item.price} / {item.unit}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Available: {item.stockQuantity} {item.unit}s</p>
                                </div>

                                {/* Quantity */}
                                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="px-3 py-1 text-gray-500 hover:text-[#1a7935] font-bold disabled:opacity-30"
                                        disabled={item.quantity <= 1}
                                    >-</button>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val)) {
                                                if (val > item.stockQuantity) {
                                                    showToast(`Cannot exceed available stock (${item.stockQuantity})`, 'error');
                                                }
                                                updateQuantity(item.id, val);
                                            }
                                        }}
                                        className="w-12 text-center bg-transparent text-sm font-bold text-gray-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="px-3 py-1 text-gray-500 hover:text-[#1a7935] font-bold disabled:opacity-30"
                                        disabled={item.quantity >= item.stockQuantity}
                                    >+</button>
                                </div>

                                {/* Subtotal & Remove */}
                                <div className="text-right min-w-[80px]">
                                    <p className="font-bold text-gray-900 mb-1">Rs. {item.price * item.quantity}</p>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-400 hover:text-red-600 p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center text-gray-500 hover:text-[#1a7935] font-medium"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Continue Shopping
                            </button>

                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to clear your cart?')) {
                                        clearCart();
                                    }
                                }}
                                className="text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>Rs. {getCartTotal()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span className="text-[#1a7935] font-bold">Free</span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>Rs. {getCartTotal()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (!user) {
                                        alert("Please login to proceed to checkout.");
                                        navigate('/login');
                                    } else {
                                        navigate('/checkout');
                                    }
                                }}
                                className="w-full bg-[#1a7935] text-white py-4 rounded-xl font-bold hover:bg-[#145d29] transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/10"
                            >
                                Proceed to Checkout
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-32 right-10 z-[99999] animate-toast pointer-events-none">
                    <div className={`${toast.type === 'error' ? 'bg-red-600' : 'bg-[#1a7935]'} text-white px-6 py-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-white/20 backdrop-blur-md`}>
                        <div className="bg-white rounded-full p-1 animate-bounce shadow-sm">
                            {toast.type === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-red-600 stroke-[3]" />
                            ) : (
                                <Check className="h-4 w-4 text-[#1a7935] stroke-[3]" />
                            )}
                        </div>
                        <p className="font-bold text-sm tracking-wide drop-shadow-sm">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
