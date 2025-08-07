'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { 
  Loader2,
  Eye,
  EyeOff,
  Mail,
  User,
  Calendar,
} from "lucide-react";
import { FeedbackResponse } from '@/app/api/types';

interface FeedbackViewProps {
  paginatedData: FeedbackResponse[];
  onUpdateFeedback: (id: string, viewed: boolean) => void;
  updatingFeedbackId: string | null;
  formatDateTime: (dateString: string | null) => string;
}

export default function FeedbackView({
  paginatedData,
  onUpdateFeedback,
  updatingFeedbackId,
  formatDateTime,
}: FeedbackViewProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubjectClick = (feedback: FeedbackResponse) => {
    setSelectedFeedback(feedback);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFeedback(null);
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Submitter</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Message Preview</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
              No feedback found.
            </TableCell>
          </TableRow>
        ) : (
          paginatedData.map((feedback) => (
            <TableRow key={feedback.id} className={!feedback.viewed ? 'bg-blue-50' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {!feedback.viewed && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                  )}
                  <button
                    onClick={() => handleSubjectClick(feedback)}
                    className="text-left hover:text-blue-600 hover:underline cursor-pointer"
                    title="Click to view full message"
                  >
                    {feedback.subject}
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">
                      {feedback.submitterName || 'Anonymous'}
                    </span>
                  </div>
                  {feedback.submitterEmail && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      {feedback.submitterEmail}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  {formatDateTime(feedback.submittedAt)}
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    feedback.viewed
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {feedback.viewed ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Read
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Unread
                    </>
                  )}
                </span>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate text-sm text-gray-600">
                  {feedback.message.length > 100 
                    ? `${feedback.message.substring(0, 100)}...` 
                    : feedback.message
                  }
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateFeedback(feedback.id, !feedback.viewed)}
                    disabled={updatingFeedbackId === feedback.id}
                    title={feedback.viewed ? 'Mark as unread' : 'Mark as read'}
                  >
                    {updatingFeedbackId === feedback.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : feedback.viewed ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>

    {/* Feedback Detail Modal */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Feedback Details</DialogTitle>
        </DialogHeader>
        {selectedFeedback && (
          <div className="space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <Input
                value={selectedFeedback.subject}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Submitter Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Submitter Name</label>
                <Input
                  value={selectedFeedback.submitterName || 'Anonymous'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={selectedFeedback.submitterEmail || 'Not provided'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Submission Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <Input
                  value={formatDateTime(selectedFeedback.submittedAt)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Input
                  value={selectedFeedback.viewed ? 'Read' : 'Unread'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message</label>
              <Textarea
                value={selectedFeedback.message}
                readOnly
                rows={8}
                className="bg-gray-50 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  onUpdateFeedback(selectedFeedback.id, !selectedFeedback.viewed);
                  // Update the local state to reflect the change
                  setSelectedFeedback({
                    ...selectedFeedback,
                    viewed: !selectedFeedback.viewed
                  });
                }}
                disabled={updatingFeedbackId === selectedFeedback.id}
              >
                {updatingFeedbackId === selectedFeedback.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : selectedFeedback.viewed ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Mark as {selectedFeedback.viewed ? 'Unread' : 'Read'}
              </Button>
              
              <Button onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
