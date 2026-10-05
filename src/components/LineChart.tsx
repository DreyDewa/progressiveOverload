'use client';

import { CartesianGrid, Line, LineChart as RLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tick = { fill: '#71717a', fontSize: 12 };

export default function LineChart({
  data,
  valueLabel,
  formatValue,
}: {
  data: { date: string; value: number }[];
  valueLabel: string;
  formatValue: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={tick}
          tickFormatter={(d: string) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        />
        <YAxis tick={tick} width={40} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12 }}
          labelStyle={{ color: '#a1a1aa' }}
          labelFormatter={(d) => new Date(String(d)).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          formatter={(v) => [formatValue(Number(v)), valueLabel]}
        />
        <Line type="monotone" dataKey="value" stroke="#a3e635" strokeWidth={2} dot={{ r: 3 }} />
      </RLineChart>
    </ResponsiveContainer>
  );
}
