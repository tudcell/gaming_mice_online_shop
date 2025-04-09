import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function RealTimeCharts({ items }) {
    // Transform the `items` data into a format suitable for the chart
    const chartData = items.map((item) => ({
        name: item.name,
        price: parseFloat(item.price) || 0,
    }));

    return (
        <div className="real-time-charts">
            <h3>Price Trends</h3>
            <LineChart
                width={600}
                height={300}
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
        </div>
    );
}

export default RealTimeCharts;