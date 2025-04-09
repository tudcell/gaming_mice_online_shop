import React from 'react';
import { PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';

function RealTimePieChart({ items }) {
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

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="real-time-pie-chart">
            <h3>Brand Distribution</h3>
            <PieChart width={400} height={400}>
                <Pie
                    data={groupedData}
                    dataKey="count"
                    nameKey="brand"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                >
                    {groupedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </div>
    );
}

export default RealTimePieChart;