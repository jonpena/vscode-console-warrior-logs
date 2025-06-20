import fs from 'fs';
import path from 'path';
import { checkIfNodeModulesReady } from './checkIfNodeModulesReady';
import { vitePlugin } from '../plugins/vitePlugin';
import * as VSCODE from 'vscode';

export const watcherNodeModules = (vscode: typeof VSCODE) => {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspacePath) return;

  const activatedPaths = new Set<string>();

  const nodeModulesPath = path.join(workspacePath, 'node_modules');

  const activatePlugin = async (nodeModulesPath: string) => {
    const ready = await checkIfNodeModulesReady(nodeModulesPath);
    if (ready) {
      vitePlugin(vscode, nodeModulesPath);
      console.log(`Activado en: ${nodeModulesPath}`);
      activatedPaths.add(nodeModulesPath);
    }
  };

  // Scan for existing node_modules
  const scanExisting = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') {
          activatePlugin(fullPath);
        } else {
          scanExisting(fullPath); // recursive
        }
      }
    }
  };

  scanExisting(workspacePath);

  // if node_modules already exists at startup
  if (fs.existsSync(nodeModulesPath)) {
    activatePlugin(nodeModulesPath);
  }

  // Watch for creation and deletion of node_modules
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspacePath, '**/node_modules'),
    false, // watch create
    true, // ignore change
    false // watch delete
  );

  watcher.onDidCreate(() => {
    activatePlugin(nodeModulesPath);
  });

  watcher.onDidDelete(() => {
    console.log('Node modules deleted');
    // Here you could deactivate your plugin if necessary
  });

  return watcher;
};
