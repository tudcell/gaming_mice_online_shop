// javascript
import React, { useRef, useEffect, useMemo } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

function RealTimeCharts({ items }) {
    const pieRef = useRef(null);

    const brandData = useMemo(() => {
        const brandCounts = {};
        const brandPrices = {};
        items.forEach(item => {
            const brand = item.name.split(' ')[0];
            brandCounts[brand] = (brandCounts[brand] || 0) + 1;
            brandPrices[brand] = (brandPrices[brand] || 0) + item.price;
        });
        const brands = Object.keys(brandCounts);
        const counts = brands.map(brand => brandCounts[brand]);
        const avgPrices = brands.map(brand => brandPrices[brand] / brandCounts[brand]);
        const totalPrices = brands.map(brand => brandPrices[brand]);
        return { brands, counts, avgPrices, totalPrices };
    }, [items]);

    const pieChartData = {
        labels: brandData.brands,
        datasets: [
            {
                data: brandData.counts,
                backgroundColor: brandData.brands.map(
                    () => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(
                        Math.random() * 255
                    )}, ${Math.floor(Math.random() * 255)}, 0.6)`
                )
            }
        ]
    };

    const barChartData = {
        labels: brandData.brands,
        datasets: [
            {
                label: 'Average Price',
                data: brandData.avgPrices,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }
        ]
    };

    const lineChartData = {
        labels: brandData.brands,
        datasets: [
            {
                label: 'Total Price',
                data: brandData.totalPrices,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: false,
                tension: 0.1
            }
        ]
    };

    useEffect(() => {
        if (pieRef.current) {
            console.log('Pie chart canvas element:', pieRef.current);
        }
    }, []);

    return (
        <div className="charts-container">
            <div className="chart-item">
                <h2>Brand Count (Pie Chart)</h2>
                <Pie ref={pieRef} data={pieChartData} />
            </div>
            <div className="chart-item">
                <h2>Average Price per Brand (Bar Chart)</h2>
                <Bar data={barChartData} />
            </div>
            <div className="chart-item">
                <h2>Total Price per Brand (Line Chart)</h2>
                <Line data={lineChartData} />
            </div>
        </div>
    );
}

export default RealTimeCharts;