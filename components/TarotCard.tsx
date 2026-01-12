
import React from 'react';
import { TarotCardData } from '../types';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface TarotCardProps {
  card: TarotCardData;
  onClick: () => void;
  isGenerating?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({ card, onClick, isGenerating }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative aspect-[2.75/4.75] bg-stone-900 rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all card-shadow"
    >
      {card.imageUrl ? (
        <img 
          src={card.imageUrl} 
          alt={card.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-950/50">
          <Sparkles className="w-8 h-8 text-stone-700 mb-2" />
          <span className="text-[10px] text-stone-600 uppercase tracking-widest leading-tight">{card.title}</span>
        </div>
      )}

      {/* Hover Preview Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-cinzel text-lg mb-2 text-white">{card.title}</h3>
          <p className="text-xs text-stone-300 line-clamp-3 mb-4">{card.prompt || "No prompt set"}</p>
          <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">Click to edit</div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="absolute top-2 right-2">
        {isGenerating ? (
          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
        ) : card.isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 drop-shadow-lg" />
        ) : null}
      </div>

      {/* Title Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent flex items-center justify-center">
        <span className={`font-cinzel text-[10px] px-2 text-center transition-colors duration-500 ${card.isCompleted ? 'text-amber-400' : 'text-stone-300'}`}>
          {card.title}
        </span>
      </div>
    </div>
  );
};
