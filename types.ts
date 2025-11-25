export enum RemoteKey {
  POWER = 'POWER',
  SOURCE = 'SOURCE',
  KEY_1 = '1',
  KEY_2 = '2',
  KEY_3 = '3',
  KEY_4 = '4',
  KEY_5 = '5',
  KEY_6 = '6',
  KEY_7 = '7',
  KEY_8 = '8',
  KEY_9 = '9',
  KEY_0 = '0',
  PRE_CH = 'PRE-CH',
  MUTE = 'MUTE',
  VOL_UP = 'VOL_UP',
  VOL_DOWN = 'VOL_DOWN',
  CH_UP = 'CH_UP',
  CH_DOWN = 'CH_DOWN',
  MENU = 'MENU',
  GUIDE = 'GUIDE',
  TOOLS = 'TOOLS',
  INFO = 'INFO',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  ENTER = 'ENTER',
  RETURN = 'RETURN',
  EXIT = 'EXIT',
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  BLUE = 'BLUE',
  E_MANUAL = 'E-MANUAL',
  SMART_HUB = 'SMART_HUB',
  PROGRAM = 'PROGRAM'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GeminiCommandResponse {
  action: RemoteKey | null;
  channel?: number;
  reply: string;
}

export interface TvState {
  isOn: boolean;
  volume: number;
  channel: number;
  source: string;
  isMuted: boolean;
}

export interface HardwareConfig {
  enabled: boolean;
  bridgeUrl: string;
  method: 'GET' | 'POST';
  soundEffect?: string;
}