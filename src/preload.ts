// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  onFileOpen: (callback: (content: string) => void) => {
    ipcRenderer.on('file-opened', (_, content: string) => {
      callback(content);
    });
  },
  showOpenDialog: () => {
    ipcRenderer.send('show-open-dialog');
  },
  showExportHtmlDialog: (html: string) => {
    ipcRenderer.send('show-export-html-dialog', html);
  },
});
