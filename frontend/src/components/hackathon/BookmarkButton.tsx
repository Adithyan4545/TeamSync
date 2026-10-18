import React, { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface BookmarkButtonProps {
  isBookmarked: boolean;
  onToggle: () => Promise<void>;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({ isBookmarked: initial, onToggle }) => {
  const [bookmarked, setBookmarked] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      setBookmarked(!bookmarked);
      await onToggle();
    } catch {
      setBookmarked(bookmarked); // rollback
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
    >
      {bookmarked ? (
        <BookmarkCheck className="w-5 h-5 text-indigo-600 fill-indigo-600 dark:text-indigo-400 dark:fill-indigo-400" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
    </button>
  );
};
