import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-md ${
        hover ? 'hover:shadow-lg' : ''
      } transition-shadow ${className}`}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'green' | 'blue' | 'orange' | 'purple';
  trend?: { value: number; direction: 'up' | 'down' };
}

const colorMap = {
  green: 'border-green-500 bg-green-50',
  blue: 'border-blue-500 bg-blue-50',
  orange: 'border-orange-500 bg-orange-50',
  purple: 'border-purple-500 bg-purple-50',
};

const colorTextMap = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  color,
  trend,
}) => {
  return (
    <Card className={`border-t-4 ${colorMap[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium text-gray-600 mb-1`}>{label}</p>
          <p className={`text-3xl font-bold ${colorTextMap[color]}`}>{value}</p>
          {trend && (
            <p className="text-xs mt-1 text-gray-500">
              {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div className={`text-5xl opacity-20 ${colorTextMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
