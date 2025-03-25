import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination component', () => {
    const totalPages = 4;
    const onPageChange = jest.fn();

    beforeEach(() => {
        onPageChange.mockClear();
    });

    test('renders correct number of page buttons', () => {
        render(<Pagination currentPage={1} totalPages={totalPages} onPageChange={onPageChange} />);
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(totalPages);
    });

    test('applies active\-page class for current page', () => {
        render(<Pagination currentPage={3} totalPages={totalPages} onPageChange={onPageChange} />);
        const activeButton = screen.getByText('3');
        expect(activeButton).toHaveClass('active-page');
    });

    test('calls onPageChange when a non\-active page button is clicked', () => {
        render(<Pagination currentPage={1} totalPages={totalPages} onPageChange={onPageChange} />);
        const pageButton = screen.getByText('2');
        fireEvent.click(pageButton);
        expect(onPageChange).toHaveBeenCalledWith(2);
    });
});