/**
 * Central registry of IPC channel names shared between the main and renderer
 * processes. Per project convention, every IPC channel must be declared here
 * first, then wired up in `main.ts`, `preload.ts`, and the renderer.
 */
export const IpcChannels = {
  GET_APP_VERSION: 'app:get-version',
  WINDOW_CLOSE: 'window:close',
  WINDOW_START_DRAG: 'window:start-drag',
  WINDOW_RESIZE: 'window:resize',
  WINDOW_GET_SIZE: 'window:get-size',
  WINDOW_SET_SIZE: 'window:set-size',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
