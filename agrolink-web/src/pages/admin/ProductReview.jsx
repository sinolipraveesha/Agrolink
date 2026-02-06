import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Check, X, Tag } from 'lucide-react';

export default function ProductReview() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingProducts = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/products/pending');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingProducts();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this product?`)) return;
        try {
            await axios.put(`http://localhost:8080/api/products/${id}/status?status=${status}`);
            setProducts(products.filter(p => p.id !== id));
        } catch (err) {
            alert("Error updating product");
        }
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#1a7935]" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Product Quality Control / අස්වැන්න පරීක්ෂාව</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500">No pending products to review.</p>
                    </div>
                ) : (
                    products.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-48 bg-gray-100 relative">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                )}
                                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold">
                                    Pending
                                </div>
                            </div>
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                                    <span className="text-[#1a7935] font-bold">Rs. {product.price}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <Tag className="h-4 w-4 mr-1" />
                                    {product.category ? product.category.name : 'Unknown Category'}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Qty: {product.quantity} {product.unit} <br />
                                    Farmer ID: {product.farmerId && product.farmerId.substring(0, 8)}...
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-2">
                                <button
                                    onClick={() => handleStatusUpdate(product.id, 'approved')}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center"
                                >
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(product.id, 'rejected')}
                                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center justify-center"
                                >
                                    <X className="h-4 w-4 mr-1" /> Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
