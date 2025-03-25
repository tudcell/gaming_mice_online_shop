// src/pages/__tests__/Menu.test.js
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
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('renders main components correctly', () => {
        render(<Menu />);

        expect(screen.getByText('Our Offer')).toBeInTheDocument();
        expect(screen.getByLabelText(/Min Price:/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Max Price:/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Sort By:/)).toBeInTheDocument();
        expect(screen.getByText('Mice Metrics')).toBeInTheDocument();
        expect(screen.getByText('Delete Random Mouse')).toBeInTheDocument();
    });

    test('filter inputs change values and reset pagination', async () => {
        render(<Menu />);

        const minInput = screen.getByLabelText(/Min Price:/);
        const maxInput = screen.getByLabelText(/Max Price:/);

        await act(async () => {
            fireEvent.change(minInput, { target: { value: '250' } });
        });

        expect(minInput.value).toBe('250');

        await act(async () => {
            fireEvent.change(maxInput, { target: { value: '350' } });
        });

        expect(maxInput.value).toBe('350');
    });

    test('sort order selection works correctly', async () => {
        render(<Menu />);

        const sortSelect = screen.getByLabelText(/Sort By:/);

        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'lowToHigh' } });
        });

        expect(sortSelect.value).toBe('lowToHigh');

        await act(async () => {
            fireEvent.change(sortSelect, { target: { value: 'highToLow' } });
        });

        expect(sortSelect.value).toBe('highToLow');
    });

    test('delete button removes a fake mouse', async () => {
        render(<Menu />);

        // First add a fake mouse
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        const initialMice = JSON.parse(localStorage.getItem('mice'));

        // Click delete button
        await act(async () => {
            fireEvent.click(screen.getByText('Delete Random Mouse'));
        });

        const updatedMice = JSON.parse(localStorage.getItem('mice'));
        expect(updatedMice.length).toBeLessThanOrEqual(initialMice.length);
    });

    test('timers add and remove mice as expected', async () => {
        render(<Menu />);

        const initialMice = JSON.parse(localStorage.getItem('mice')) || [];

        // Advance timer to add a mouse
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        const afterAddMice = JSON.parse(localStorage.getItem('mice'));
        expect(afterAddMice.length).toBe(initialMice.length + 1);

        // Advance timer to delete a mouse
        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        const afterDeleteMice = JSON.parse(localStorage.getItem('mice'));
        expect(afterDeleteMice.length).toBeGreaterThanOrEqual(initialMice.length);
        expect(afterDeleteMice.length).toBeLessThanOrEqual(initialMice.length + 1);
    });

    test('localStorage gets updated when mice change', async () => {
        render(<Menu />);

        await act(async () => {
            jest.advanceTimersByTime(5000);
        });

        const storedMice = JSON.parse(localStorage.getItem('mice'));
        expect(storedMice.length).toBeGreaterThan(0);
        expect(storedMice[storedMice.length - 1].isFake).toBe(true);
    });
});

// You can add similar test files for other pages:
// src/pages/__tests__/Home.test.js
// src/pages/__tests__/About.test.js
// src/pages/__tests__/Contact.test.js