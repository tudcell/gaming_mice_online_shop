import React from 'react';
import { render, screen } from '@testing-library/react';
import RealTimeCharts from '../RealTimeCharts';

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
    Pie: () => <canvas data-testid="pie-chart" role="img" />,
    Bar: () => <canvas data-testid="bar-chart" role="img" />,
    Line: () => <canvas data-testid="line-chart" role="img" />
}));

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

    test('renders chart canvases in the charts-container', () => {
        render(<RealTimeCharts items={items} />);
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
});