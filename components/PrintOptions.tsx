
import React from 'react';
import { PRINTERS, CARD_SIZES } from '../constants';
import { Printer, CreditCard, Clock, CheckCircle } from 'lucide-react';

export const PrintOptions: React.FC = () => {
  return (
    <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-xl font-cinzel mb-4 flex items-center gap-2">
          <Printer className="w-6 h-6 text-amber-500" />
          Print-On-Demand Comparison
        </h2>
        <div className="grid gap-4">
          {PRINTERS.map(printer => (
            <div key={printer.name} className="bg-stone-800/50 border border-stone-700/50 rounded-lg p-4 hover:border-amber-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="font-bold text-lg mb-1">{printer.name}</div>
                <div className="flex flex-wrap gap-2">
                  {printer.features.map(f => (
                    <span key={f} className="text-[10px] bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <div className="text-right">
                  <div className="text-xs text-stone-500 uppercase tracking-tighter">Starting at</div>
                  <div className="text-xl font-bold text-amber-400">${printer.pricePerDeck.toFixed(2)}</div>
                  <div className="text-[10px] text-stone-500">per deck</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-stone-500 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" /> Delivery
                  </div>
                  <div className="text-sm font-medium">{printer.deliveryTime}</div>
                </div>
                <button className="bg-amber-600 hover:bg-amber-500 text-white p-2 rounded-lg transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-xl font-cinzel mb-4">Deck Specifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(CARD_SIZES).map(([key, value]) => (
            <div key={key} className="bg-stone-800/50 p-4 rounded-lg border border-stone-700 text-center">
              <div className="text-sm font-bold text-stone-300 mb-1">{value.label}</div>
              <div className="text-xs text-stone-500">{value.dims}</div>
              <div className="text-[10px] text-stone-600 mt-1">{value.px.w}x{value.px.h}px</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
