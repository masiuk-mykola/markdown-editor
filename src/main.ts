import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  MenuItemConstructorOptions,
  Menu,
} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { readFile, writeFile } from 'fs/promises';
import { basename, join } from 'path';

type MarkdownFile = {
  content?: string;
  filePath?: string;
};

const currentFile: MarkdownFile = {
  content: '',
  filePath: undefined,
};

const getCurrentFile = async (browserWindow: BrowserWindow) => {
  if (currentFile.filePath) return currentFile.filePath;

  if (!browserWindow) return;

  return showSaveDialog(browserWindow);
};
const setCurrentFile = (
  browserWindow: BrowserWindow,
  filePath: string,
  content: string,
) => {
  currentFile.filePath = filePath;
  currentFile.content = content;

  app.addRecentDocument(filePath);
  browserWindow.setTitle(`${basename(filePath)} - ${app.name}`);
  browserWindow.setRepresentedFilename(filePath);
};

const hasChanges = (content: string) => {
  return currentFile.content !== content;
};
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const showOpenDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown File', extensions: ['md'] }],
  });

  if (result.canceled) return;

  const [filePath] = result.filePaths;
  openFile(browserWindow, filePath);
};

const showExportHtmlDialog = async (
  browserWindow: BrowserWindow,
  html: string,
) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Export HTML',
    filters: [{ name: 'HTML File', extensions: ['html'] }],
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  exportHtml(filePath, html);
};

const exportHtml = async (filePath: string, html: string) => {
  await writeFile(filePath, html, { encoding: 'utf-8' });
};

const openFile = async (browserWindow: BrowserWindow, filePath: string) => {
  const content = await readFile(filePath, { encoding: 'utf-8' });

  setCurrentFile(browserWindow, filePath, content);

  browserWindow.webContents.send('file-opened', content, filePath);
};

ipcMain.on('show-open-dialog', (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  showOpenDialog(browserWindow);
});

ipcMain.on('show-export-html-dialog', async (event, html: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  showExportHtmlDialog(browserWindow, html);
});

const showSaveDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: 'Save Markdown',
    filters: [{ name: 'Markdown File', extensions: ['md'] }],
  });

  if (result.canceled) return;

  const { filePath } = result;

  if (!filePath) return;

  return filePath;
};

const saveFile = async (browserWindow: BrowserWindow, content: string) => {
  const filePath = await getCurrentFile(browserWindow);
  if (!filePath) return;

  await writeFile(filePath, content, { encoding: 'utf-8' });
  setCurrentFile(browserWindow, filePath, content);
};

ipcMain.on('save-file', async (event, content: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);

  if (!browserWindow) return;

  saveFile(browserWindow, content);
});

ipcMain.handle('has-changes', async (event, content: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const changed = hasChanges(content);

  browserWindow?.setDocumentEdited(changed);

  return changed;
});

ipcMain.on('show-in-folder', async () => {
  if (currentFile.filePath) {
    await shell.showItemInFolder(currentFile.filePath);
  }
});

ipcMain.on('open-in-default-app', async () => {
  if (currentFile.filePath) {
    await shell.openPath(currentFile.filePath);
  }
});

const template: MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open',
        click: () => {
          let browserWindow = BrowserWindow.getFocusedWindow();
          if (!browserWindow) browserWindow = createWindow();
          showOpenDialog(browserWindow);
        },
        accelerator: 'CmdOrCtrl+O',
      },
    ],
  },
  {
    label: 'Edit',
    role: 'editMenu',
  },
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.name,
    role: 'appMenu',
  });
}

const menu = Menu.buildFromTemplate(template);

Menu.setApplicationMenu(menu);
