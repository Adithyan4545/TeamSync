'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
  category?: string;
}

export interface DiagonalMarqueeCarouselProps {
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  cardClassName?: string;
  fadeClassName?: string;
  className?: string;
}

export const DEFAULT_TEAMSYNC_CARDS: CardItem[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
    title: 'Team Collaboration',
    category: 'TeamSync',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800&auto=format&fit=crop',
    title: 'Hackathon Coding',
    category: 'Innovation',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop',
    title: 'Brainstorming',
    category: 'Build Together',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    title: 'AI Innovation',
    category: 'AI Matching',
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    title: 'Project Team',
    category: 'Execution',
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop',
    title: 'Developers',
    category: 'Engineering',
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop',
    title: 'University Event',
    category: 'India-wide',
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop',
    title: 'Code Sprint',
    category: 'Hackathon',
  },
];

export const DiagonalMarqueeCarousel: React.FC<DiagonalMarqueeCarouselProps> = ({
  cards = DEFAULT_TEAMSYNC_CARDS,
  angle = -20,
  baseSpeed = 120,
  alternateDirections = true,
  cardClassName,
  fadeClassName,
  className,
}) => {
  // Split cards into 3 columns for rich vertical marquee layering
  const col1 = [...cards, ...cards];
  const col2 = [...cards.slice().reverse(), ...cards.slice().reverse()];
  const col3 = [...cards.slice(2), ...cards.slice(0, 2), ...cards.slice(2), ...cards.slice(0, 2)];

  const columns = [
    { items: col1, reverse: false, duration: baseSpeed / 3.5 },
    { items: col2, reverse: alternateDirections, duration: baseSpeed / 3 },
    { items: col3, reverse: false, duration: baseSpeed / 4 },
  ];

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-[#0B0D14] select-none pointer-events-none',
        className
      )}
    >
      {/* Rotated Canvas Container */}
      <div
        className="absolute -inset-24 w-[150%] h-[150%] left-[-25%] top-[-25%] flex justify-center gap-6"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-6 overflow-hidden py-4">
            <motion.div
              animate={{
                y: col.reverse ? ['-50%', '0%'] : ['0%', '-50%'],
              }}
              transition={{
                duration: col.duration,
                ease: 'linear',
                repeat: Infinity,
              }}
              className="flex flex-col gap-6 shrink-0"
            >
              {col.items.map((card, itemIdx) => (
                <div
                  key={`${card.id}-${colIdx}-${itemIdx}`}
                  className={cn(
                    'relative h-[180px] w-[280px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-card shrink-0 group',
                    cardClassName
                  )}
                >
                  <img
                    src={card.url}
                    alt={card.title}
                    className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.05]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <div>
                      {card.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                          {card.category}
                        </span>
                      )}
                      <h4 className="text-xs font-bold mt-1 text-white line-clamp-1">
                        {card.title}
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Top & Bottom Fade Overlays */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-b from-[#0B0D14] via-transparent to-[#0B0D14] pointer-events-none opacity-80',
          fadeClassName
        )}
      />
    </div>
  );
};

export default DiagonalMarqueeCarousel;
