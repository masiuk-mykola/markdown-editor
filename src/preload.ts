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
  saveFile: async (content: string) => {
    ipcRenderer.send('save-file', content);
  },
  checkForUnsavedChanges: async (content: string) => {
    const result = await ipcRenderer.invoke('has-changes', content);
    return result;
  },
  showInFolder: async () => {
    ipcRenderer.send('show-in-folder');
  },
  openInDefaultApp: async () => {
    ipcRenderer.send('open-in-default-app');
  },
  revertChanges: () => {
    return ipcRenderer.invoke('revert-changes');
  },
  onCheckUnsavedRequest: (callback: () => void) => {
    ipcRenderer.on('check-unsaved-request', () => {
      callback();
    });
  },
  sendCheckUnsavedResponse: (hasChanges: boolean) => {
    ipcRenderer.send('check-unsaved-response', hasChanges);
  },
});
