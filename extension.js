const vscode = require('vscode');
const { exec } = require('child_process');

// We'll keep two separate child processes: one for normal run-app, one for debug mode
let runProcess = null;
let debugProcess = null;

function activate(context) {
  /**
   * Command: Grails: Run App (normal)
   * Invokes `grails run-app`
   */
  const runAppCommand = vscode.commands.registerCommand('grails.runApp', () => {
    if (runProcess) {
      vscode.window.showWarningMessage('A Grails application (normal mode) is already running.');
      return;
    }
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a Grails project first.');
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    vscode.window.showInformationMessage('Running Grails application...');

    // Run the normal Grails command: grails run-app
    runProcess = exec('grailsw run-app', { cwd: workspaceFolder });

    // Pipe logs to an Output Channel
    const outputChannel = vscode.window.createOutputChannel('Grails App');
    outputChannel.show(true);

    runProcess.stdout.on('data', (data) => {
      outputChannel.append(data.toString());
    });
    runProcess.stderr.on('data', (data) => {
      outputChannel.append(data.toString());
    });

    runProcess.on('close', (code) => {
      vscode.window.showInformationMessage(`Grails (normal) exited with code ${code}`);
      runProcess = null;
    });
  });

  /**
   * Command: Grails: Stop App (normal)
   */
  const stopAppCommand = vscode.commands.registerCommand('grails.stopApp', () => {
    if (!runProcess) {
      vscode.window.showInformationMessage('No Grails (normal) application is running.');
      return;
    }
    vscode.window.showInformationMessage('Stopping Grails (normal) application...');
    runProcess.kill();
    runProcess = null;
  });

  /**
   * Command: Grails: Start Debug App
   * Uses `grails run-app --debug-jvm`
   */
  const startDebugAppCommand = vscode.commands.registerCommand('grails.startDebugApp', async () => {
    if (debugProcess) {
      vscode.window.showWarningMessage('A Grails debug process is already running.');
      return;
    }
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a Grails project first.');
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
    vscode.window.showInformationMessage('Running Grails in debug mode...');

    // Run: grails run-app --debug-jvm
    debugProcess = exec('grailsw run-app --debug-jvm', { cwd: workspaceFolder });

    // Pipe logs to a Debug Channel
    const debugChannel = vscode.window.createOutputChannel('Grails Debug');
    debugChannel.show(true);

    debugProcess.stdout.on('data', (data) => {
      debugChannel.append(data.toString());
    });
    debugProcess.stderr.on('data', (data) => {
      debugChannel.append(data.toString());
    });

    debugProcess.on('close', (code) => {
      vscode.window.showInformationMessage(`Grails (debug) exited with code ${code}`);
      debugProcess = null;
    });

    // (Optional) Auto-attach a Java debugger after a brief delay
    setTimeout(async () => {
      const debugConfig = {
        name: 'Attach to Grails',
        type: 'java',
        request: 'attach',
        hostName: 'localhost',
        port: 5005
      };
      try {
        await vscode.debug.startDebugging(undefined, debugConfig);
        vscode.window.showInformationMessage('Debugger attached to Grails on port 5005.');
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to attach debugger: ${err.message}`);
      }
    }, 3000);
  });

  /**
   * Command: Grails: Stop Debug App
   */
  const stopDebugAppCommand = vscode.commands.registerCommand('grails.stopDebugApp', () => {
    if (!debugProcess) {
      vscode.window.showInformationMessage('No Grails debug process is running.');
      return;
    }
    vscode.window.showInformationMessage('Stopping Grails (debug) application...');
    debugProcess.kill();
    debugProcess = null;
  });

  // Register all commands
  context.subscriptions.push(
    runAppCommand,
    stopAppCommand,
    startDebugAppCommand,
    stopDebugAppCommand
  );
}

function deactivate() {
  // If processes remain running on extension deactivation, kill them
  if (runProcess) {
    runProcess.kill();
    runProcess = null;
  }
  if (debugProcess) {
    debugProcess.kill();
    debugProcess = null;
  }
}

module.exports = {
  activate,
  deactivate
};
