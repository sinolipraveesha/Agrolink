import React, { useState, useEffect } from 'react';
import { Search, Filter, Leaf, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import { useCart } from '../../context/CartContext';

const MarketplaceSection = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    axios.get('/api/products?categoryType=MARKETPLACE'),
                    axios.get('/api/categories?type=MARKETPLACE')
                ]);
                setProducts(prodRes.data);
                setCategories(['All', ...catRes.data.map(c => c.name)]);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load marketplace data", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || (product.category && product.category.name === selectedCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <section id="marketplace" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-[#1a7935] mb-4">වෙළඳපොළ</h2>
                    <div className="w-24 h-1.5 bg-[#b0db3d] mx-auto rounded-full"></div>
                    <p className="text-gray-500 mt-4">නැවුම්, ගුණාත්මක නිෂ්පාදන අඩුම මිලට</p>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 gap-4">

                    {/* Search */}
                    <div className="relative w-full md:w-1/2">
                        <input
                            type="text"
                            placeholder="නිෂ්පාදන සොයන්න..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a7935] focus:border-transparent transition-all"
                        />
                        <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    </div>

                    {/* Category Filter */}
                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        <div className="flex gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                        ? 'bg-[#1a7935] text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-green-50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935] mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading Products...</p>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <Link to={`/product/${product.id}`} key={product.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 group block">
                                {/* Product Image */}
                                <div className="relative h-48 overflow-hidden bg-gray-100">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Leaf className="h-12 w-12 opacity-50" />
                                        </div>
                                    )}
                                    {/* Category Badge */}
                                    {product.category && (
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#1a7935] shadow-sm">
                                            {product.category.name}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description || 'No description available'}</p>

                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium">මිල (කිලෝ 1)</p>
                                            <p className="text-xl font-bold text-[#1a7935]">රු. {product.price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 font-medium">ඉතිරි ප්‍රමාණය</p>
                                            <p className="text-sm font-semibold text-gray-700">{product.quantity} {product.unit}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            addToCart({ ...product, quantity: 1 });
                                            alert("Added to cart!");
                                        }}
                                        className="w-full mt-4 bg-[#0f2815] text-white py-2.5 rounded-xl font-bold hover:bg-[#1a7935] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Add to Cart
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">නිෂ්පාදන සොයාගත නොහැක</h3>
                        <p className="text-gray-400 mt-2">කරුණාකර වෙනත් නමකින් සොයන්න හෝ පසුව උත්සාහ කරන්න.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default MarketplaceSection;
