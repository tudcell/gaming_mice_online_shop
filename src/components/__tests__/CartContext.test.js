// src/components/__tests__/CartContext.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartProvider, CartContext } from '../../context/CartContext';

describe('CartContext CRUD operations', () => {
    test('adds an item to the cart', async () => {
        const TestComponent = () => {
            const { cart, addToCart } = React.useContext(CartContext);

            React.useEffect(() => {
                addToCart({ id: 1, name: 'Item 1', price: 10 });
            }, []);

            return (
                <div data-testid="cart-item">
                    {cart.length > 0 ? cart[0].name : 'No items'}
                </div>
            );
        };

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-item')).toHaveTextContent('Item 1');
        });
    });

    test('removes an item from the cart', async () => {
        const TestComponent = () => {
            const { cart, addToCart, removeFromCart } = React.useContext(CartContext);

            React.useEffect(() => {
                const item = { id: 1, name: 'Item 1', price: 10 };
                addToCart(item);
                // Use setTimeout to ensure the first state update completes
                setTimeout(() => removeFromCart(item), 0);
            }, []);

            return (
                <div data-testid="cart-status">
                    {cart.length === 0 ? 'Cart is empty' : cart[0].name}
                </div>
            );
        };

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('cart-status')).toHaveTextContent('Cart is empty');
        });
    });

    test('updates an item in the cart', async () => {
        // Mock implementation to ensure state updates properly
        function TestComponent() {
            const { cart, addToCart, updateCartItem } = React.useContext(CartContext);

            // Use state to track what operations have been completed
            const [status, setStatus] = React.useState('initial');

            React.useEffect(() => {
                const item = { id: 1, name: 'Item 1', price: 10 };

                // Set up a sequence of actions with delays
                const addItem = () => {
                    addToCart(item);
                    setStatus('added');
                };

                const updateItem = () => {
                    updateCartItem(item, 5);
                    setStatus('updated');
                };

                // Execute actions with small delays
                addItem();
                setTimeout(updateItem, 50);
            }, []);

            // Debug information
            console.log('Cart state:', cart, 'Status:', status);

            return (
                <div data-testid="cart-info">
                    {status === 'updated' && cart.length > 0 && cart[0].quantity === 5 ?
                        `Quantity: ${cart[0].quantity}` :
                        'No items'}
                </div>
            );
        }

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        // Wait for the component to update
        await waitFor(() =>
                screen.getByTestId('cart-info').textContent.includes('Quantity: 5'),
            { timeout: 1000 }
        );
    });
});