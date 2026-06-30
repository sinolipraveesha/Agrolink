import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ShoppingCart, Search, Filter, Leaf, Star, Crown, Check, Store, X, Truck, ShieldCheck, MapPin, User, Plus, Minus } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Marketplace() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getCartCount, addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All', 'Seeds', 'Fertilizers', 'Tools', 'Pesticides']);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest'); // 'price_asc', 'price_desc', 'stock_high', 'stock_low'
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [modalQuantity, setModalQuantity] = useState(1);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleOpenDetailModal = (product) => {
        setSelectedProduct(product);
        setModalQuantity(1);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedProduct(null);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await axios.get('/api/farmer-shop-products');

                const productsData = prodRes.data.filter(p => p.status === 'available' || p.status === 'approved');
                setProducts(productsData);

                // Extract unique categories from the loaded products
                const uniqueCategories = ['All', ...new Set(productsData.map(p => p.category).filter(Boolean))];
                setCategories(uniqueCategories);

                setLoading(false);
            } catch (error) {
                console.error("Failed to load marketplace data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = products
        .filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'stock_high') return (b.stockQuantity || 0) - (a.stockQuantity || 0);
            if (sortBy === 'stock_low') return (a.stockQuantity || 0) - (b.stockQuantity || 0);
            if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return 0;
        });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-2xl font-bold tracking-tight text-[#1a7935]">Farmers Shop</span>
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

            <div className="container mx-auto px-4 py-8">
                {/* Search and Filter */}
                {/* Search and Filter Row */}
                <div className="flex flex-col md:flex-row items-center gap-4 mb-10">
                    {/* Compact Search */}
                    <div className="relative w-full md:w-1/4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a7935] transition-all shadow-sm text-sm"
                        />
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    </div>

                    {/* Categories */}
                    <div className="flex-1 flex items-center gap-2 w-full overflow-x-auto py-1 px-1">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat
                                    ? 'bg-[#1a7935] text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 shadow-sm'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Functional Filter Dropdown */}
                    <div className="relative w-full md:w-auto">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold border text-sm transition-all shadow-sm ${isFilterOpen ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'}`}
                        >
                            <Filter className="h-4 w-4 text-[#1a7935]" />
                            Sort
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-2 border-b border-gray-50 mb-1">Sorting Options</p>
                                {[
                                    { id: 'newest', label: 'Newest First' },
                                    { id: 'price_asc', label: 'Price: Low to High' },
                                    { id: 'price_desc', label: 'Price: High to Low' },
                                    { id: 'stock_high', label: 'Stock: High to Low' },
                                    { id: 'stock_low', label: 'Stock: Low to High' }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortBy(option.id);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${sortBy === option.id ? 'bg-green-50 text-[#1a7935]' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* Overlay to close dropdown */}
                        {isFilterOpen && <div className="fixed inset-0 z-50" onClick={() => setIsFilterOpen(false)}></div>}
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935] mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading your fresh shop...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleOpenDetailModal(product)}
                                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group block cursor-pointer"
                            >
                                {/* Product Image */}
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className={`w-full h-full object-cover transform transition-transform duration-500 ${(product.stockQuantity || product.quantity || 0) <= 0 ? 'opacity-50' : 'group-hover:scale-110'}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Leaf className="h-12 w-12 opacity-50" />
                                        </div>
                                    )}

                                    {/* Availability Badge */}
                                    {(product.stockQuantity || product.quantity || 0) <= 0 && (
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                                                Out of Stock
                                            </span>
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    {product.category && (
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1a7935] shadow-sm">
                                            {product.category}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description || 'No description available'}</p>

                                    {/* Seller Rating & Badge */}
                                    {product.seller && (
                                        <div className="flex items-center space-x-2 mb-3">
                                            <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Store className="h-3 w-3 text-gray-500" />
                                            </div>
                                            <span className="text-sm text-gray-600">{product.seller?.businessName || product.seller?.fullName || 'Supplier'}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">Price</p>
                                            <p className="text-xl font-bold text-[#1a7935]">LKR {product.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-medium">Available</p>
                                            <p className={`text-sm font-semibold ${(product.stockQuantity || product.quantity || 0) <= 0 ? 'text-red-500' : 'text-gray-700'}`}>
                                                {(product.stockQuantity || product.quantity || 0) <= 0 ? 'Out of Stock' : `${product.stockQuantity || product.quantity} ${product.unit || 'Units'}`}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if ((product.stockQuantity || product.quantity || 0) > 0) {
                                                addToCart({ ...product, quantity: 1 });
                                                showToast(`${product.name} added to cart!`);
                                            }
                                        }}
                                        disabled={(product.stockQuantity || product.quantity || 0) <= 0}
                                        className={`w-full mt-4 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${(product.stockQuantity || product.quantity || 0) <= 0
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                : 'bg-[#0f2815] text-white hover:bg-[#1a7935] active:scale-[0.98]'
                                            }`}
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        {(product.stockQuantity || product.quantity || 0) <= 0 ? 'Unavailable' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">No Products Found</h3>
                        <p className="text-gray-400 mt-2">Try searching for something else.</p>
                    </div>
                )}
            </div>

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-32 right-10 z-[99999] animate-toast pointer-events-none">
                    <div className="bg-[#1a7935] text-white px-6 py-3 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center gap-3 border border-white/20 backdrop-blur-md">
                        <div className="bg-white rounded-full p-1 animate-bounce shadow-sm">
                            <Check className="h-4 w-4 text-[#1a7935] stroke-[3]" />
                        </div>
                        <p className="font-bold text-sm tracking-wide drop-shadow-sm">{toast.message}</p>
                    </div>
                </div>
            )}

            {/* Product Detail Modal */}
            {isDetailModalOpen && selectedProduct && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300"
                    onClick={handleCloseDetailModal}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">Product Details</h3>
                            <button
                                onClick={handleCloseDetailModal}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 md:p-8 overflow-y-auto flex-1">
                            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                                {/* Image Column */}
                                <div className="w-full md:w-5/12">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner group">
                                        {selectedProduct.imageUrl ? (
                                            <img
                                                src={selectedProduct.imageUrl}
                                                alt={selectedProduct.name}
                                                className={`w-full h-full object-cover transition-all duration-500 ${(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 ? 'opacity-50' : 'group-hover:scale-110'}`}
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <Leaf className="h-20 w-20 opacity-20" />
                                            </div>
                                        )}
                                        {/* Availability Badge Overlay */}
                                        {(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="bg-red-500/90 text-white px-4 py-2 rounded-lg font-black text-sm uppercase tracking-widest shadow-xl border-2 border-white/20 backdrop-blur-sm">
                                                    Out of Stock
                                                </span>
                                            </div>
                                        )}
                                        {/* Category Tag */}
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-[#1a7935] shadow-sm flex items-center gap-1.5">
                                                <Leaf className="h-3 w-3" />
                                                {selectedProduct.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Trust Badges - Desktop only inside scroll */}
                                    <div className="hidden md:grid grid-cols-3 gap-4 mt-8">
                                        <div className="text-center">
                                            <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#1a7935]">
                                                <Leaf className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">100% Organic</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#1a7935]">
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fast Delivery</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="bg-green-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#1a7935]">
                                                <ShieldCheck className="h-5 w-5" />
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Quality Check</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Column */}
                                <div className="w-full md:w-7/12 flex flex-col">
                                    <div className="mb-6">
                                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 mb-2">{selectedProduct.name}</h2>
                                        <div className="flex items-center gap-4 text-sm mb-4">
                                            <div className="flex items-center text-yellow-500">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-4 w-4 fill-yellow-400 text-yellow-400`} />
                                                ))}
                                                <span className="text-gray-400 ml-2">(12 reviews)</span>
                                            </div>
                                            <span className="text-gray-300">|</span>
                                            <div className="flex items-center text-gray-500">
                                                <MapPin className="h-3.5 w-3.5 mr-1 text-[#1a7935]" />
                                                <span className="text-xs font-semibold">Verified Supplier</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2 mb-6">
                                            <p className="text-3xl font-black text-[#1a7935]">LKR {selectedProduct.price}</p>
                                            <p className="text-sm text-gray-400 font-medium mb-1">/ {selectedProduct.unit || 'Units'}</p>
                                        </div>

                                        <p className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border mb-8 ${(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-green-50 text-green-700 border-green-100'
                                            }`}>
                                            {(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0
                                                ? 'Out of Stock'
                                                : `${selectedProduct.stockQuantity || selectedProduct.quantity} ${selectedProduct.unit || 'Units'} Available`}
                                        </p>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
                                                {selectedProduct.description || 'No description provided. This premium agricultural product ensures high yields and follows organic standards for local farming excellence.'}
                                            </p>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="pt-4 border-t border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Quantity Selection</p>
                                            <div className="flex items-center gap-4">
                                                <div className={`flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200 ${(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 ? 'opacity-50 grayscale' : ''}`}>
                                                    <button
                                                        disabled={(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 || modalQuantity <= 1}
                                                        onClick={() => setModalQuantity(prev => prev - 1)}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-500 disabled:opacity-30"
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <div className="w-12 text-center font-bold text-gray-800">{modalQuantity}</div>
                                                    <button
                                                        disabled={(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 || modalQuantity >= (selectedProduct.stockQuantity || selectedProduct.quantity)}
                                                        onClick={() => setModalQuantity(prev => prev + 1)}
                                                        className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg transition-colors text-gray-500 disabled:opacity-30"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium italic">Total: LKR {selectedProduct.price * modalQuantity}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                disabled={(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0}
                                onClick={() => {
                                    addToCart({ ...selectedProduct, quantity: modalQuantity });
                                    showToast(`${selectedProduct.name} added to cart!`);
                                    handleCloseDetailModal();
                                }}
                                className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg transform active:scale-[0.98] ${(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-[#0f2815] text-white hover:bg-[#1a7935] shadow-[#1a7935]/20 hover:shadow-[#1a7935]/40'
                                    }`}
                            >
                                <ShoppingCart className="h-5 w-5" />
                                {(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0 ? 'Unavailable' : 'Add to Cart'}
                            </button>
                            <button
                                disabled={(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0}
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login');
                                        return;
                                    }
                                    addToCart({ ...selectedProduct, quantity: modalQuantity });
                                    navigate('/checkout');
                                }}
                                className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all border-2 active:scale-[0.98] ${(selectedProduct.stockQuantity || selectedProduct.quantity || 0) <= 0
                                        ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                        : 'border-[#1a7935] text-[#1a7935] hover:bg-green-50'
                                    }`}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
