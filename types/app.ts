/**
 * Application State Types
 */

export type AppMode = 'idle' | 'listening' | 'processing' | 'speaking';
export type VisualizationMode = 'orb' | 'waveform' | 'particles' | 'loading';

export interface Message {
  type: 'user' | 'assistant';
  text: string;
  timestamp: number;
  id?: string;
}

export interface AppState {
  mode: AppMode;
  messages: Message[];
  visualizationMode: VisualizationMode;
  audioLevel: number;
  error: string | null;
  isFirstTime?: boolean;
}

export interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addMessage: (type: Message['type'], text: string) => void;
  setMode: (mode: AppMode) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setAudioLevel: (level: number) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}
