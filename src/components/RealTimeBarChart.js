import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function RealTimeBarChart({ items }) {
    // Group items by the first word in the name, or "Unknown" if name missing.
    const groupedData = items.reduce((acc, item) => {
        const brand = item.name ? item.name.split(' ')[0] : 'Unknown';
        const existing = acc.find(data => data.brand === brand);
        if (existing) {
            existing.count += 1;
        } else {
            acc.push({ brand, count: 1 });
        }
        return acc;
    }, []);

    return (
        <div className="real-time-bar-chart">
            <h3>Mice Count by Brand</h3>
            <BarChart
                width={600}
                height={300}
                data={groupedData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="brand" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
        </div>
    );
}

export default RealTimeBarChart;