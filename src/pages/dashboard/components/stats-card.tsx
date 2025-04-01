import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium mt-2",
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            )}>
              {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? 'Increase' : 'Decrease'}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}