import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useTheme } from '@/src/context/theme';
import { changelogModalStyles } from './changelog-modal.styles';
import { ChangelogModalProps } from './changelog-modal.types';
import './changelog-modal.css';

/**
 * ChangelogModal component
 * 
 * A modal that displays the application's changelog in a formatted way
 */
export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  open,
  onClose,
  version,
}) => {
  const [changelogContent, setChangelogContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  // Fetch the changelog content
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/changelog')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch changelog');
          }
          return response.json();
        })
        .then(data => {
          if (data.content) {
            setChangelogContent(data.content);
          } else {
            throw new Error('Invalid changelog data');
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching changelog:', error);
          setChangelogContent('Failed to load changelog.');
          setLoading(false);
        });
    }
  }, [open]);

  // Format the markdown content for display
  // This is a simple implementation that will be enhanced when a markdown renderer is installed
  const formatMarkdown = (content: string): React.ReactNode => {
    if (loading) {
      return <div className="text-center py-8">Loading changelog...</div>;
    }

    // Process the content to group list items
    const lines = content.split('\n');
    const processedContent: React.ReactNode[] = [];
    let listItems: string[] = [];
    let currentListLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
      
      // Check if this is a list item
      if (line.startsWith('- ')) {
        // Add to current list
        listItems.push(line.replace('- ', ''));
        currentListLevel = 1;
        continue;
      }
      
      // If we were building a list and now we're not, render the list
      if (listItems.length > 0 && !line.startsWith('- ')) {
        processedContent.push(
          <ul key={`list-${i}`} className="list-disc pl-6 mb-4" style={{ listStyleType: 'disc' }}>
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="mb-1 flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        currentListLevel = 0;
      }
      
      // Highlight the specified version if provided
      if (version && line.includes(`## v${version}`)) {
        processedContent.push(
          <h2 key={i} className="text-xl font-bold mt-6 mb-2 text-teal-600">
            {line.replace('## ', '')}
          </h2>
        );
        continue;
      }
      
      // Headers
      if (line.startsWith('# ')) {
        processedContent.push(
          <h1 key={i} className="text-2xl font-bold mt-6 mb-4">
            {line.replace('# ', '')}
          </h1>
        );
        continue;
      }
      
      if (line.startsWith('## ')) {
        processedContent.push(
          <h2 key={i} className="text-xl font-bold mt-6 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
        continue;
      }
      
      if (line.startsWith('### ')) {
        processedContent.push(
          <h3 key={i} className="text-lg font-bold mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
        continue;
      }
      
      if (line.startsWith('#### ')) {
        processedContent.push(
          <h4 key={i} className="text-base font-bold mt-3 mb-1 text-teal-700 dark:text-teal-400">
            {line.replace('#### ', '')}
          </h4>
        );
        continue;
      }
      
      // Horizontal rules (---)
      if (line.trim() === '---') {
        processedContent.push(
          <hr key={i} className="my-8 border-t border-gray-300 dark:border-gray-600" />
        );
        continue;
      }
      
      // Empty lines
      if (line.trim() === '') {
        processedContent.push(<br key={i} />);
        continue;
      }
      
      // Regular paragraphs
      processedContent.push(<p key={i} className="mb-2">{line}</p>);
    }
    
    // If we have any remaining list items, render them
    if (listItems.length > 0) {
      processedContent.push(
        <ul key="list-final" className="list-disc pl-6 mb-4" style={{ listStyleType: 'disc' }}>
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex} className="mb-1 flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <div>{processedContent}</div>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(changelogModalStyles.container, "changelog-modal-container")}>
        <DialogHeader className={changelogModalStyles.header}>
          <DialogTitle className={cn(changelogModalStyles.title, "changelog-modal-title")}>
            Changelog
          </DialogTitle>
          <DialogDescription className={cn(changelogModalStyles.description, "changelog-modal-description")}>
            View the history of changes and updates to the application
          </DialogDescription>
        </DialogHeader>
        
        <div className={cn(changelogModalStyles.content, "changelog-modal-content")}>
          <div className={cn(changelogModalStyles.markdown, "changelog-modal-markdown")}>
            {formatMarkdown(changelogContent)}
          </div>
        </div>
        
        <div className={changelogModalStyles.footer}>
          <Button 
            onClick={onClose}
            className={cn(changelogModalStyles.closeButton, "changelog-modal-close-button")}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogModal;
