import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Menu from './Menu';

jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
}));

jest.mock('../helpers/MenuList', () => ({
    MenuList: [
        { name: 'Item 1', price: 10, image: 'image1.jpg', details: 'Details 1' },
        { name: 'Item 2', price: 20, image: 'image2.jpg', details: 'Details 2' },
        { name: 'Item 3', price: 30, image: 'image3.jpg', details: 'Details 3' },
    ],
}));

test('filters items by minimum price', () => {
    render(<Menu />);


    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Item 2')).toBeTruthy();
    expect(screen.getByText('Item 3')).toBeTruthy();


    const minPriceInput = screen.getByLabelText(/Min Price/i);
    fireEvent.change(minPriceInput, { target: { value: '15' } });

    expect(screen.queryByText('Item 1')).toBeNull();
    expect(screen.getByText('Item 2')).toBeTruthy();
    expect(screen.getByText('Item 3')).toBeTruthy();
});