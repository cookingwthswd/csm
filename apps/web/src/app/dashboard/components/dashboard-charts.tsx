'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const SALES_BY_CATEGORY = [
  { name: 'Main Dishes', value: 38, color: '#2563EB' },
  { name: 'Soups', value: 22, color: '#16A34A' },
  { name: 'Desserts', value: 18, color: '#DC2626' },
  { name: 'Beverages', value: 12, color: '#EA580C' },
  { name: 'Sides', value: 10, color: '#7C3AED' },
];

const INVENTORY_LEVELS = [
  { name: 'Rice', current: 800, threshold: 200 },
  { name: 'Chicken', current: 450, threshold: 150 },
  { name: 'Vegetables', current: 320, threshold: 100 },
  { name: 'Sauces', current: 180, threshold: 80 },
  { name: 'Spices', current: 95, threshold: 50 },
];

export function SalesByCategoryChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={SALES_BY_CATEGORY}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          label={({ name, value }) => `${name} ${value}%`}
        >
          {SALES_BY_CATEGORY.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function InventoryLevelsChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={INVENTORY_LEVELS}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 1000]} />
        <YAxis type="category" dataKey="name" width={60} />
        <Tooltip />
        <Bar dataKey="current" name="Current" fill="#2563EB" radius={[0, 4, 4, 0]} />
        <Bar dataKey="threshold" name="Threshold" fill="#EC4899" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
