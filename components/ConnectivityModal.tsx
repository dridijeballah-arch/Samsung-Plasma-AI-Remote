import React, { useState, useEffect } from 'react';
import { HardwareConfig } from '../types';

interface ConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HardwareConfig;
  onSave: (config: HardwareConfig) => void;
}

const SOUND_OPTIONS = [
  { id: 'standard', name: 'Standard (Click)', url: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3' },
  { id: 'modern', name: 'Moderne (Pop)', url: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' },
  { id: 'retro', name: 'Rétro (Beep)', url: 'https://assets.mixkit.co/active_storage/sfx/2580/2580-preview.mp3' },
  { id: 'none', name: 'Silencieux', url: 'none' },
];

const ConnectivityModal: React.FC<ConnectivityModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<HardwareConfig>(config);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setIsDirty(false);
  }, [isOpen, config]);

  const handleChange = (key: keyof HardwareConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const playPreview = () => {
      const url = localConfig.soundEffect || SOUND_OPTIONS[0].url;
      if (url && url !== 'none') {
          const audio = new Audio(url);
          audio.volume = 0.5;
          audio.play().catch(() => {});
      }
  };

  const applyPreset = (type: 'tasmota' | 'generic' | 'ha') => {
      let url = '';
      if (type === 'tasmota') {
          url = 'http://192.168.1.XX/cm?cmnd=IrSend {"Protocol":"{PROTOCOL}","Bits":32,"Data":0x{KEY}}';
      } else if (type === 'ha') {
          url = 'http://homeassistant.local:8123/api/webhook/samsung_remote?key={KEY}&proto={PROTOCOL}';
      } else {
          url = 'http://192.168.1.XX/remote?cmd={KEY}&p={PROTOCOL}';
      }
      setLocalConfig(prev => ({ ...prev, bridgeUrl: url }));
      setIsDirty(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700 bg-[#222] flex justify-between items-center shrink-0">
            <h3 className="text-gray-100 font-bold flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
               Paramètres
            </h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* Audio Settings */}
            <div className="space-y-2 pb-4 border-b border-gray-800">
                <label className="text-sm text-gray-300 font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Son des touches
                </label>
                <div className="flex gap-2">
                    <select 
                        value={localConfig.soundEffect || SOUND_OPTIONS[0].url}
                        onChange={(e) => handleChange('soundEffect', e.target.value)}
                        className="flex-1 bg-black border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                    >
                        {SOUND_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.url}>{opt.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={playPreview}
                        className="p-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
                        title="Tester le son"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                </div>
            </div>

            {/* Hardware Toggle */}
            <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex flex-col">
                    <span className="text-white font-medium">Pont WiFi vers IR</span>
                    <span className="text-xs text-gray-400">Activer le contrôle réel</span>
                </div>
                <button 
                    onClick={() => handleChange('enabled', !localConfig.enabled)}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 relative ${localConfig.enabled ? 'bg-green-600' : 'bg-gray-600'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${localConfig.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
            </div>

            {/* URL Config */}
            <div className={`space-y-4 transition-opacity duration-300 ${localConfig.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="space-y-2">
                    <label className="text-sm text-gray-300 font-medium">URL du Pont / Webhook</label>
                    <input 
                        type="text" 
                        value={localConfig.bridgeUrl}
                        onChange={(e) => handleChange('bridgeUrl', e.target.value)}
                        placeholder="http://192.168.1.50/api?code={KEY}"
                        className="w-full bg-black border border-gray-600 rounded-lg p-3 text-sm text-blue-400 font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] text-gray-500">
                            <code className="bg-gray-800 px-1 rounded text-gray-300">{`{KEY}`}</code> : Nom du bouton (ex: VOL_UP).
                        </p>
                        <p className="text-[10px] text-gray-500">
                            <code className="bg-gray-800 px-1 rounded text-gray-300">{`{PROTOCOL}`}</code> : Protocole IR détecté.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => applyPreset('tasmota')} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-700 text-gray-300">Preset Tasmota</button>
                    <button onClick={() => applyPreset('ha')} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded border border-gray-700 text-gray-300">Preset HomeAssistant</button>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                     <span className="text-sm text-gray-400">Méthode HTTP:</span>
                     <div className="flex bg-gray-800 rounded p-1">
                        <button 
                            onClick={() => handleChange('method', 'GET')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${localConfig.method === 'GET' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                        >GET</button>
                        <button 
                            onClick={() => handleChange('method', 'POST')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${localConfig.method === 'POST' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}
                        >POST</button>
                     </div>
                </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-3">
                <p className="text-xs text-blue-300/80">
                    <span className="font-bold">Info:</span> Compatible avec les modules ESP8266/ESP32 (Tasmota IR) ou Broadlink pour contrôler une vraie TV.
                </p>
            </div>

            {/* About / Open Source */}
            <div className="pt-4 border-t border-gray-800 text-center">
                <p className="text-xs font-bold text-gray-400 mb-1">Samsung Plasma AI Remote v1.0</p>
                <p className="text-[10px] text-gray-600">
                    Projet Open Source • Licence MIT<br/>
                    Propulsé par Google Gemini 2.5 Flash
                </p>
                <div className="flex justify-center gap-4 mt-3">
                     <span className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 border border-gray-700">React 19</span>
                     <span className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 border border-gray-700">Tailwind</span>
                     <span className="px-2 py-1 bg-gray-800 rounded text-[10px] text-gray-400 border border-gray-700">GenAI SDK</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#222] border-t border-gray-700 flex justify-end shrink-0">
            <button 
                onClick={handleSave}
                disabled={!isDirty}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
                Enregistrer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectivityModal;