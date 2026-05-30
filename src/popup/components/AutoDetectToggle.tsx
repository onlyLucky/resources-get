import React from 'react';

interface AutoDetectToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export const AutoDetectToggle: React.FC<AutoDetectToggleProps> = ({ enabled, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'translate-x-4' : ''}`}
          />
        </div>
      </div>
      <span className="text-xs text-gray-600">自动嗅探</span>
    </label>
  );
};
