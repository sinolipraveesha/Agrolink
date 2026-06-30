import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('agrolink-cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('agrolink-cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.id === product.id);
            const stockLimit = product.stockQuantity || Infinity; // Get stock limit
            
            if (existing) {
                const newQuantity = Math.min(existing.quantity + (product.quantity || 1), stockLimit);
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            }
            
            const initialQuantity = Math.min(product.quantity || 1, stockLimit);
            return [...prevCart, { ...product, quantity: initialQuantity }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, newQuantity) => {
        setCart(prevCart =>
            prevCart.map(item => {
                if (item.id === productId) {
                    const stockLimit = item.stockQuantity || Infinity;
                    const validatedQuantity = Math.max(1, Math.min(newQuantity, stockLimit));
                    return { ...item, quantity: validatedQuantity };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount }}>
            {children}
        </CartContext.Provider>
    );
};
