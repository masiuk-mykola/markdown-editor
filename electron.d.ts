declare interface Window {
  api: {
    onFileOpen: (callback: (content: string, filePath: string) => void) => void;
    showOpenDialog: () => void;
    showExportHtmlDialog: (html: string) => void;
  };
}
