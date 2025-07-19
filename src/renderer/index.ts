import { renderMarkdown } from './markdown';
import Elements from './elements';

window.api.onFileOpen((content: string) => {
  Elements.MarkdownView.value = content;
  Elements.ShowFileButton.disabled = false;
  Elements.OpenInDefaultApplicationButton.disabled = false;
  renderMarkdown(content);
});

Elements.MarkdownView.addEventListener('input', async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
  const hasChanges = await window.api.checkForUnsavedChanges(markdown);

  Elements.SaveMarkdownButton.disabled = !hasChanges;
  Elements.RevertButton.disabled = !hasChanges;
});

Elements.OpenFileButton.addEventListener('click', () => {
  window.api.showOpenDialog();
});

Elements.ExportHtmlButton.addEventListener('click', () => {
  const html = Elements.RenderedView.innerHTML;
  window.api.showExportHtmlDialog(html);
});

Elements.SaveMarkdownButton.addEventListener('click', () => {
  const markdown = Elements.MarkdownView.value;

  window.api.saveFile(markdown);
});

Elements.ShowFileButton.addEventListener('click', () => {
  window.api.showInFolder();
});

Elements.OpenInDefaultApplicationButton.addEventListener('click', () => {
  window.api.openInDefaultApp();
});

Elements.RevertButton.addEventListener('click', async () => {
  const content = await window.api.revertChanges();
  Elements.MarkdownView.value = content;
  renderMarkdown(content);
});
