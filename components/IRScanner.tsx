import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RemoteKey } from '../types';

interface IRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onFound: (protocol: string) => void;
  onTestSignal: (key: RemoteKey, protocol?: string) => void;
  savedProtocol?: string | null;
}

// Liste étendue de protocoles (Legacy & Generic)
const PROTOCOLS = [
  // --- Samsung Specific ---
  { id: 'sam_legacy_1', name: 'Samsung Legacy (2008-2010)', type: 'NEC 38kHz' },
  { id: 'sam_plasma_a', name: 'Samsung Plasma Type A', type: 'NEC Discrete' },
  { id: 'sam_plasma_b', name: 'Samsung Plasma Type B', type: 'RC5 Extended' },
  { id: 'sam_lcd_2012', name: 'Samsung LCD Series 5/6', type: 'Samsung 38kHz' },
  { id: 'sam_smart_v1', name: 'Samsung Smart Gen 1', type: 'RF/IR Hybrid' },

  // --- Grandes Marques (Legacy / CRT / Old Flat Panel) ---
  { id: 'sony_sirc_12', name: 'Sony Trinitron (Old)', type: 'SIRC 12-bit' },
  { id: 'sony_sirc_15', name: 'Sony Bravia (Legacy)', type: 'SIRC 15-bit' },
  { id: 'philips_rc5', name: 'Philips/Magnavox (CRT)', type: 'RC-5 Protocol' },
  { id: 'lg_goldstar', name: 'LG / Goldstar Legacy', type: 'NEC 38kHz Mod.' },
  { id: 'panasonic_old', name: 'Panasonic Viera (Old)', type: 'Panasonic Pulse' },
  { id: 'thomson_rca', name: 'Thomson / RCA Legacy', type: 'Pulse Distance' },
  
  // --- Génériques / Inconnus / Import ---
  { id: 'gen_nec_00ff', name: 'Generic NEC (Code 00FF)', type: 'Standard NEC' },
  { id: 'univ_funai', name: 'Funai / Sanyo Generic', type: 'NEC Variant' },
  { id: 'univ_a', name: 'Universal Set A (Global)', type: 'Pulse Width' }
];

// Base de données codes manuels (Extraits PDF OneForAll URC-7960)
const TV_CODES: Record<string, string[]> = {
  "Samsung": ["0812", "2051", "0618", "0178", "0587", "0009", "0093", "2094", "1619", "0556", "1249", "0037", "0264", "0208", "0226"],
  "Sony": ["1505", "1825", "1651", "0650", "0653", "0074", "0037", "0556", "0093", "0170"],
  "LG": ["1423", "2182", "0178", "1663", "0037", "1305", "0556", "1721", "0009", "2057", "0714", "1539"],
  "Philips": ["0037", "0556", "1506", "0605", "0178", "0108", "0343", "0009", "0556", "0605"],
  "Panasonic": ["0650", "1310", "1636", "0226", "0108", "1650", "0037", "0556", "0208", "0508"],
  "Toshiba": ["1508", "0508", "0650", "0093", "0009", "0035", "0714", "0264", "0412", "0618"],
  "Sharp": ["0093", "0009", "1193", "1659", "1393", "2214", "0650", "0653", "0412"],
  "Grundig": ["0195", "0508", "1223", "0037", "2059", "2127", "0487", "0556", "0587", "1037"],
  "Hitachi": ["1576", "0178", "0009", "0481", "0578", "0719", "2207", "0225", "0108", "0744"],
  "Hisense": ["1363", "0208", "0009", "0508", "0753", "0698", "0891", "0860", "0780", "1208"],
  "TCL": ["1916", "0625", "0412", "0698", "0706"],
  "Thomson": ["0560", "0625", "0109", "0343", "0287", "0753", "0335", "0037", "0556", "1588"],
  "JVC": ["0653", "0606", "1653", "0371", "0508", "0093", "0650"],
  "Pioneer": ["1260", "1457", "0679", "0698", "0109", "0170", "0037", "0287", "0556", "0343"]
};

