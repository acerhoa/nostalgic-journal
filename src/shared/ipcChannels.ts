/**
 * Central registry of IPC channel names shared between the main and renderer
 * processes. Per project convention, every IPC channel must be declared here
 * first, then wired up in `main.ts`, `preload.ts`, and the renderer.
 */
export const IpcChannels = {
  GET_APP_VERSION: 'app:get-version',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
