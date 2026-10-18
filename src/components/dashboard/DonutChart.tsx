"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface DonutSlice {
  label: string;
  value: number;
  color: string; // HEX color for SVG stroke
  badgeColor?: string; // Tailwind class
}

interface DonutChartProps {
  title: string;
  subtitle: string;
  data: DonutSlice[];
  centerLabel?: string;
}

export default function DonutChart({
  title,
  subtitle,
  data,
  centerLabel = "Total Bidang"
}: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const size = 180;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeSlice = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-base font-bold text-slate-800">{title}</h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            100% Total
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-6">{subtitle}</p>

        {/* Chart Graphic Area */}
        <div className="relative flex items-center justify-center my-3">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {total > 0 &&
              data.map((slice, i) => {
                const percent = slice.value / total;
                const strokeDasharray = `${percent * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedPercent * circumference;
                accumulatedPercent += percent;

                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={i}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{
                      transformOrigin: "center",
                      filter: isHovered ? "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" : "none"
                    }}
                  />
                );
              })}
          </svg>

          {/* Center Info Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {activeSlice ? (
              <motion.div
                key={hoveredIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className="px-2"
              >
                <p className="text-xs font-bold text-slate-500 truncate max-w-[110px]">
                  {activeSlice.label}
                </p>
                <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                  {total > 0 ? Math.round((activeSlice.value / total) * 100) : 0}%
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  {activeSlice.value} Bidang
                </p>
              </motion.div>
            ) : (
              <div>
                <p className="text-2xl font-black text-slate-900">{total}</p>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {centerLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend & Percentages List */}
      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
        {data.map((item, i) => {
          const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
          const isHovered = hoveredIndex === i;

          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                isHovered ? "bg-slate-50 font-bold" : "hover:bg-slate-50/70"
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    backgroundColor: item.color,
                    transform: isHovered ? "scale(1.25)" : "scale(1)"
                  }}
                />
                <span className={`truncate ${isHovered ? "text-slate-900" : "text-slate-600"}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-semibold text-slate-800">{item.value}</span>
                <span className="font-bold w-10 text-right text-slate-500">{percent}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
