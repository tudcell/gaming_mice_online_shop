import React, { createContext, useState, useEffect } from "react";

// Create context
export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Get cart from localStorage or initialize empty array
    const [cart, setCart] = useState(() => {
        const storedCart = localStorage.getItem("shopping-cart");
        return storedCart ? JSON.parse(storedCart) : [];
    });

    // Update localStorage when cart changes
    useEffect(() => {
        localStorage.setItem("shopping-cart", JSON.stringify(cart));
        // Debug log
        console.log("Cart updated in localStorage:", JSON.stringify(cart));
    }, [cart]);

    // Add item to cart
    const addToCart = (item) => {
        if (!item || !item.id) {
            console.error("Cannot add item without ID to cart", item);
            return;
        }

        setCart(currentCart => {
            const existingItem = currentCart.find(cartItem => cartItem.id === item.id);

            if (existingItem) {
                return currentCart.map(cartItem =>
                    cartItem.id === item.id
                        ? {...cartItem, quantity: (cartItem.quantity || 1) + 1}
                        : cartItem
                );
            } else {
                return [...currentCart, {...item, quantity: 1}];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (id) => {
        setCart(currentCart => currentCart.filter(item => item.id !== id));
    };

    // Update item quantity
    const updateCartItemQuantity = (id, quantity) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }

        setCart(currentCart =>
            currentCart.map(item =>
                item.id === id ? {...item, quantity} : item
            )
        );
    };

    // Clear cart
    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateCartItemQuantity,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};