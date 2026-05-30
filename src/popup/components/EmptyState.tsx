import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Search size={48} className="text-gray-400" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
