import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    const addToCart = (item) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id && cartItem.name === item.name);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id && cartItem.name === item.name
                        ? { ...cartItem, quantity: cartItem.quantity + 1, price: ((cartItem.quantity + 1) * cartItem.unitPrice).toFixed(2) }
                        : cartItem
                );
            } else {
                return [...prevCart, { ...item, quantity: 1, unitPrice: item.price, price: item.price.toFixed(2) }];
            }
        });
    };

    const removeFromCart = (item) => {
        setCart(cart.filter(cartItem => cartItem.id !== item.id || cartItem.name !== item.name));
    };

    const updateCartItem = (item, quantity) => {
        setCart(cart.map(cartItem =>
            cartItem.id === item.id && cartItem.name === item.name
                ? { ...cartItem, quantity: parseInt(quantity), price: (parseInt(quantity) * cartItem.unitPrice).toFixed(2) }
                : cartItem
        ));
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateCartItem }}>
            {children}
        </CartContext.Provider>
    );
};