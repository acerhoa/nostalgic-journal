import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipcChannels';

// Only a curated, typed surface is exposed to the renderer via contextBridge —
// never raw Node or Electron modules.
const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannels.GET_APP_VERSION),
  closeWindow: (): void => ipcRenderer.send(IpcChannels.WINDOW_CLOSE),
  getWindowSize: (): Promise<{ width: number; height: number }> =>
    ipcRenderer.invoke(IpcChannels.WINDOW_GET_SIZE),
  setWindowSize: (width: number, height: number): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.WINDOW_SET_SIZE, width, height),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
