import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

const chartData = [
  { label: 'Jan', value: 3200 },
  { label: 'Feb', value: 4800 },
  { label: 'Mar', value: 4100 },
  { label: 'Apr', value: 6200 },
  { label: 'May', value: 5800 },
  { label: 'Jun', value: 7300 },
  { label: 'Jul', value: 6900 },
  { label: 'Aug', value: 8100 },
  { label: 'Sep', value: 5400 },
  { label: 'Oct', value: 6700 },
  { label: 'Nov', value: 7200 },
  { label: 'Dec', value: 5900 }
];

export const TransactionTimelineChart: React.FC = () => {
  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="txTimelineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38B2AC" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38B2AC" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E2E8F0"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: '#A0AEC0' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={40}
            tick={{ fontSize: 11, fill: '#A0AEC0' }}
          />
          <Tooltip
            cursor={{ stroke: '#CBD5E0', strokeWidth: 1 }}
            formatter={(value: number) =>
              [`$${value.toLocaleString('en-US')}`, 'Volume']
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#319795"
            strokeWidth={2}
            fill="url(#txTimelineGradient)"
            name="Volume"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

