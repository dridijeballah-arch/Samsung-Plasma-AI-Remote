import React from 'react';
import { RemoteKey } from '../types';

interface RemoteButtonProps {
  label?: string | React.ReactNode;
  icon?: React.ReactNode;
  remoteKey: RemoteKey;
  onClick: (key: RemoteKey) => void;
  variant?: 'normal' | 'power' | 'color' | 'rocker' | 'dpad' | 'source' | 'small';
  colorClass?: string;
  className?: string;
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ 
  label, 
  icon, 
  remoteKey, 
  onClick, 
  variant = 'normal',
  colorClass,
  className = ''
}) => {
  
  const handlePointerDown = () => {
    // Sophisticated haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        let pattern: number | number[] = 10;

        switch (variant) {
            case 'power':
                // Heavy, distinct vibration for power
                pattern = 40;
                break;
            case 'rocker':
                // Short, crisp tick for repetitive actions (Vol/Ch)
                pattern = 10;
                break;
            case 'dpad':
                // Tactile bump for navigation
                pattern = 15;
                break;
            case 'color':
                // Medium feedback for context actions
                pattern = 20;
                break;
            case 'source':
            case 'small':
                // Light, subtle feedback
                pattern = 8;
                break;
            default:
                // Standard button logic
                if (remoteKey === RemoteKey.ENTER) {
                    // Thud for Enter/OK
                    pattern = 25;
                } else {
                    // Standard keys (Numbers)
                    pattern = 12;
                }
                break;
        }

        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Fallback or ignore
        }
    }
  };

  const handleClick = () => {
      onClick(remoteKey);
  };

  const baseStyles = "relative flex items-center justify-center font-semibold transition-all duration-100 active:scale-95 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.5)] select-none touch-manipulation";
  
  let shapeStyles = "rounded-lg text-sm";
  let bgStyles = "bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700";

  switch (variant) {
    case 'power':
      shapeStyles = "rounded-full w-12 h-12";
      bgStyles = "bg-red-600 text-white border-red-800 hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.3)]";
      break;
    case 'source':
      shapeStyles = "rounded-md w-12 h-8 text-xs";
      bgStyles = "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600";
      break;
    case 'color':
      shapeStyles = "rounded-md h-8 w-full";
      bgStyles = `${colorClass} text-white opacity-90 hover:opacity-100 border-transparent shadow-sm`;
      break;
    case 'rocker':
      shapeStyles = "rounded-2xl w-14 h-24 text-xl";
      bgStyles = "bg-gray-900 text-white border border-gray-800 hover:bg-gray-800 from-gray-800 to-black bg-gradient-to-b";
      break;
    case 'dpad':
      shapeStyles = "w-full h-full"; // Handled by parent container usually
      bgStyles = "bg-gray-800 hover:bg-gray-700";
      break;
    case 'small':
      shapeStyles = "rounded-full w-10 h-10 text-[10px]";
      bgStyles = "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700";
      break;
    default:
      // Normal grid button (numbers)
      shapeStyles = "rounded-md w-full h-12 text-lg";
      bgStyles = "bg-gray-800 text-white border border-gray-700 hover:bg-gray-700";
  }

  return (
    <button
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      className={`${baseStyles} ${shapeStyles} ${bgStyles} ${className}`}
      aria-label={typeof label === 'string' ? label : remoteKey}
    >
      {icon ? icon : label}
    </button>
  );
};

export default RemoteButton;