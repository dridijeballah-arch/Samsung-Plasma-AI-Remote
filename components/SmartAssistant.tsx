import React, { useState, useEffect, useRef } from 'react';
import { interpretCommand } from '../services/geminiService';
import { ChatMessage, RemoteKey, TvState } from '../types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SmartAssistantProps {
  onCommand: (key: RemoteKey) => void;
  onChannelSelect: (num: number, name: string) => void;
  tvState: TvState;
  channels: { number: number; name: string }[];
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  autoStart?: boolean;
  onAutoStartHandled?: () => void;
}

interface CommandLog {
  id: string;
  text: string;
  action: string | null;
  timestamp: Date;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ 
  onCommand, 
  onChannelSelect,
  tvState,
  channels,
  isProcessing, 
  setIsProcessing,
  autoStart,
  onAutoStartHandled
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Bonjour ! Je connais l\'état de votre TV et les chaînes TNT. Dites "Mets BFM" ou "Monte le son".', timestamp: new Date() }
  ]);
  const [commandHistory, setCommandHistory] = useState<CommandLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Audio context for visualization (mock)
  const [micVolume, setMicVolume] = useState(0);

  useEffect(() => {
    if (scrollRef.current && !showHistory) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showHistory]);

  // Handle Auto Start
  useEffect(() => {
    if (autoStart && !isListening) {
        if (!navigator.onLine) {
            alert("L'assistant vocal nécessite une connexion internet.");
            return;
        }
        toggleVoice();
        if (onAutoStartHandled) {
            onAutoStartHandled();
        }
    }
  }, [autoStart]);

  const processCommandResult = (userText: string, result: any) => {
      // Execute Channel Change
      if (result.channel) {
          const chInfo = channels.find(c => c.number === result.channel);
          const name = chInfo ? chInfo.name : `Ch ${result.channel}`;
          onChannelSelect(result.channel, name);
      } 
      // Execute Single Key Action
      else if (result.action) {
        onCommand(result.action);
      }

      // Update History
      const actionLabel = result.channel ? `CH ${result.channel}` : (result.action || 'INFO');
      
      const newLog: CommandLog = {
          id: Date.now().toString() + Math.random(),
          text: userText,
          action: actionLabel,
          timestamp: new Date()
      };
      setCommandHistory(prev => [newLog, ...prev]);

      // Add Model Response to Chat
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, modelMsg]);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    if (!navigator.onLine) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "⚠️ Je ne peux pas traiter votre demande sans connexion Internet. La télécommande manuelle reste disponible.",
            timestamp: new Date()
        }]);
        return;
    }

    const text = inputText;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    const result = await interpretCommand(text, tvState, channels);

    setIsProcessing(false);
    processCommandResult(text, result);
  };

  const toggleVoice = () => {
    if (!navigator.onLine) {
        alert("Connexion Internet requise pour la reconnaissance vocale.");
        return;
    }

    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setMicVolume(0);
      return;
    }

    setIsListening(true);
    
    // Mock visualizer
    const interval = setInterval(() => {
        setMicVolume(Math.random() * 100);
    }, 100);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputText(text);
      // Auto send after short delay
      setTimeout(() => {
         handleVoiceCommand(text);
      }, 500);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearInterval(interval);
      setMicVolume(0);
    };

    recognition.onerror = () => {
        setIsListening(false);
        clearInterval(interval);
        setMicVolume(0);
    };

    recognition.start();
  };

  const handleVoiceCommand = async (text: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        text: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setIsProcessing(true);

      const result = await interpretCommand(text, tvState, channels);

      setIsProcessing(false);
      processCommandResult(text, result);
  };

  const formatTime = (date: Date) => {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-gray-300 font-medium flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
           Assistant IA
        </h3>
        <div className="flex items-center gap-3">
            {isProcessing && <span className="text-xs text-blue-400 animate-pulse">Traitement...</span>}
            
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}
                title={showHistory ? "Retour au chat" : "Historique"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar bg-gray-950/50" ref={scrollRef}>
        
        {showHistory ? (
            <div className="space-y-3 animate-in fade-in duration-300">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 sticky top-0 bg-gray-900/90 backdrop-blur py-2 z-10">Journal des commandes</h4>
                {commandHistory.length === 0 ? (
                    <div className="text-center text-gray-600 py-10 italic text-sm">Aucune commande récente.</div>
                ) : (
                    commandHistory.map((log) => (
                        <div key={log.id} className="bg-gray-800/50 border border-gray-800 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="text-gray-300 text-sm font-medium truncate">"{log.text}"</span>
                                <span className="text-[10px] text-gray-500 font-mono">{formatTime(log.timestamp)}</span>
                            </div>
                            <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                log.action !== 'INFO'
                                ? 'bg-green-900/30 text-green-400 border-green-900/50' 
                                : 'bg-gray-700/30 text-gray-400 border-gray-700/50'
                            }`}>
                                {log.action}
                            </div>
                        </div>
                    ))
                )}
            </div>
        ) : (
            <div className="space-y-4">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                    }`}>
                        <div className="break-words">{msg.text}</div>
                        <div className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                            {formatTime(msg.timestamp)}
                        </div>
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950 pb-8 border-t border-gray-800">
        <div className="flex items-center gap-2 relative">
            {isListening && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-1 items-end h-8">
                    <div className="w-1 bg-red-500 rounded-full animate-bounce" style={{height: `${10 + micVolume}%`}}></div>
                    <div className="w-1 bg-red-500 rounded-full animate-bounce delay-75" style={{height: `${20 + micVolume/2}%`}}></div>
                    <div className="w-1 bg-red-500 rounded-full animate-bounce delay-150" style={{height: `${10 + micVolume}%`}}></div>
                </div>
            )}

          <button 
            onClick={toggleVoice}
            disabled={!navigator.onLine}
            className={`p-3 rounded-full transition-colors ${
              !navigator.onLine ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
              isListening ? 'bg-red-600 animate-pulse text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={navigator.onLine ? "Écrire une commande..." : "Mode hors ligne actif"}
            disabled={!navigator.onLine}
            className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-sm placeholder-gray-500 disabled:opacity-50 disabled:placeholder-gray-600"
          />
          
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing || !navigator.onLine}
            className="p-3 bg-blue-600 rounded-full text-white disabled:opacity-50 hover:bg-blue-500 transition-colors disabled:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistant;