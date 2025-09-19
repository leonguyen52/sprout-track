'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useBaby } from '../../../context/baby';
import { useTimezone } from '../../../context/timezone';
import { useFamily } from '@/src/context/family';
import { useParams } from 'next/navigation';
import { Card } from '@/src/components/ui/card';
import ActivityColumnChart from '@/src/components/charts/ActivityColumnChart';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

type Category = 'diaper' | 'feed' | 'sleep';

export default function ChartPage() {
  const { selectedBaby } = useBaby();
  const { userTimezone } = useTimezone();
  const { family } = useFamily();
  const params = useParams();
  const familySlug = params?.slug as string;

  const [category, setCategory] = useState<Category>('diaper');
  const [days, setDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);

  const dateRange = useMemo(() => {
    if (useCustomRange && customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [days, useCustomRange, customDateRange]);

  const refresh = useCallback(async () => {
    if (!selectedBaby) return;
    setIsLoading(true);
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const url = `/api/timeline?babyId=${encodeURIComponent(selectedBaby.id)}&startDate=${encodeURIComponent(dateRange.start.toISOString())}&endDate=${encodeURIComponent(dateRange.end.toISOString())}&_t=${Date.now()}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActivities(data.data || []);
        } else {
          setActivities([]);
        }
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.error('Failed to fetch activities for chart', e);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBaby, dateRange.start, dateRange.end]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="p-4 md:p-6">
      {/* Date Range Controls */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-medium text-gray-800">Date Range</div>
          <div className="flex items-center gap-1 text-xs">
            <Button size="sm" variant={!useCustomRange && days === 3 ? 'default' : 'outline'} onClick={() => {setUseCustomRange(false); setDays(3);}}>3d</Button>
            <Button size="sm" variant={!useCustomRange && days === 7 ? 'default' : 'outline'} onClick={() => {setUseCustomRange(false); setDays(7);}}>7d</Button>
            <Button size="sm" variant={!useCustomRange && days === 14 ? 'default' : 'outline'} onClick={() => {setUseCustomRange(false); setDays(14);}}>14d</Button>
            <Button size="sm" variant={!useCustomRange && days === 30 ? 'default' : 'outline'} onClick={() => {setUseCustomRange(false); setDays(30);}}>30d</Button>
            <Button size="sm" variant={useCustomRange ? 'default' : 'outline'} onClick={() => setUseCustomRange(true)}>Custom</Button>
          </div>
        </div>
        {useCustomRange && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={customDateRange.start ? customDateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => setCustomDateRange(prev => ({...prev, start: e.target.value ? new Date(e.target.value) : null}))}
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={customDateRange.end ? customDateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => setCustomDateRange(prev => ({...prev, end: e.target.value ? new Date(e.target.value) : null}))}
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Summary Chart */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-medium text-gray-800">Summary</div>
        </div>
        <ActivityColumnChart
          activities={activities}
          categories={['sleep','feed','diaper']}
          startDate={dateRange.start}
          endDate={dateRange.end}
          isLoading={isLoading}
          timezone={userTimezone}
          zoom={zoom}
          centerToday={true}
          autoZoom={true}
        />
      </Card>

      {/* Sleep Chart */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-medium text-gray-800">Sleep</div>
        </div>
        <ActivityColumnChart
          activities={activities}
          category={'sleep'}
          startDate={dateRange.start}
          endDate={dateRange.end}
          isLoading={isLoading}
          timezone={userTimezone}
          zoom={zoom}
          centerToday={true}
          autoZoom={true}
        />
      </Card>

      {/* Feed Chart (supports duration rectangles) */}
      <Card className="p-4 md:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-medium text-gray-800">Feed</div>
        </div>
        <ActivityColumnChart
          activities={activities}
          category={'feed'}
          startDate={dateRange.start}
          endDate={dateRange.end}
          isLoading={isLoading}
          timezone={userTimezone}
          zoom={zoom}
          centerToday={true}
          autoZoom={true}
        />
      </Card>

      {/* Diaper Chart */}
      <Card className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="font-medium text-gray-800">Diaper</div>
        </div>
        <ActivityColumnChart
          activities={activities}
          category={'diaper'}
          startDate={dateRange.start}
          endDate={dateRange.end}
          isLoading={isLoading}
          timezone={userTimezone}
          zoom={zoom}
          centerToday={true}
          autoZoom={true}
        />
      </Card>
    </div>
  );
}


