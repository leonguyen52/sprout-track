'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/src/lib/utils';

type Category = 'diaper' | 'feed' | 'sleep';

export interface ActivityColumnChartProps {
  activities: any[];
  category?: Category; // single-category mode
  categories?: Category[]; // multi-category overlay mode (summary)
  startDate: Date;
  endDate: Date;
  isLoading?: boolean;
  timezone?: string;
  zoom?: number; // horizontal zoom multiplier
  centerToday?: boolean; // auto-center today's column
  autoZoom?: boolean; // fit chart to container
}

// Map an activity to a Date it happened at
function getWhen(activity: any): Date | null {
  if ('time' in activity && activity.time) return new Date(activity.time);
  if ('startTime' in activity && activity.startTime) return new Date(activity.startTime);
  if ('date' in activity && activity.date) return new Date(activity.date);
  return null;
}

function isOfCategory(activity: any, category: Category): boolean {
  switch (category) {
    case 'diaper':
      return 'condition' in activity;
    case 'feed':
      return 'amount' in activity;
    case 'sleep':
      return 'duration' in activity;
    default:
      return false;
  }
}

const CATEGORY_COLORS: Record<Category, { marker: string; interval: string }> = {
  sleep: { marker: '#0ea5e9', interval: '#0ea5e9' }, // sky-500
  feed: { marker: '#10b981', interval: '#10b981' },  // emerald-500
  diaper: { marker: '#f59e0b', interval: '#f59e0b' }, // amber-500 (no intervals normally)
};

type DiaperSubtype = 'pee' | 'poo' | 'both';
const DIAPER_COLORS: Record<DiaperSubtype, string> = {
  pee: '#06b6d4',  // cyan-500
  poo: '#ef4444',  // red-500
  both: '#a78bfa', // violet-400/500
};

function getDiaperSubtype(activity: any): DiaperSubtype {
  const raw = ((activity?.type || activity?.condition || '') + '').toLowerCase();
  if (raw.includes('both')) return 'both';
  if (raw.includes('pee') || raw.includes('wet')) return 'pee';
  if (raw.includes('poo') || raw.includes('dirty')) return 'poo';
  return 'pee';
}

type FeedSubtype = 'breast' | 'bottle' | 'other';
const FEED_COLORS: Record<FeedSubtype, string> = {
  breast: '#34d399', // emerald-400
  bottle: '#f59e0b', // amber-500 (more distinct from breast)
  other: '#16a34a',  // emerald-700
};
function getFeedSubtype(activity: any): FeedSubtype {
  const raw = ((activity?.type || activity?.method || '') + '').toLowerCase();
  if (raw.includes('breast') || raw.includes('nurse')) return 'breast';
  if (raw.includes('bottle')) return 'bottle';
  return 'other';
}

const HOURS_IN_DAY = 24;
const BASE_DAY_WIDTH = 48; // px per day at zoom=1

