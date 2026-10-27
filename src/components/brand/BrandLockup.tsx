import React from 'react';
import { ChaupalRing } from './ChaupalRing';
import { cn } from '../../utils/cn';

export interface BrandLockupProps {
  className?: string;
  showRing?: boolean;
  ringVariant?: 'color' | 'monochrome' | 'on-dark';
  ringSize?: number;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({
  className,
  showRing = false,
  ringVariant = 'color',
  ringSize = 36,
}) => {
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      {showRing && (
        <ChaupalRing
          size={ringSize}
          variant={ringVariant}
          className="shrink-0"
        />
      )}
      <div className="inline-flex flex-col">
        {/* Shirorekha Table headline bar extending past the word */}
        <div className="relative w-full" aria-hidden="true">
          <div className="h-[3.5px] bg-[#06038D] rounded-full w-full" />
          {/* Small saffron blocks beneath it standing in as seats */}
          <div className="flex justify-between px-1.5 -mt-[1px] mb-0.5">
            <span className="w-1.5 h-1 bg-[#FF671F] rounded-[1px]" />
            <span className="w-1.5 h-1 bg-[#FF671F] rounded-[1px]" />
            <span className="w-1.5 h-1 bg-[#FF671F] rounded-[1px]" />
            <span className="w-1.5 h-1 bg-[#FF671F] rounded-[1px]" />
            <span className="w-1.5 h-1 bg-[#FF671F] rounded-[1px]" />
          </div>
        </div>

        {/* Real Devanagari text set in font stack, optically balanced 10-15% larger than Latin */}
        <div className="px-1.5">
          <span className="font-heading font-bold text-[18px] leading-tight text-[#06038D] tracking-wide block">
            जनसहभाग
          </span>
        </div>

        {/* Latin text and modular 2047 year tag aligned to the bar's right end */}
        <div className="flex items-center justify-between gap-3 px-1.5 mt-0.5">
          <span className="font-heading font-semibold text-[16px] leading-none text-[#06038D] tracking-tight">
            JanSahabhag
          </span>
          <span className="text-[11px] font-bold text-[#FF671F] px-1.5 py-0.5 bg-[#FF671F]/10 rounded border border-[#FF671F]/30 leading-none">
            2047
          </span>
        </div>
      </div>
    </div>
  );
};

export default BrandLockup;
