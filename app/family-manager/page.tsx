'use client';

import React from 'react';
import { Card } from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";

// Dummy data for family management
const familyData = [
  {
    id: 1,
    name: "The Johnson Family",
    slug: "johnson-family",
    members: 4,
    babies: 2,
    createdDate: "2024-01-15",
    status: "Active",
  },
  {
    id: 2,
    name: "The Smith Household",
    slug: "smith-household",
    members: 3,
    babies: 1,
    createdDate: "2024-02-03",
    status: "Active",
  },
  {
    id: 3,
    name: "The Williams Family",
    slug: "williams-family",
    members: 5,
    babies: 3,
    createdDate: "2024-01-28",
    status: "Active",
  },
  {
    id: 4,
    name: "The Brown Family",
    slug: "brown-family",
    members: 2,
    babies: 1,
    createdDate: "2024-03-10",
    status: "Inactive",
  },
];

export default function FamilyManagerPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Family Management
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage all families in the baby tracking system
          </p>
        </div>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Families
            </h2>
            <Button>
              Add New Family
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Babies</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familyData.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="font-medium">{family.name}</TableCell>
                  <TableCell className="font-mono text-sm">{family.slug}</TableCell>
                  <TableCell>{family.members}</TableCell>
                  <TableCell>{family.babies}</TableCell>
                  <TableCell>{new Date(family.createdDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        family.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {family.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
} 