export default function ActivityColumnChart({
  activities,
  category,
  categories,
  startDate,
  endDate,
  isLoading,
  zoom = 1,
  centerToday = true,
  autoZoom = true,
}: ActivityColumnChartProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Arrange markers into multiple x-lanes to reduce overlap within a day column
  const arrangeMarkersIntoLanes = (hours: number[], minGapHours = 0.25, maxLanes = 3) => {
    const sorted = hours.slice().sort((a, b) => a - b);
    const lanes: number[] = []; // last hour in each lane
    const placed: Array<{ hour: number; lane: number }> = [];
    for (const h of sorted) {
      let laneIdx = lanes.findIndex(last => h - last >= minGapHours);
      if (laneIdx === -1) {
        if (lanes.length < maxLanes) {
          laneIdx = lanes.length;
          lanes.push(h);
        } else {
          // Force into the earliest finishing lane
          let best = 0;
          for (let i = 1; i < lanes.length; i++) {
            if (lanes[i] < lanes[best]) best = i;
          }
          laneIdx = best;
          lanes[laneIdx] = h;
        }
      } else {
        lanes[laneIdx] = h;
      }
      placed.push({ hour: h, lane: laneIdx });
    }
    return { placed, lanesCount: Math.max(1, lanes.length) };
  };
  const days: Date[] = useMemo(() => {
    const out: Date[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      out.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [startDate, endDate]);

  // For diaper/feed: marker hours; for sleep/feed: intervals [startHour, endHour] if duration exists
  const perDayData = useMemo(() => {
    const cats: Category[] = categories && categories.length ? categories : (category ? [category] : ['sleep','feed','diaper']);
    const data: Record<Category, {
      markers: Record<string, number[]>;
      intervals: Record<string, Array<{ start: number; end: number }>>;
      subMarkers?: Record<string, { pee: number[]; poo: number[]; both: number[] }>;
      feedSub?: Record<string, { breast: { markers: number[]; intervals: Array<{ start: number; end: number }> }; bottle: { markers: number[]; intervals: Array<{ start: number; end: number }> }; other: { markers: number[]; intervals: Array<{ start: number; end: number }> } }>;
    }> = {
      sleep: { markers: {}, intervals: {} },
      feed: { markers: {}, intervals: {}, feedSub: {} },
      diaper: { markers: {}, intervals: {}, subMarkers: {} },
    } as any;
    for (const d of days) {
      const key = d.toDateString();
      for (const c of cats) {
        data[c].markers[key] = [];
        data[c].intervals[key] = [];
        if (c === 'diaper') {
          (data[c].subMarkers as NonNullable<typeof data['diaper']['subMarkers']>)[key] = { pee: [], poo: [], both: [] };
        }
        if (c === 'feed') {
          (data[c].feedSub as any)[key] = {
            breast: { markers: [], intervals: [] },
            bottle: { markers: [], intervals: [] },
            other: { markers: [], intervals: [] },
          };
        }
      }
    }
    for (const a of activities) {
      const when = getWhen(a);
      if (!when) continue;
      const key = new Date(when.getFullYear(), when.getMonth(), when.getDate()).toDateString();
      for (const c of cats) {
        if (!isOfCategory(a, c)) continue;
        if (!(key in data[c].markers)) continue;

        const startHour = when.getHours() + when.getMinutes() / 60;
        // Duration support for sleep and feed (if available)
        const durationMin: number | undefined = (a as any).duration;
        const hasDuration = typeof durationMin === 'number' && durationMin > 0 && (c === 'sleep' || c === 'feed');
        if (hasDuration) {
          const endHourRaw = startHour + durationMin / 60;
          const endHour = Math.min(24, endHourRaw);
          const clampedStart = Math.max(0, startHour);
          if (endHour > 0 && clampedStart < 24) {
            data[c].intervals[key].push({ start: clampedStart, end: endHour });
          }
        } else {
          if (c === 'diaper' && data.diaper.subMarkers) {
            const sub = getDiaperSubtype(a);
            data.diaper.subMarkers[key][sub].push(startHour);
          } else if (c === 'feed' && (data.feed as any).feedSub) {
            const sub = getFeedSubtype(a);
            (data.feed as any).feedSub[key][sub].markers.push(startHour);
          } else {
            data[c].markers[key].push(startHour);
          }
        }
      }
    }
    return { cats, data };
  }, [activities, category, categories, days]);

  // SVG layout
  // Auto-zoom based on container width
  const containerWidth = wrapperRef.current?.clientWidth || 0;
  const paddingsX = 36 + 12; // left + right
  let effectiveZoom = zoom;
  if (autoZoom && containerWidth > 0) {
    const fitZoom = (containerWidth - paddingsX) / (days.length * BASE_DAY_WIDTH);
    const isMobile = containerWidth < 640;
    const bias = isMobile ? 0.9 : 1.05; // slightly zoom out on mobile, in on desktop
    effectiveZoom = Math.max(0.6, Math.min(3, fitZoom * bias));
  }

  const perDayWidth = Math.max(24, BASE_DAY_WIDTH * effectiveZoom);
  const chartWidth = Math.max(320, Math.ceil(days.length * perDayWidth));
  const chartHeight = 360;
  const paddingTop = 20;
  const paddingBottom = 28; // add more bottom for labels
  const paddingLeft = 36;
  const paddingRight = 12;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const columnWidth = innerWidth / days.length;
  
  // Responsive sizing based on actual column width - more aggressive for very narrow columns
  const isVeryNarrowColumn = columnWidth < 30; // 14d/30d views
  const isNarrowColumn = columnWidth < 50; // 7d view
  const markerRadius = isVeryNarrowColumn ? 1.5 : isNarrowColumn ? 2 : 4;
  const intervalWidth = isVeryNarrowColumn ? 4 : isNarrowColumn ? 6 : 12;
  const bandOffset = isVeryNarrowColumn ? 4 : isNarrowColumn ? 8 : 24;
  const subOffset = isVeryNarrowColumn ? 2 : isNarrowColumn ? 4 : 10;

  const yForHour = (h: number) => paddingTop + innerHeight - (h / HOURS_IN_DAY) * innerHeight;

  // Auto-center today's column
  useEffect(() => {
    if (!centerToday) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
    const idx = days.findIndex(d => d.toDateString() === todayKey);
    if (idx === -1) return;
    const x = paddingLeft + idx * columnWidth + columnWidth / 2;
    const target = Math.max(0, x - wrapper.clientWidth / 2);
    wrapper.scrollTo({ left: target, behavior: 'auto' });
  }, [days, columnWidth, centerToday, containerWidth]);

  return (
    <div ref={wrapperRef} className="w-full overflow-x-auto">
      {(categories && categories.length > 1) && (
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1" style={{ paddingLeft: 32 }}>
          {/* Sleep */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: CATEGORY_COLORS.sleep.marker, width: 10, height: 10 }} />
            <span className="select-none">Sleep</span>
          </div>
          {/* Feed */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: FEED_COLORS.breast, width: 10, height: 10 }} />
            <span className="select-none">Breast Feed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: FEED_COLORS.bottle, width: 10, height: 10 }} />
            <span className="select-none">Bottle Feed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: FEED_COLORS.other, width: 10, height: 10 }} />
            <span className="select-none">Other Feed</span>
          </div>
          {/* Diaper subtypes */}
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: DIAPER_COLORS.pee, width: 10, height: 10 }} />
            <span className="select-none">Pee/Wet</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: DIAPER_COLORS.poo, width: 10, height: 10 }} />
            <span className="select-none">Poo/Dirty</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="inline-block rounded-full" style={{ backgroundColor: DIAPER_COLORS.both, width: 10, height: 10 }} />
            <span className="select-none">Wet & Dirty</span>
          </div>
        </div>
      )}
      {(!categories || categories.length <= 1) && category && (
        <div className="flex flex-wrap items-center gap-2 px-1 pb-1" style={{ paddingLeft: 32 }}>
          {category === 'diaper' ? (
            <>
              {(['pee','poo','both'] as DiaperSubtype[]).map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs text-gray-700">
                  <span
                    className="inline-block rounded-full"
                    style={{ backgroundColor: DIAPER_COLORS[k], width: 10, height: 10 }}
                  />
                  <span className="select-none">{k === 'pee' ? 'Pee/Wet' : k === 'poo' ? 'Poo/Dirty' : 'Wet & Dirty'}</span>
                </div>
              ))}
            </>
          ) : category === 'feed' ? (
            <>
              {(['breast','bottle','other'] as FeedSubtype[]).map((k) => (
                <div key={k} className="flex items-center gap-2 text-xs text-gray-700">
                  <span
                    className="inline-block rounded-full"
                    style={{ backgroundColor: FEED_COLORS[k], width: 10, height: 10 }}
                  />
                  <span className="select-none">{k === 'breast' ? 'Breast Feed' : k === 'bottle' ? 'Bottle Feed' : 'Other Feed'}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className="inline-block rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[category].marker, width: 10, height: 10 }}
              />
              <span className="select-none capitalize">{category}</span>
            </div>
          )}
        </div>
      )}
      <svg width={chartWidth} height={chartHeight} className="bg-white rounded-md">
        {/* Y axis */}
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + innerHeight} stroke="#e5e7eb" />
        {/* Y ticks every 3 hours */}
        {Array.from({ length: 9 }, (_, i) => i * 3).map((h) => (
          <g key={h}>
            <line x1={paddingLeft - 4} x2={paddingLeft} y1={yForHour(h)} y2={yForHour(h)} stroke="#9ca3af" />
            <text x={paddingLeft - 8} y={yForHour(h) + 4} textAnchor="end" fontSize={10} fill="#6b7280">
              {h}:00
            </text>
            <line x1={paddingLeft} x2={paddingLeft + innerWidth} y1={yForHour(h)} y2={yForHour(h)} stroke="#f3f4f6" />
          </g>
        ))}

        {/* X axis */}
        <line x1={paddingLeft} y1={paddingTop + innerHeight} x2={paddingLeft + innerWidth} y2={paddingTop + innerHeight} stroke="#e5e7eb" />

        {/* Columns and markers */}
        {days.map((d, idx) => {
          const x = paddingLeft + idx * columnWidth;
          const dayKey = d.toDateString();
          const catsToDraw = perDayData.cats;
          return (
            <g key={dayKey}>
              {/* Column background */}
              <rect x={x + 4} y={paddingTop} width={columnWidth - 8} height={innerHeight} fill="#f9fafb" stroke="#f3f4f6" />
              {/* Day label (date only) */}
              <text x={x + columnWidth / 2} y={paddingTop + innerHeight + 20} textAnchor="middle" fontSize={11} fill="#6b7280">
                {d.getDate()}
              </text>
              {/* Intervals and markers per category (support summary overlay) */}
              {catsToDraw.map((c, catIdx) => {
                const intervals = perDayData.data[c].intervals[dayKey] || [];
                const marks = (perDayData.data[c].markers[dayKey] || []).slice().sort((a, b) => a - b);
                const color = CATEGORY_COLORS[c];
                // Place each category in its own horizontal band to avoid cross-category overlap
                const categoryBandOffset = c === 'sleep' ? -bandOffset : c === 'diaper' ? bandOffset : 0; // feed centered, sleep left, diaper right
                const markerOffset = categoryBandOffset; // replace previous catIdx-based offset
                const laneSpacing = 16; // px between lanes (increased for better separation)
                // helpers for laneing sleep intervals
                const arrangeIntervalsIntoLanes = (intervalsList: Array<{ start: number; end: number }>, maxLanes = 3) => {
                  const lanes: Array<Array<{ start: number; end: number }>> = [];
                  const placed: Array<{ seg: { start: number; end: number }; lane: number }> = [];
                  const byStart = intervalsList.slice().sort((a,b)=>a.start-b.start);
                  for (const seg of byStart) {
                    let laneIdx = lanes.findIndex(lane => !lane.some(s => !(seg.end <= s.start || seg.start >= s.end)));
                    if (laneIdx === -1) {
                      if (lanes.length < maxLanes) {
                        laneIdx = lanes.length;
                        lanes.push([seg]);
                      } else {
                        let best = 0;
                        for (let i=1;i<lanes.length;i++) if (lanes[i].length < lanes[best].length) best = i;
                        laneIdx = best;
                        lanes[laneIdx].push(seg);
                      }
                    } else {
                      lanes[laneIdx].push(seg);
                    }
                    placed.push({ seg, lane: laneIdx });
                  }
                  return { placed, lanesCount: Math.max(1, lanes.length) };
                };
                return (
                  <g key={c}>
                    {c === 'sleep' && intervals.length > 0 ? (
                      (() => {
                        const { placed, lanesCount } = arrangeIntervalsIntoLanes(intervals, 3);
                        const baseX = x + columnWidth / 2 + markerOffset;
                        const totalWidth = Math.max(intervalWidth, (lanesCount - 1) * laneSpacing + intervalWidth);
                        return placed.map(({ seg, lane }, i) => {
                          const y1 = yForHour(seg.end);
                          const y2 = yForHour(seg.start);
                          const h = Math.max(2, y2 - y1);
                          const cx = baseX - totalWidth / 2 + lane * laneSpacing;
                          return (
                            <rect
                              key={`sint-${i}`}
                              x={cx - intervalWidth / 2}
                              y={y1}
                              width={intervalWidth}
                              height={h}
                              rx={3}
                              fill={color.interval}
                              opacity={0.9}
                            />
                          );
                        });
                      })()
                    ) : c === 'feed' && (perDayData.data.feed as any).feedSub ? (
                      // Feed intervals split by subtype colors
                      (() => {
                        const sub = (perDayData.data.feed as any).feedSub[dayKey];
                        const feedSubs: Array<{ key: FeedSubtype; intervals: Array<{ start: number; end: number }>; offset: number; fill: string }> = [
                          { key: 'breast', intervals: sub?.breast.intervals || [], offset: -10, fill: FEED_COLORS.breast },
                          { key: 'bottle', intervals: sub?.bottle.intervals || [], offset: 0, fill: FEED_COLORS.bottle },
                          { key: 'other', intervals: sub?.other.intervals || [], offset: 10, fill: FEED_COLORS.other },
                        ];
                        return feedSubs.flatMap(({ intervals, offset, fill }, idx) =>
                          intervals.map((seg, i) => {
                            const y1 = yForHour(seg.end);
                            const y2 = yForHour(seg.start);
                            const h = Math.max(2, y2 - y1);
                            return (
                              <rect
                                key={`fint-${idx}-${i}`}
                                x={x + columnWidth / 2 - intervalWidth / 2 + offset}
                                y={y1}
                                width={intervalWidth}
                                height={h}
                                rx={3}
                                fill={fill}
                                opacity={0.95}
                              />
                            );
                          })
                        );
                      })()
                    ) : (
                      intervals.map((seg, i) => {
                        const y1 = yForHour(seg.end);
                        const y2 = yForHour(seg.start);
                        const h = Math.max(2, y2 - y1);
                        return (
                          <rect
                            key={`int-${i}`}
                            x={x + columnWidth / 2 - intervalWidth / 2 + markerOffset}
                            y={y1}
                            width={intervalWidth}
                            height={h}
                            rx={3}
                            fill={color.interval}
                            opacity={0.9}
                          />
                        );
                      })
                    )}
                    {c === 'diaper' && perDayData.data.diaper.subMarkers ? (
                      (() => {
                        const sub = perDayData.data.diaper.subMarkers![dayKey];
                        const subs: Array<{ key: DiaperSubtype; hours: number[]; offset: number }> = [
                          { key: 'pee', hours: sub?.pee || [], offset: -subOffset },
                          { key: 'poo', hours: sub?.poo || [], offset: 0 },
                          { key: 'both', hours: sub?.both || [], offset: subOffset },
                        ];
                        return subs.map(({ key, hours, offset }) =>
                          hours.slice().sort((a,b)=>a-b).map((hour, i) => (
                            <circle
                              key={`m-${key}-${i}`}
                              cx={x + columnWidth / 2 + categoryBandOffset + offset}
                              cy={yForHour(hour)}
                              r={markerRadius}
                              fill={DIAPER_COLORS[key]}
                            />
                          ))
                        );
                      })()
                    ) : c === 'feed' && perDayData.data.feed.feedSub ? (
                      (() => {
                        const sub = perDayData.data.feed.feedSub[dayKey];
                        const subs: Array<{ key: FeedSubtype; hours: number[]; offset: number; fill: string }> = [
                          { key: 'breast', hours: sub?.breast.markers || [], offset: -subOffset, fill: FEED_COLORS.breast },
                          { key: 'bottle', hours: sub?.bottle.markers || [], offset: 0, fill: FEED_COLORS.bottle },
                          { key: 'other', hours: sub?.other.markers || [], offset: subOffset, fill: FEED_COLORS.other },
                        ];
                        return subs.flatMap(({ hours, offset, fill }, idx) =>
                          hours.slice().sort((a,b)=>a-b).map((hour, i) => (
                            <circle
                              key={`fm-${idx}-${i}`}
                              cx={x + columnWidth / 2 + categoryBandOffset + offset}
                              cy={yForHour(hour)}
                              r={markerRadius}
                              fill={fill}
                            />
                          ))
                        );
                      })()
                    ) : (
                      (() => {
                        const { placed, lanesCount } = arrangeMarkersIntoLanes(marks, 0.25, 3);
                        const centerX = x + columnWidth / 2 + markerOffset;
                        const totalWidth = (lanesCount - 1) * laneSpacing;
                        return placed.map(({ hour, lane }, i) => (
                          <circle
                            key={`m-${i}`}
                            cx={centerX - totalWidth / 2 + lane * laneSpacing}
                            cy={yForHour(hour)}
                            r={markerRadius}
                            fill={color.marker}
                          />
                        ));
                      })()
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Title */}
        {/* No chart title/subtitle */}
        {/* Month label on left */}
        <text x={8} y={paddingTop + innerHeight + 20} fontSize={11} fill="#374151" textAnchor="start">
          {new Date(startDate).toLocaleDateString(undefined, { month: 'short' })}
        </text>
      </svg>
    </div>
  );
}


