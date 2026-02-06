import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, User, Search, Menu, X, ChevronDown } from 'lucide-react';
import MarketplaceSection from '../../components/marketplace/MarketplaceSection';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
// Note: Ideally Navigation should be a reusable component. 
// For now, I'll keep it simple or minimal.
// I will render a simple header and the marketplace section.

export default function Marketplace() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getCartCount } = useCart();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Header */}
            <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-2xl font-bold tracking-tight text-[#1a7935]">AgroLink Marketplace</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div
                            onClick={() => navigate('/cart')}
                            className="relative cursor-pointer hover:text-[#1a7935] transition-colors"
                        >
                            <ShoppingCart className="h-6 w-6 text-gray-600" />
                            {getCartCount() > 0 && (
                                <span className="absolute -top-1 -right-2 bg-[#db1c1c] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {getCartCount()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-6">
                <MarketplaceSection />
            </div>
        </div>
    );
}
