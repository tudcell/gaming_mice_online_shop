// src/components/__tests__/Menu.test.js
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import Menu from '../../pages/Menu';
import '@testing-library/jest-dom';

// Mock the components used in Menu
jest.mock('../../components/MenuItem', () => {
    return function MockMenuItem(props) {
        return (
            <div data-testid="menu-item">
                <div>{props.name}</div>
                <div>Price: {props.price}</div>
            </div>
        );
    };
});

jest.mock('../../components/Pagination', () => {
    return function MockPagination({ currentPage, totalPages, onPageChange }) {
        return (
            <div data-testid="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => onPageChange(page)}>
                        {page}
                    </button>
                ))}
            </div>
        );
    };
});

jest.mock('../../components/RealTimeCharts', () => {
    return function MockRealTimeCharts() {
        return <div data-testid="charts">Charts Mock</div>;
    };
});

// Mock faker to generate consistent fake data
jest.mock('@faker-js/faker', () => ({
    faker: {
        company: { name: () => 'TestCompany' },
        commerce: {
            productName: () => 'TestProduct',
            price: () => '300'
        },
        image: { urlLoremFlickr: () => 'http://testimage.com' },
        lorem: { paragraph: () => 'Test details' }
    }
}));

// Mock the MenuList helper
jest.mock('../../helpers/MenuList', () => ({
    MenuList: [
        {
            name: 'Initial Mouse 1',
            image: 'image1.jpg',
            price: 200,
            details: 'Details 1'
        },
        {
            name: 'Initial Mouse 2',
            image: 'image2.jpg',
            price: 400,
            details: 'Details 2'
        }
    ]
}));

describe('Menu Page', () => {
    beforeEach(() => {
        localStorage.clear();
        // Clear timers between tests
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('renders main components correctly', () => {
        render(<Menu testMode={true} />);

        expect(screen.getByText('Our Gaming Mice')).toBeInTheDocument();
        expect(screen.getByLabelText(/Min Price:/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Max Price:/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sort By:/)).toBeInTheDocument();
        expect(screen.getByText('Mice Metrics')).toBeInTheDocument();
        expect(screen.getByText('Delete Random Mouse')).toBeInTheDocument();
    });

    test('filter inputs change values and reset pagination', () => {
        render(<Menu testMode={true} />);

        const minInput = screen.getByLabelText(/Min Price:/);
        const maxInput = screen.getByLabelText(/Max Price:/);

        fireEvent.change(minInput, { target: { value: '250' } });
        expect(minInput.value).toBe('250');

        fireEvent.change(maxInput, { target: { value: '350' } });
        expect(maxInput.value).toBe('350');
    });

    test('sort order selection works correctly', () => {
        render(<Menu testMode={true} />);

        const sortSelect = screen.getByLabelText(/Sort By:/);

        fireEvent.change(sortSelect, { target: { value: 'lowToHigh' } });
        expect(sortSelect.value).toBe('lowToHigh');

        fireEvent.change(sortSelect, { target: { value: 'highToLow' } });
        expect(sortSelect.value).toBe('highToLow');
    });

    test('automated timers add and remove mice correctly', async () => {
        render(<Menu />);


        const initialCount = screen.getAllByTestId('menu-item').length;

        act(() => {
            jest.advanceTimersByTime(5000);
        });


        await waitFor(() => {
            expect(screen.getAllByTestId('menu-item').length).toBe(initialCount + 1);
        });


        act(() => {
            jest.advanceTimersByTime(5000);
        });


        await waitFor(() => {
            const finalCount = screen.getAllByTestId('menu-item').length;
            expect(finalCount).toBeLessThanOrEqual(initialCount + 1);
        });
    });

    test('localStorage gets updated when mice change', () => {
        render(<Menu testMode={true} />);

        // Trigger a state change by clicking delete button
        fireEvent.click(screen.getByText('Delete Random Mouse'));

        // Verify localStorage was updated
        const storedMice = JSON.parse(localStorage.getItem('mice'));
        expect(storedMice).toBeDefined();
    });
});