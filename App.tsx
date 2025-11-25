import React, { useState, useEffect, useRef } from 'react';
import { VirtualRemote } from './components/VirtualRemote';
import SmartAssistant from './components/SmartAssistant';
import ChannelSearch, { CHANNELS } from './components/ChannelSearch';
import IRScanner from './components/IRScanner';
import ConnectivityModal from './components/ConnectivityModal';
import { RemoteKey, TvState, HardwareConfig } from './types';

const DEFAULT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';

// Interface helper for shortcut values
interface ShortcutItem {
    number: number;
    name: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'remote' | 'assistant'>('remote');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [ledActive, setLedActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Auto-start voice listening when switching to assistant via FAB
  const [autoListen, setAutoListen] = useState(false);
  
  // Shortcut Management
  const [shortcuts, setShortcuts] = useState<Record<string, ShortcutItem>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('samsung_shortcuts');
        if (saved) return JSON.parse(saved);
    }
    return {};
  });
  
  // State for shortcut assignment
  const [assignTargetKey, setAssignTargetKey] = useState<RemoteKey | null>(null);
  const [shortcutMenuKey, setShortcutMenuKey] = useState<RemoteKey | null>(null); // For the "Zap vs Edit" modal

  // Load saved protocol from localStorage
  const [configuredProtocol, setConfiguredProtocol] = useState<string | null>(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem('samsung_ir_protocol');
      }
      return null;
  });

  // Hardware Bridge Configuration
  const [hardwareConfig, setHardwareConfig] = useState<HardwareConfig>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('samsung_hw_config');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migration for older saves that didn't have soundEffect
            if (!parsed.soundEffect) parsed.soundEffect = DEFAULT_SOUND;
            return parsed;
        }
    }
    return { enabled: false, bridgeUrl: '', method: 'GET', soundEffect: DEFAULT_SOUND };
  });
  
  // Simulated TV State for visual feedback
  const [tvState, setTvState] = useState<TvState>({
    isOn: false,
    volume: 15,
    channel: 1,
    source: 'TV',
    isMuted: false,
  });

  const [notification, setNotification] = useState<string | null>(null);

  // References for channel digit buffering
  const channelBufferRef = useRef<string>("");
  const channelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showNotification("Connexion rétablie"); };
    const handleOffline = () => { setIsOnline(false); showNotification("Mode Hors Ligne"); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Helper to show temporary notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
        setNotification(prev => prev === msg ? null : prev);
    }, 2500);
  };

  const handleProtocolFound = (protocolId: string) => {
      localStorage.setItem('samsung_ir_protocol', protocolId);
      setConfiguredProtocol(protocolId);
      showNotification(`Protocole Mémorisé!`);
  };

  const handleSaveHardwareConfig = (config: HardwareConfig) => {
      setHardwareConfig(config);
      localStorage.setItem('samsung_hw_config', JSON.stringify(config));
      showNotification(config.enabled ? "Pont matériel activé" : "Paramètres sauvegardés");
  };

  /**
   * Core Logic: Calculates the next state based on the current state and key press.
   * Returns the new state and a notification message, or null if no change.
   */
  const calculateNextState = (current: TvState, key: RemoteKey): { state: TvState, msg: string } | null => {
      const next = { ...current };
      
      // 1. Handle Power (Always works)
      if (key === RemoteKey.POWER) {
          next.isOn = !current.isOn;
          // Reset buffer on power toggle
          channelBufferRef.current = ""; 
          return { 
              state: next, 
              msg: next.isOn ? "Allumage TV..." : "Extinction TV" 
          };
      }

      // 2. If TV is Off (Simulated), block other actions UNLESS we are in pure hardware mode
      // (In hardware mode, we can't be sure of the real TV state, so we process anyway, 
      // but for the UI simulation we restrict it).
      if (!current.isOn) {
          return { state: current, msg: "TV éteinte" };
      }

      switch (key) {
          case RemoteKey.VOL_UP:
              if (current.volume >= 100) return { state: current, msg: "Volume Max (100)" };
              next.volume = current.volume + 1;
              if (next.isMuted) next.isMuted = false; // Auto-unmute
              return { state: next, msg: `Volume ${next.volume}` };

          case RemoteKey.VOL_DOWN:
              if (current.volume <= 0) return { state: current, msg: "Volume Min (0)" };
              next.volume = current.volume - 1;
              if (next.isMuted) next.isMuted = false; // Auto-unmute
              return { state: next, msg: `Volume ${next.volume}` };

          case RemoteKey.MUTE:
              next.isMuted = !current.isMuted;
              return { state: next, msg: next.isMuted ? "Sourdine Activée" : "Son Rétabli" };

          case RemoteKey.CH_UP:
              next.channel = current.channel + 1;
              return { state: next, msg: `Chaîne ${next.channel}` };

          case RemoteKey.CH_DOWN:
              next.channel = Math.max(1, current.channel - 1);
              return { state: next, msg: `Chaîne ${next.channel}` };

          case RemoteKey.SOURCE:
              const sources = ['TV', 'HDMI1', 'HDMI2', 'AV'];
              const idx = sources.indexOf(current.source);
              next.source = sources[(idx + 1) % sources.length];
              return { state: next, msg: `Source: ${next.source}` };

          default:
              // For other keys (Menu, Tools, Arrows), we just notify but don't change state
              return { state: next, msg: `Commande: ${key}` };
      }
  };

  /**
   * Main handler for remote actions.
   * @param key The remote key pressed
   * @param protocolOverride Optional protocol ID to force usage (used during scanning)
   */
  const handleRemotePress = (key: RemoteKey, protocolOverride?: string) => {
    // 1. Visual & Audio Feedback (Immediate)
    setLedActive(true);
    setTimeout(() => setLedActive(false), 150);

    const soundUrl = hardwareConfig.soundEffect || DEFAULT_SOUND;
    if (soundUrl !== 'none') {
        const audio = new Audio(soundUrl);
        audio.volume = 0.2;
        audio.play().catch(() => {});
    }

    // 2. Hardware Bridge Logic (Independent of App State validation to ensure robustness)
    if (hardwareConfig.enabled && hardwareConfig.bridgeUrl) {
        let url = hardwareConfig.bridgeUrl.replace('{KEY}', key);
        
        // Inject Protocol if available (either from override during scan or saved config)
        const protocolToSend = protocolOverride || configuredProtocol || 'sam_legacy_1'; 
        url = url.replace('{PROTOCOL}', protocolToSend);
        
        fetch(url, { method: hardwareConfig.method, mode: 'no-cors' })
        .catch(err => console.error('Bridge Error:', err));
    }

    // 3. Digit Handling (Channel Buffer)
    const isDigit = ['0','1','2','3','4','5','6','7','8','9'].includes(key);
    
    if (tvState.isOn && isDigit) {
        if (channelTimerRef.current) clearTimeout(channelTimerRef.current);
        channelBufferRef.current += key;
        showNotification(`${channelBufferRef.current}-`);
        channelTimerRef.current = setTimeout(confirmChannelBuffer, 2000);
        return;
    }

    if (tvState.isOn && key === RemoteKey.ENTER && channelBufferRef.current.length > 0) {
        confirmChannelBuffer();
        return;
    }

    // 4. Calculate & Apply Next State
    // If we are just scanning protocols (protocolOverride exists), we might not want to affect UI state too much
    // unless it's POWER. But for the UI simulation we restrict it.
    const result = calculateNextState(tvState, key);
    
    if (result) {
        setTvState(result.state);
        // Only show notification if significant change or specifically set
        if (result.msg) showNotification(result.msg);
    }
  };

  // Handle Long Press on Remote Buttons
  const handleRemoteLongPress = (key: RemoteKey) => {
      const isDigit = ['0','1','2','3','4','5','6','7','8','9'].includes(key);
      
      if (isDigit) {
          const existingShortcut = shortcuts[key];
          
          if (existingShortcut) {
              // Open Action Menu for existing shortcut
              setShortcutMenuKey(key);
          } else {
              // Open Assign Mode immediately
              setAssignTargetKey(key);
              setIsSearchOpen(true);
          }
      }
  };

  const handleChannelSelect = async (number: number, name: string) => {
      // Logic for Shortcut Assignment
      if (assignTargetKey) {
          const newShortcuts = { ...shortcuts, [assignTargetKey]: { number, name } };
          setShortcuts(newShortcuts);
          localStorage.setItem('samsung_shortcuts', JSON.stringify(newShortcuts));
          showNotification(`Mémorisé: Touche ${assignTargetKey} = ${name}`);
          setAssignTargetKey(null);
          // Don't zap immediately, just save
          return;
      }

      // Normal Zapping Logic
      showNotification(`Zap vers ${name}...`);
      
      const digits = number.toString().split('');
      
      for (const digit of digits) {
          const key = Object.values(RemoteKey).find(k => k === digit);
          if (key) {
              handleRemotePress(key);
              await new Promise(resolve => setTimeout(resolve, 400));
          }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      handleRemotePress(RemoteKey.ENTER);
  };

  const clearShortcut = (key: RemoteKey) => {
      const newShortcuts = { ...shortcuts };
      delete newShortcuts[key];
      setShortcuts(newShortcuts);
      localStorage.setItem('samsung_shortcuts', JSON.stringify(newShortcuts));
      setShortcutMenuKey(null);
      showNotification(`Raccourci ${key} effacé`);
  };

  const confirmChannelBuffer = () => {
      if (channelTimerRef.current) clearTimeout(channelTimerRef.current);
      
      if (channelBufferRef.current.length > 0) {
        const num = parseInt(channelBufferRef.current);
        if (!isNaN(num)) {
            setTvState(prev => ({ ...prev, channel: num }));
            showNotification(`Chaîne ${num}`);
        }
        channelBufferRef.current = "";
      }
  };

  const currentChannelName = CHANNELS.find(c => c.number === tvState.channel)?.name;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black z-0 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full z-20 bg-gray-900/90 backdrop-blur-md p-4 sticky top-0 border-b border-gray-800 flex justify-between items-center shadow-lg">
        <div>
           <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
             <span>PLASMA<span className="text-blue-500">REMOTE</span></span>
           </h1>
           <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
               {!isOnline ? (
                    <span className="text-red-500 flex items-center gap-1 font-bold">⚠ HORS LIGNE</span>
               ) : hardwareConfig.enabled ? (
                   <span className="text-green-500 flex items-center gap-1">● ONLINE</span>
               ) : (
                   <span className="text-gray-500">OFFLINE SIM</span>
               )}
           </p>
        </div>
        <div className="flex items-center gap-2">
             {/* Settings Button (Real HW) */}
             <button
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2.5 rounded-full transition-all active:scale-95 border ${hardwareConfig.enabled ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-gray-800 text-gray-400 border-transparent hover:text-white hover:bg-gray-700'}`}
                title="Configuration & Paramètres"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
             </button>

             {/* IR Scanner Button */}
             <button
                onClick={() => setIsScannerOpen(true)}
                className={`p-2.5 rounded-full transition-all active:scale-95 border ${configuredProtocol ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800 text-gray-400 border-transparent hover:text-green-400 hover:bg-gray-700 hover:border-gray-600'}`}
                title={configuredProtocol ? `Configuré: ${configuredProtocol}` : "Scanner IR"}
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h5"/><path d="M17 12h5"/><path d="M7 12a5 5 0 0 1 5-5"/><path d="M7 12a5 5 0 0 0 5 5"/><path d="M17 12a5 5 0 0 0-5-5"/><path d="M17 12a5 5 0 0 1-5 5"/></svg>
             </button>

             {/* Channel Search Button */}
             <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-full bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all active:scale-95"
                title="Rechercher une chaîne"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
             </button>
             
             <div className="h-6 w-px bg-gray-700 mx-1"></div>
             
             <div className="flex bg-gray-800 rounded-full p-1">
                <button 
                    onClick={() => setActiveTab('remote')}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${activeTab === 'remote' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-300'}`}
                >
                    REMOTE
                </button>
                <button 
                    onClick={() => {
                        if (isOnline) {
                            setActiveTab('assistant');
                        } else {
                            showNotification("Assistant Indisponible Hors Ligne");
                        }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${activeTab === 'assistant' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-300'} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    VOICE AI
                </button>
             </div>
        </div>
      </header>

      {/* Persistent Status Bar */}
      <div className="w-full bg-[#0d1117] border-b border-gray-800 py-3 px-6 flex items-center justify-between z-10 shadow-xl shrink-0">
          {/* Power State */}
          <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${tvState.isOn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
              <span className={`text-xs font-mono font-bold ${tvState.isOn ? 'text-green-400' : 'text-red-400'}`}>{tvState.isOn ? 'ON' : 'OFF'}</span>
          </div>

          {/* Channel Info */}
          <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">CH</span>
                <div className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${tvState.isOn ? 'text-white' : 'text-gray-600'}`}>{tvState.isOn ? tvState.channel : '--'}</span>
                    {tvState.isOn && currentChannelName && <span className="text-[10px] text-blue-400 max-w-[80px] truncate hidden sm:inline-block">{currentChannelName}</span>}
                </div>
          </div>

          {/* Volume Info */}
            <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">VOL</span>
                <span className={`text-sm font-bold ${!tvState.isOn ? 'text-gray-600' : tvState.isMuted ? 'text-red-500' : 'text-blue-400'}`}>
                {tvState.isOn ? (tvState.isMuted ? 'MUTE' : tvState.volume) : '--'}
                </span>
            </div>

          {/* Source Info */}
          <div className="flex flex-col items-end min-w-[50px]">
                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">SRC</span>
                <span className={`text-xs font-bold ${tvState.isOn ? 'text-gray-300' : 'text-gray-600'}`}>{tvState.isOn ? tvState.source : '--'}</span>
          </div>
      </div>

      {/* Connectivity Settings Modal */}
      <ConnectivityModal
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         config={hardwareConfig}
         onSave={handleSaveHardwareConfig}
      />

      {/* Channel Search / Assignment Modal */}
      <ChannelSearch 
         isOpen={isSearchOpen} 
         onClose={() => {
             setIsSearchOpen(false);
             setAssignTargetKey(null); // Clear assignment state on close
         }} 
         onSelectChannel={handleChannelSelect}
         customTitle={assignTargetKey ? `Assigner au Bouton ${assignTargetKey}` : undefined}
      />

      {/* IR Scanner Modal */}
      <IRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onTestSignal={(key, proto) => handleRemotePress(key, proto)}
        onFound={handleProtocolFound}
        savedProtocol={configuredProtocol}
      />

      {/* Shortcut Action Menu (When long-pressing an existing favorite) */}
      {shortcutMenuKey && shortcuts[shortcutMenuKey] && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShortcutMenuKey(null)}>
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
                  <div className="text-center">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/50">
                          <span className="text-xl font-bold text-white">{shortcutMenuKey}</span>
                      </div>
                      <h3 className="text-white font-bold text-lg">Raccourci Détecté</h3>
                      <p className="text-gray-400 text-sm">Chaîne: {shortcuts[shortcutMenuKey].name}</p>
                  </div>
                  
                  <button 
                      onClick={() => {
                          const s = shortcuts[shortcutMenuKey];
                          handleChannelSelect(s.number, s.name);
                          setShortcutMenuKey(null);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Regarder maintenant
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => {
                              setAssignTargetKey(shortcutMenuKey);
                              setShortcutMenuKey(null);
                              setIsSearchOpen(true);
                          }}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-all"
                      >
                          Modifier
                      </button>
                      <button 
                          onClick={() => clearShortcut(shortcutMenuKey)}
                          className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium py-3 rounded-xl transition-all border border-red-900/50"
                      >
                          Effacer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Simulated Screen Overlay (Notification) */}
      <div className={`fixed top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${notification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
         <div className="bg-black/80 backdrop-blur-md border border-gray-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[200px] justify-center">
             {tvState.isOn && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>}
             <span className="font-mono text-lg tracking-wide text-blue-100">{notification}</span>
         </div>
      </div>

      {/* Content Area */}
      <main className="w-full max-w-md flex-1 z-10 p-4 pb-24 relative overflow-y-auto hide-scrollbar mx-auto">
        {activeTab === 'remote' ? (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Dashboard Removed - Now in Persistent Status Bar */}
               
               {/* Quick Favorites Bar */}
               <div className="mb-6 animate-in slide-in-from-right-4 fade-in duration-500 delay-100 mt-2">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-500"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Favoris & Raccourcis
                        </span>
                        <button onClick={() => setIsSearchOpen(true)} className="text-[10px] text-blue-400 font-bold hover:text-blue-300">VOIR TOUT</button>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                        {/* 1. User Defined Shortcuts first */}
                        {Object.entries(shortcuts).map(([key, value]) => {
                             const channel = value as ShortcutItem;
                             return (
                             <button
                                key={`shortcut-${key}`}
                                onClick={() => handleChannelSelect(channel.number, channel.name)}
                                className="flex-shrink-0 snap-start flex flex-col items-center gap-1.5 group relative"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-blue-500/20 transition-all active:scale-95 ${tvState.channel === channel.number ? 'bg-blue-600 text-white shadow-blue-900/40 scale-105 ring-2 ring-blue-400' : 'bg-gray-800 text-blue-400 hover:bg-gray-700 hover:text-white'}`}>
                                    <span className="text-xl font-bold tracking-tighter">{channel.number}</span>
                                    <div className="absolute top-0 right-0 w-5 h-5 bg-blue-600 rounded-bl-lg rounded-tr-lg flex items-center justify-center text-[10px] font-bold text-white border-l border-b border-black">
                                        {key}
                                    </div>
                                </div>
                                <span className="text-[9px] text-gray-500 font-medium truncate max-w-[56px] group-hover:text-gray-300 transition-colors">{channel.name}</span>
                            </button>
                             );
                        })}
                        
                        {/* 2. Default Suggestions */}
                        {CHANNELS.filter(c => 
                            [1,2,3,4,6,15].includes(c.number) && 
                            !Object.values(shortcuts).some((s) => (s as ShortcutItem).number === c.number)
                        ).map((channel) => (
                            <button
                                key={channel.number}
                                onClick={() => handleChannelSelect(channel.number, channel.name)}
                                className="flex-shrink-0 snap-start flex flex-col items-center gap-1.5 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/5 transition-all active:scale-95 ${tvState.channel === channel.number ? 'bg-blue-600 text-white shadow-blue-900/40 scale-105 ring-2 ring-blue-400 ring-offset-2 ring-offset-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
                                    <span className="text-xl font-bold tracking-tighter">{channel.number}</span>
                                </div>
                                <span className="text-[9px] text-gray-500 font-medium truncate max-w-[56px] group-hover:text-gray-300 transition-colors">{channel.name}</span>
                            </button>
                        ))}
                    </div>
               </div>

               <VirtualRemote 
                    onPress={(key) => handleRemotePress(key)} 
                    ledActive={ledActive} 
                    shortcuts={shortcuts}
                    channelNumber={tvState.channel}
                    channelName={currentChannelName || ''}
                    isMuted={tvState.isMuted}
               />
               
               {/* Floating Voice Action Button */}
               <button
                    onClick={() => {
                        if (isOnline) {
                            setAutoListen(true);
                            setActiveTab('assistant');
                        } else {
                            showNotification("Nécessite Internet");
                        }
                    }}
                    className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.4)] flex items-center justify-center hover:bg-blue-500 active:scale-95 transition-all hover:-translate-y-1 animate-in zoom-in duration-300 ${!isOnline ? 'grayscale opacity-70' : ''}`}
                    title={isOnline ? "Commande Vocale Rapide" : "Indisponible Hors Ligne"}
               >
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
               </button>
           </div>
        ) : (
            <div className="h-[75vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SmartAssistant 
                    onCommand={handleRemotePress} 
                    onChannelSelect={handleChannelSelect}
                    tvState={tvState}
                    channels={CHANNELS}
                    isProcessing={isProcessing} 
                    setIsProcessing={setIsProcessing}
                    autoStart={autoListen}
                    onAutoStartHandled={() => setAutoListen(false)}
                />
            </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full z-20 py-6 text-center text-gray-800 text-[10px] absolute bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
          <p>POWERED BY GEMINI 2.5 FLASH</p>
          <p className="mt-1">SAMSUNG PLASMA LEGACY SERIES COMPATIBLE</p>
      </footer>

    </div>
  );
};

export default App;