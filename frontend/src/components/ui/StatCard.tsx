import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  subtitle?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, subtitle }: StatCardProps) => {
  const isPositive = trend?.startsWith('+');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {trend}
          </span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">vs mois dernier</span>
        </div>
      )}
    </div>
  );
};
