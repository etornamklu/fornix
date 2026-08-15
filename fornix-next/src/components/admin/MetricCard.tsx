import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: LucideIcon;
}

export default function MetricCard({ title, value, change, trend, icon: Icon }: MetricCardProps) {
    return (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-xs sm:text-sm text-gray-600">{title}</p>
                <p className="text-xl sm:text-2xl font-semibold">{value}</p>
                <p className={`text-xs sm:text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trend === 'up' ? '+' : ''}{change}
                </p>
            </div>
        </div>
    );
}
