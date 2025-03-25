import React from 'react';
import { render, screen } from '@testing-library/react';
import RealTimeCharts from '../RealTimeCharts';

// Sample items for testing
const items = [
    { name: 'BrandA Product', price: 100 },
    { name: 'BrandB Product', price: 200 },
    { name: 'BrandA Extra', price: 150 }
];

describe('RealTimeCharts component', () => {
    test('renders all chart headings', () => {
        render(<RealTimeCharts items={items} />);
        expect(screen.getByText(/Brand Count \(Pie Chart\)/)).toBeInTheDocument();
        expect(screen.getByText(/Average Price per Brand \(Bar Chart\)/)).toBeInTheDocument();
        expect(screen.getByText(/Total Price per Brand \(Line Chart\)/)).toBeInTheDocument();
    });

    test('renders chart canvases in the charts\-container', () => {
        render(<RealTimeCharts items={items} />);
        const canvases = screen.getAllByRole('img', { hidden: true });
        expect(canvases.length).toBeGreaterThanOrEqual(3);
    });
});