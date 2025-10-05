import { Platform } from 'react-native';

declare global {
  interface Window {
    __BASE_PATH__?: string;
  }
}

const getBase = () => {
  if (Platform.OS !== 'web') return '';
  const fromWindow = typeof window !== 'undefined' ? (window.__BASE_PATH__ || '') : '';
  return (fromWindow || '').replace(/\/$/, '');
};

export const withBase = (path: string) => {
  const p = path.startsWith('/') ? path : '/' + path;
  const base = getBase();
  return base ? `${base}${p}` : p;
};
