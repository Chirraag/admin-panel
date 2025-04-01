import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  title: string;
  endpoint: string;
  dateField: string;
}

export function LineChart({ title, endpoint, dateField }: LineChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30);
        const q = query(
          collection(db, endpoint),
          where(dateField, '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy(dateField, 'asc')
        );

        const snapshot = await getDocs(q);
        const documents = snapshot.docs.map(doc => ({
          ...doc.data(),
          [dateField]: doc.data()[dateField]?.toDate(),
        }));

        // Group by date
        const groupedData = documents.reduce((acc: any, curr) => {
          const date = format(curr[dateField], 'MMM dd');
          if (!acc[date]) {
            acc[date] = 0;
          }
          acc[date]++;
          return acc;
        }, {});

        // Convert to array format for Recharts
        const chartData = Object.entries(groupedData).map(([date, count]) => ({
          date,
          count,
        }));

        setData(chartData);
      } catch (error) {
        console.error(`Error fetching ${endpoint} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, dateField]);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              scale="point"
              padding={{ left: 10, right: 10 }}
              tick={{ fontSize: 12 }}
              tickMargin={8}
            />
            <YAxis 
              width={40}
              scale="linear"
              padding={{ top: 20, bottom: 20 }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#6366f1' }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}