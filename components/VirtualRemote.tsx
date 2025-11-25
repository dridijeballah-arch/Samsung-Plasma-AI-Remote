import React from 'react';
import RemoteButton from './RemoteButton';
import { RemoteKey } from '../types';

interface VirtualRemoteProps {
  onPress: (key: RemoteKey) => void;
  ledActive: boolean;
  shortcuts?: Record<string, { number: number; name: string }>;
  channelNumber: number;
  channelName: string;
  isMuted: boolean;
}

export const VirtualRemote: React.FC<VirtualRemoteProps> = ({ onPress, ledActive, channelNumber, channelName, isMuted }) => {
  return (
    <div className="w-full max-w-[320px] mx-auto bg-[#1a1a1a] rounded-[40px] p-6 shadow-2xl border-4 border-[#333] relative overflow-hidden">
        {/* Texture overlay */}
        <div className="absolute inset-0 brushed-metal opacity-20 pointer-events-none"></div>

        {/* Top Section: Power & Source */}
        <div className="relative z-10 flex justify-between items-center mb-5">
            <RemoteButton 
                remoteKey={RemoteKey.POWER} 
                onClick={onPress} 
                variant="power" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></svg>}
            />
            
            {/* IR Blaster / LED Indicator */}
            <div className={`w-3 h-3 rounded-full bg-red-900 transition-all duration-100 ${ledActive ? 'bg-red-500 led-glow' : ''}`}></div>

            <RemoteButton 
                remoteKey={RemoteKey.SOURCE} 
                onClick={onPress} 
                variant="source" 
                label="SOURCE"
            />
        </div>

        {/* LCD Info Display */}
        <div className="relative z-10 mx-4 mb-6 bg-[#0a0a0a] rounded border border-gray-700 p-2 flex items-center justify-between shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] h-14 overflow-hidden">
             {/* Glossy reflection effect */}
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
             
             <div className="flex flex-col">
                 <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Channel</span>
                 <span className="text-blue-500 font-mono font-bold text-xl leading-none tracking-widest text-shadow-glow">
                     {channelNumber.toString().padStart(2, '0')}
                 </span>
             </div>
             
             <div className="flex-1 text-right pl-3 overflow-hidden">
                 <span className="text-gray-300 text-xs font-semibold tracking-wider uppercase truncate block">
                    {channelName || '---'}
                 </span>
             </div>
        </div>

        {/* Number Pad */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
            <RemoteButton remoteKey={RemoteKey.KEY_1} onClick={onPress} label="1" />
            <RemoteButton remoteKey={RemoteKey.KEY_2} onClick={onPress} label="2" />
            <RemoteButton remoteKey={RemoteKey.KEY_3} onClick={onPress} label="3" />
            <RemoteButton remoteKey={RemoteKey.KEY_4} onClick={onPress} label="4" />
            <RemoteButton remoteKey={RemoteKey.KEY_5} onClick={onPress} label="5" />
            <RemoteButton remoteKey={RemoteKey.KEY_6} onClick={onPress} label="6" />
            <RemoteButton remoteKey={RemoteKey.KEY_7} onClick={onPress} label="7" />
            <RemoteButton remoteKey={RemoteKey.KEY_8} onClick={onPress} label="8" />
            <RemoteButton remoteKey={RemoteKey.KEY_9} onClick={onPress} label="9" />
            
            {/* Bottom Row of Numpad */}
            <RemoteButton remoteKey={RemoteKey.PRE_CH} onClick={onPress} label="PRE-CH" variant="small" className="mx-auto" />
            <RemoteButton remoteKey={RemoteKey.KEY_0} onClick={onPress} label="0" />
            <RemoteButton remoteKey={RemoteKey.INFO} onClick={onPress} label="INFO" variant="small" className="mx-auto"/>
        </div>

        {/* Volume / Channel Rockers */}
        <div className="relative z-10 flex justify-between items-center px-4 mb-6">
            <div className="flex flex-col items-center gap-2">
                <RemoteButton 
                    remoteKey={RemoteKey.VOL_UP} 
                    onClick={onPress} 
                    variant="rocker" 
                    icon={<span>+</span>}
                    className="rounded-b-none h-14 border-b-0"
                />
                 <div className="text-xs text-gray-500 font-bold tracking-widest">VOL</div>
                <RemoteButton 
                    remoteKey={RemoteKey.VOL_DOWN} 
                    onClick={onPress} 
                    variant="rocker" 
                    icon={<span>-</span>}
                    className="rounded-t-none h-14 border-t-0"
                />
            </div>
            
            <RemoteButton 
                remoteKey={RemoteKey.MUTE} 
                onClick={onPress} 
                variant="small" 
                className={isMuted ? "text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "text-gray-400"}
                icon={isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" x2="1" y1="1" y2="23"/></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" x2="17" y1="9" y2="15"/><line x1="17" x2="23" y1="9" y2="15"/></svg>
                )}
            />

            <div className="flex flex-col items-center gap-2">
                <RemoteButton 
                    remoteKey={RemoteKey.CH_UP} 
                    onClick={onPress} 
                    variant="rocker" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>}
                    className="rounded-b-none h-14 border-b-0"
                />
                 <div className="text-xs text-gray-500 font-bold tracking-widest">CH</div>
                <RemoteButton 
                    remoteKey={RemoteKey.CH_DOWN} 
                    onClick={onPress} 
                    variant="rocker" 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>}
                    className="rounded-t-none h-14 border-t-0"
                />
            </div>
        </div>

        {/* Functional Control Cluster (Menu, Guide, Tools, etc) */}
        <div className="relative z-10 grid grid-cols-3 gap-x-2 gap-y-3 px-2 mb-4">
            <RemoteButton remoteKey={RemoteKey.MENU} onClick={onPress} label="MENU" variant="small" />
            <RemoteButton remoteKey={RemoteKey.SMART_HUB} onClick={onPress} icon={
                <div className="w-4 h-4 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 rounded-sm"></div>
            } variant="normal" className="w-full h-8 rounded-lg" />
            <RemoteButton remoteKey={RemoteKey.GUIDE} onClick={onPress} label="GUIDE" variant="small" />
            
            <RemoteButton remoteKey={RemoteKey.TOOLS} onClick={onPress} label="TOOLS" variant="small" />
            <RemoteButton remoteKey={RemoteKey.E_MANUAL} onClick={onPress} label="e-MAN" variant="small" className="text-[9px]" />
            <RemoteButton 
                remoteKey={RemoteKey.PROGRAM} 
                onClick={onPress} 
                label={<div className="flex flex-col leading-none py-0.5"><span>CH</span><span>LIST</span></div>} 
                variant="small" 
                className="text-[9px]" 
            />
        </div>

        {/* D-Pad */}
        <div className="relative z-10 w-48 h-48 mx-auto bg-gray-900 rounded-full border border-gray-800 shadow-inner flex items-center justify-center mb-6">
             {/* Up */}
             <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12">
                <RemoteButton remoteKey={RemoteKey.UP} onClick={onPress} variant="dpad" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>} className="rounded-t-lg" />
             </div>
             {/* Down */}
             <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-12">
                <RemoteButton remoteKey={RemoteKey.DOWN} onClick={onPress} variant="dpad" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>} className="rounded-b-lg" />
             </div>
             {/* Left */}
             <div className="absolute left-1 top-1/2 -translate-y-1/2 w-12 h-12">
                <RemoteButton remoteKey={RemoteKey.LEFT} onClick={onPress} variant="dpad" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>} className="rounded-l-lg" />
             </div>
             {/* Right */}
             <div className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12">
                <RemoteButton remoteKey={RemoteKey.RIGHT} onClick={onPress} variant="dpad" icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>} className="rounded-r-lg" />
             </div>
             {/* Center Enter (OK) */}
             <div className="w-16 h-16">
                 <RemoteButton remoteKey={RemoteKey.ENTER} onClick={onPress} variant="normal" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>} className="rounded-full w-full h-full border-2 border-gray-700 shadow-md" />
             </div>
        </div>
        
        {/* Navigation Actions (Return / Enter / Exit) */}
        <div className="relative z-10 flex justify-center items-center gap-3 px-2 mb-6">
            <RemoteButton 
                remoteKey={RemoteKey.RETURN} 
                onClick={onPress} 
                label="RETURN" 
                variant="small" 
                className="w-auto px-4 rounded-xl text-[10px]" 
            />
            
            <RemoteButton 
                remoteKey={RemoteKey.ENTER} 
                onClick={onPress} 
                variant="small" 
                className="w-12 h-12 bg-gray-800 border-gray-600 text-blue-400 hover:text-white"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>} 
            />

            <RemoteButton 
                remoteKey={RemoteKey.EXIT} 
                onClick={onPress} 
                variant="small" 
                className="w-12 h-12 bg-gray-800 border-gray-600 hover:text-red-400" 
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>}
            />
        </div>

        {/* Colored Buttons */}
        <div className="relative z-10 grid grid-cols-4 gap-2 px-2 pb-4">
            <RemoteButton remoteKey={RemoteKey.RED} onClick={onPress} variant="color" colorClass="bg-red-700" label="A" />
            <RemoteButton remoteKey={RemoteKey.GREEN} onClick={onPress} variant="color" colorClass="bg-green-700" label="B" />
            <RemoteButton remoteKey={RemoteKey.YELLOW} onClick={onPress} variant="color" colorClass="bg-yellow-600" label="C" />
            <RemoteButton remoteKey={RemoteKey.BLUE} onClick={onPress} variant="color" colorClass="bg-blue-700" label="D" />
        </div>

        {/* Branding */}
        <div className="relative z-10 text-center mt-2">
            <span className="text-gray-500 font-bold tracking-[0.2em] text-sm uppercase">Samsung</span>
        </div>
    </div>
  );
};