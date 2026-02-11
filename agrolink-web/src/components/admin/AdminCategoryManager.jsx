import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Save, Image as ImageIcon, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminCategoryManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ name: '', imageUrl: '', type: 'FARMERS_SHOP' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/categories');
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            // Use a specific bucket for categories or shared product-images
            // Let's use 'product-images' for simplicity as per plan
            const fileExt = file.name.split('.').pop();
            const fileName = `category_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, imageUrl: data.publicUrl });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image!');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await axios.put(`http://localhost:8080/api/categories/${editingCategory.id}`, formData);
            } else {
                await axios.post('http://localhost:8080/api/categories', formData);
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving category:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await axios.delete(`http://localhost:8080/api/categories/${id}`);
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ name: category.name, imageUrl: category.imageUrl, type: category.type || 'FARMERS_SHOP' });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', imageUrl: '', type: 'FARMERS_SHOP' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', imageUrl: '', type: 'FARMERS_SHOP' });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Categories</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#1a7935] text-white rounded-lg hover:bg-[#145e29]"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Category</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden">
                                {category.imageUrl ? (
                                    <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <ImageIcon className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <span className="font-medium text-gray-700">{category.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${category.type === 'MARKETPLACE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-[#1a7935]'}`}>
                                {category.type === 'MARKETPLACE' ? 'Market' : 'Shop'}
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleOpenModal(category)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(category.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7935]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7935]"
                                >
                                    <option value="FARMERS_SHOP">Farmers Shop</option>
                                    <option value="MARKETPLACE">Marketplace</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Image</label>
                                <div className="flex items-center space-x-4">
                                    {formData.imageUrl && (
                                        <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                            <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <label className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <div className="text-center">
                                                {uploading ? (
                                                    <span className="text-sm text-gray-500">Uploading...</span>
                                                ) : (
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Upload className="h-4 w-4" />
                                                        <span className="text-sm">Click to upload image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full bg-[#1a7935] text-white py-2 rounded-lg hover:bg-[#145e29] flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingCategory ? 'Update' : 'Create'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
