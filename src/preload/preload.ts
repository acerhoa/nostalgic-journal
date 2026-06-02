import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipcChannels';

// Only a curated, typed surface is exposed to the renderer via contextBridge —
// never raw Node or Electron modules.
const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannels.GET_APP_VERSION),
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;
