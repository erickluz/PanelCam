import { app, BrowserWindow, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type WindowState = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized: boolean;
};

const DEFAULT_WIDTH = 1360;
const DEFAULT_HEIGHT = 860;

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

export function loadWindowState(): WindowState {
  const filePath = getWindowStatePath();

  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (typeof data.width === 'number' && typeof data.height === 'number') {
        const state: WindowState = {
          width: Math.max(1024, data.width),
          height: Math.max(680, data.height),
          x: typeof data.x === 'number' ? data.x : undefined,
          y: typeof data.y === 'number' ? data.y : undefined,
          isMaximized: Boolean(data.isMaximized)
        };

        // Valida se as coordenadas x, y ainda pertencem a algum monitor ativo conectado
        if (state.x !== undefined && state.y !== undefined) {
          const isVisible = screen.getAllDisplays().some((display) => {
            const { x, y, width, height } = display.bounds;
            return (
              state.x! + 50 >= x &&
              state.x! + 50 <= x + width &&
              state.y! + 50 >= y &&
              state.y! + 50 <= y + height
            );
          });

          if (!isVisible) {
            delete state.x;
            delete state.y;
          }
        }

        return state;
      }
    }
  } catch (error) {
    console.warn('Erro ao carregar window-state.json:', error);
  }

  return {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    isMaximized: false
  };
}

export function saveWindowState(window: BrowserWindow): void {
  try {
    if (window.isDestroyed()) {
      return;
    }

    const isMaximized = window.isMaximized();
    const bounds = isMaximized && typeof window.getNormalBounds === 'function'
      ? window.getNormalBounds()
      : window.getBounds();

    const state: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized
    };

    const filePath = getWindowStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.warn('Erro ao salvar window-state.json:', error);
  }
}

export function trackWindowState(window: BrowserWindow): void {
  let debounceTimer: NodeJS.Timeout | null = null;

  function scheduleSave() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      saveWindowState(window);
    }, 400);
  }

  window.on('resize', scheduleSave);
  window.on('move', scheduleSave);
  window.on('maximize', scheduleSave);
  window.on('unmaximize', scheduleSave);

  window.on('close', () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    saveWindowState(window);
  });
}
