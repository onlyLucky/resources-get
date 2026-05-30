import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top: number;
      let left: number;

      if (position === 'top') {
        top = -tooltipRect.height - 8;
      } else {
        top = triggerRect.height + 8;
      }

      left = (triggerRect.width - tooltipRect.width) / 2;

      // 确保 tooltip 不超出视口
      const viewportWidth = window.innerWidth;
      if (triggerRect.left + left < 0) {
        left = -triggerRect.left + 4;
      } else if (triggerRect.left + left + tooltipRect.width > viewportWidth) {
        left = viewportWidth - triggerRect.left - tooltipRect.width - 4;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-[9999] px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 left-1/2 -translate-x-1/2 ${
              position === 'top' ? '-bottom-1' : '-top-1'
            }`}
          />
        </div>
      )}
    </div>
  );
};
