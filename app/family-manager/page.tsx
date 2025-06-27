'use client';

import React from 'react';
import { Card } from "@/src/components/ui/card";

export default function FamilyManagerPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Family Management Dashboard
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
          This is where you'll manage your family settings, members, and administrative features.
        </p>
      </Card>
    </div>
  );
} 