import React, { useState, useMemo, useEffect } from 'react';

// Standard French DTT (TNT) Channel Mapping
export const CHANNELS = [
  { number: 1, name: 'TF1' },
  { number: 2, name: 'France 2' },
  { number: 3, name: 'France 3' },
  { number: 4, name: 'Canal+' },
  { number: 5, name: 'France 5' },
  { number: 6, name: 'M6' },
  { number: 7, name: 'Arte' },
  { number: 8, name: 'C8' },
  { number: 9, name: 'W9' },
  { number: 10, name: 'TMC' },
  { number: 11, name: 'TFX' },
  { number: 12, name: 'NRJ 12' },
  { number: 13, name: 'LCP' },
  { number: 14, name: 'France 4' },
  { number: 15, name: 'BFM TV' },
  { number: 16, name: 'CNEWS' },
  { number: 17, name: 'CSTAR' },
  { number: 18, name: 'Gulli' },
  { number: 20, name: 'TF1 Séries Films' },
  { number: 21, name: "L'Équipe" },
  { number: 22, name: '6ter' },
  { number: 23, name: 'RMC Story' },
  { number: 24, name: 'RMC Découverte' },
  { number: 25, name: 'Chérie 25' },
  { number: 26, name: 'LCI' },
  { number: 27, name: 'France Info' },
  { number: 41, name: 'Paris Première' },
];

interface ChannelSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: (number: number, name: string) => void;
}

const ChannelSearch: React.FC<ChannelSearchProps> = ({ isOpen, onClose, onSelectChannel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm(''); // Reset on close
    }
  }, [isOpen]);

  const filteredChannels = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return CHANNELS.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.number.toString().includes(term)
    );
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start pt-20 justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()} // Prevent close when clicking inside
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <h3 className="text-gray-200 font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                Chaînes TV
            </h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900 border-b border-gray-800">
            <div className="relative">
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Rechercher (ex: LCI)..." 
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-950 scrollbar-thin scrollbar-thumb-gray-800">
            {filteredChannels.length === 0 ? (
                <div className="text-center text-gray-500 py-8 flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Aucune chaîne trouvée</span>
                </div>
            ) : (
                filteredChannels.map(channel => (
                    <button 
                        key={channel.number}
                        onClick={() => {
                            onSelectChannel(channel.number, channel.name);
                            onClose();
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-gray-800 rounded-xl transition-all duration-200 group text-left border border-transparent hover:border-gray-700"
                    >
                        <span className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-800 text-blue-400 font-bold rounded-lg group-hover:bg-blue-900/20 group-hover:text-blue-300 transition-colors shadow-inner">
                            {channel.number}
                        </span>
                        <span className="text-gray-300 group-hover:text-white font-medium flex-1">
                            {channel.name}
                        </span>
                        <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </span>
                    </button>
                ))
            )}
        </div>
        <div className="p-2 bg-gray-900 border-t border-gray-800 text-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Canaux TNT France</span>
        </div>
      </div>
    </div>
  );
};

export default ChannelSearch;