const IRScanner: React.FC<IRScannerProps> = ({ isOpen, onClose, onFound, onTestSignal, savedProtocol }) => {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [scanning, setScanning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [foundProtocol, setFoundProtocol] = useState<{id: string, name: string} | null>(null);
  
  // Manual Mode State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  const scanIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScan();
      setFoundProtocol(null);
      setCurrentIndex(0);
      setProgress(0);
      setSearchTerm('');
      setSelectedBrand(null);
    }
  }, [isOpen]);

  const startScan = () => {
    setScanning(true);
    setFoundProtocol(null);
    setCurrentIndex(0);
    setProgress(0);

    const stepTime = 1200; 

    scanIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        
        if (next >= PROTOCOLS.length) {
          setTimeout(stopScan, 0);
          return 0; 
        }
        
        setTimeout(() => {
             const protocol = PROTOCOLS[next];
             onTestSignal(RemoteKey.POWER, protocol.id);
        }, 0);

        setProgress((next / PROTOCOLS.length) * 100);
        return next;
      });
    }, stepTime);
  };

  const stopScan = () => {
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleProtocolSelect = (id: string, name: string) => {
    stopScan();
    setFoundProtocol({ id, name });
    onFound(id);
    // Auto close after short delay
    setTimeout(() => onClose(), 1500);
  };

  const filteredBrands = useMemo(() => {
      if (!searchTerm) return Object.keys(TV_CODES).sort();
      return Object.keys(TV_CODES).filter(b => b.toLowerCase().includes(searchTerm.toLowerCase())).sort();
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* Header Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900/50">
            <button 
                onClick={() => setActiveTab('auto')}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'auto' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                AUTO SCAN
            </button>
            <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
                CODES IR
            </button>
        </div>

        {activeTab === 'auto' ? (
            /* --- AUTO SCANNER MODE --- */
            <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center">
                {/* Radar Background */}
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-blue-500/30 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] border border-blue-500/30 rounded-full"></div>
                    {scanning && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-spin duration-1000 rounded-full blur-xl"></div>
                    )}
                </div>

                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-800 flex items-center justify-center relative mb-6 bg-gray-950 shadow-inner">
                        {foundProtocol ? (
                            <div className="text-green-500 animate-in zoom-in duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                        ) : (
                            <>
                                <div className={`font-mono font-bold ${scanning ? 'text-blue-500 text-3xl' : 'text-gray-500 text-lg'}`}>
                                    {scanning ? `${Math.floor(progress)}%` : 'READY'}
                                </div>
                                {scanning && (
                                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="w-full bg-gray-800/50 rounded-lg p-3 mb-6 border border-gray-700 min-h-[90px] flex flex-col justify-center">
                        {foundProtocol ? (
                            <>
                                <span className="text-green-400 font-bold text-sm">SUCCÈS</span>
                                <span className="text-gray-300 text-xs mt-1">{foundProtocol.name}</span>
                            </>
                        ) : scanning ? (
                            <>
                                <span className="text-blue-400 text-xs uppercase tracking-widest mb-1 animate-pulse">Test signal {currentIndex + 1}/{PROTOCOLS.length}</span>
                                <span className="text-white font-bold truncate px-2">{PROTOCOLS[currentIndex]?.name}</span>
                            </>
                        ) : savedProtocol ? (
                            <>
                                <span className="text-green-400 text-xs uppercase tracking-widest mb-1">Actuel</span>
                                <span className="text-white font-bold truncate">{PROTOCOLS.find(p => p.id === savedProtocol)?.name || savedProtocol}</span>
                            </>
                        ) : (
                            <span className="text-gray-400 text-sm">Appuyez sur "Scanner" pour tester les codes connus.</span>
                        )}
                    </div>

                    <div className="w-full space-y-3">
                        {foundProtocol ? (
                             <button disabled className="w-full bg-green-600/90 text-white font-bold py-3 rounded-xl">Mémorisé !</button>
                        ) : scanning ? (
                            <div className="flex gap-3">
                                <button onClick={() => handleProtocolSelect(PROTOCOLS[currentIndex].id, PROTOCOLS[currentIndex].name)} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-900/20">Ça marche !</button>
                                <button onClick={stopScan} className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl">Stop</button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={startScan} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/20">
                                    {savedProtocol ? 'Rescanner' : 'Scanner'}
                                </button>
                                <button onClick={onClose} className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl">Fermer</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            /* --- MANUAL CODE LIST MODE --- */
            <div className="flex-1 flex flex-col overflow-hidden bg-gray-950">
                 {/* Search Bar */}
                 <div className="p-4 bg-gray-900 border-b border-gray-800 z-10">
                    <input 
                        type="text"
                        placeholder="Chercher une marque..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm"
                    />
                 </div>

                 {/* Content List */}
                 <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800">
                     {selectedBrand ? (
                         <div className="animate-in slide-in-from-right-10 duration-200">
                             <button 
                                onClick={() => setSelectedBrand(null)}
                                className="mb-2 flex items-center gap-2 text-blue-400 text-sm font-bold p-2 hover:bg-gray-900 rounded-lg w-full"
                             >
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                 Retour aux marques
                             </button>
                             <div className="px-2 pb-2">
                                 <h3 className="text-white font-bold text-lg mb-3">{selectedBrand}</h3>
                                 <div className="grid grid-cols-2 gap-3">
                                     {TV_CODES[selectedBrand].map((code) => (
                                         <div key={code} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex flex-col gap-2">
                                             <div className="flex justify-between items-center">
                                                 <span className="font-mono text-xl font-bold text-white tracking-widest">{code}</span>
                                                 {savedProtocol === code && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                             </div>
                                             <div className="flex gap-2 mt-1">
                                                 <button 
                                                    onClick={() => onTestSignal(RemoteKey.POWER, code)}
                                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1.5 rounded"
                                                 >
                                                     Test
                                                 </button>
                                                 <button 
                                                    onClick={() => handleProtocolSelect(code, `${selectedBrand} ${code}`)}
                                                    className={`flex-1 text-xs font-bold py-1.5 rounded ${savedProtocol === code ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                                 >
                                                     {savedProtocol === code ? 'Actif' : 'Choisir'}
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-1">
                             {filteredBrands.map(brand => (
                                 <button
                                    key={brand}
                                    onClick={() => setSelectedBrand(brand)}
                                    className="w-full text-left p-3 hover:bg-gray-900 rounded-xl flex justify-between items-center group transition-colors"
                                 >
                                     <span className="text-gray-300 group-hover:text-white font-medium">{brand}</span>
                                     <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">{TV_CODES[brand].length} codes</span>
                                 </button>
                             ))}
                             {filteredBrands.length === 0 && (
                                 <div className="text-center text-gray-500 py-8 text-sm">Aucune marque trouvée</div>
                             )}
                         </div>
                     )}
                 </div>
                 
                 {/* Footer Manual */}
                 {activeTab === 'manual' && (
                    <div className="p-3 bg-gray-900 border-t border-gray-800 flex justify-end">
                        <button onClick={onClose} className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-lg text-sm">Fermer</button>
                    </div>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default IRScanner;