import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuItem from '../MenuItem';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
    useNavigate: jest.fn()
}));

describe('MenuItem component', () => {
    const mockNavigate = jest.fn();

    beforeEach(() => {
        useNavigate.mockImplementation(() => mockNavigate);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const defaultProps = {
        image: 'test-image.jpg',
        name: 'Test Mouse',
        price: 150,
        details: 'Test details',
        minPrice: 100,
        maxPrice: 200
    };

    test('renders the component with all props correctly', () => {
        render(<MenuItem {...defaultProps} />);

        expect(screen.getByText('Test Mouse')).toBeInTheDocument();
        expect(screen.getByText(/\$150/)).toBeInTheDocument();
        expect(screen.getByText('Mid Price')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('navigates to details page when plus button is clicked', () => {
        render(<MenuItem {...defaultProps} />);

        fireEvent.click(screen.getByRole('button'));

        expect(mockNavigate).toHaveBeenCalledWith('/mouseDetails', {
            state: {
                mouse: {
                    name: 'Test Mouse',
                    price: 150,
                    details: 'Test details',
                    image: 'test-image.jpg'
                }
            }
        });
    });

    test('shows "Cheapest" label when price equals minPrice', () => {
        const props = { ...defaultProps, price: 100 };
        render(<MenuItem {...props} />);

        const label = screen.getByText('Cheapest');
        expect(label).toBeInTheDocument();
        expect(label).toHaveClass('label-green');
    });

    test('shows "Most Expensive" label when price equals maxPrice', () => {
        const props = { ...defaultProps, price: 200 };
        render(<MenuItem {...props} />);

        const label = screen.getByText('Most Expensive');
        expect(label).toBeInTheDocument();
        expect(label).toHaveClass('label-red');
    });

    test('shows "Mid Price" label for prices between min and max', () => {
        render(<MenuItem {...defaultProps} />);

        const label = screen.getByText('Mid Price');
        expect(label).toBeInTheDocument();
        expect(label).toHaveClass('label-yellow');
    });

    test('handles undefined min and max prices', () => {
        const { minPrice, maxPrice, ...propsWithoutMinMax } = defaultProps;
        render(<MenuItem {...propsWithoutMinMax} />);

        // Without min/max prices, it should use default (mid price) behavior
        expect(screen.getByText('Mid Price')).toBeInTheDocument();
    });

    test('handles cases where all prices are the same', () => {
        const sameProps = {
            ...defaultProps,
            price: 150,
            minPrice: 150,
            maxPrice: 150
        };

        render(<MenuItem {...sameProps} />);

        // If all prices are the same, it will match minPrice first
        expect(screen.getByText('Cheapest')).toBeInTheDocument();
    });

    test('renders with proper background image style', () => {
        render(<MenuItem {...defaultProps} />);

        const imageDiv = screen.getByText('+').parentElement;
        expect(imageDiv).toHaveStyle(`background-image: url(${defaultProps.image})`);
    });
});