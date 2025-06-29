import * as vscode from 'vscode';
import { truncateString } from './utils/truncateString';
import { formatString } from './utils/formatString';
import { isConsoleLogCorrect } from './utils/isConsoleLogCorrect';
import { ConsoleDataMap } from './types/consoleDataMap.interface';

// Create the decoration type
export const decorationType = vscode.window.createTextEditorDecorationType({
  textDecoration: 'pointer-events: none;',
  rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
});

// Get the current theme color
const getCurrentThemeColor = () => {
  if (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light) {
    return '#005f5f';
  } else {
    return '#73daca';
  }
};

// Render decorations for the current file
export const renderDecorations = (
  editor: vscode.TextEditor | undefined,
  consoleDataMap: ConsoleDataMap
) => {
  if (!editor) return;

  const document = editor.document;
  const currentFilePath = document.uri.fsPath;
  const decorations: vscode.DecorationOptions[] = [];

  for (const [file, innerMap] of consoleDataMap) {
    if (!currentFilePath.endsWith(file)) continue;

    for (const [position, values] of innerMap) {
      const line = parseInt(position) - 1;
      if (line < 0 || line >= document.lineCount) continue;

      const lineText = document.lineAt(line).text;
      if (!lineText.includes('console.log(') || !isConsoleLogCorrect(lineText)) continue;

      const closingIndex = lineText.length + 2;
      decorations.push({
        range: new vscode.Range(line, closingIndex, line, closingIndex),
        renderOptions: {
          after: {
            contentText: ' ➜ ' + truncateString(formatString(values.toArray().join(' ➜ '))),
            color: getCurrentThemeColor(),
          },
        },
      });
    }
  }

  editor.setDecorations(decorationType, decorations);
};
