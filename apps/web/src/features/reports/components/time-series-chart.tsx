import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

type SeriesConfig = {
  dataKey: string;
  name: string;
  color: string;
  type?: 'line' | 'bar';
};

interface TimeSeriesChartProps {
  data: any[];
  xKey: string;
  series: SeriesConfig[];
}

export function TimeSeriesChart({ data, xKey, series }: TimeSeriesChartProps) {
  const hasBar = series.some((s) => s.type === 'bar');

  if (hasBar) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((s) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={s.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            name={s.name}
            stroke={s.color}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

