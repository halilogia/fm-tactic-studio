const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let pyProcess = null;
const SERVER_URL = 'http://127.0.0.1:8765';

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkServerReady(callback, retries = 30) {
  http.get(`${SERVER_URL}/api/tactics`, (res) => {
    if (res.statusCode === 200) {
      callback(true);
    } else {
      retry();
    }
  }).on('error', () => {
    retry();
  });

  function retry() {
    if (retries > 0) {
      setTimeout(() => checkServerReady(callback, retries - 1), 300);
    } else {
      callback(false);
    }
  }
}

function startBackend(callback) {
  // First check if already running
  checkServerReady((ready) => {
    if (ready) {
      callback();
      return;
    }

    // Spawn python backend
    const pyScript = path.join(__dirname, 'app.py');
    pyProcess = spawn('python', [pyScript], {
      cwd: __dirname,
      windowsHide: true,
      stdio: 'ignore'
    });

    pyProcess.on('error', (err) => {
      console.error('Failed to start python backend:', err);
    });

    checkServerReady((started) => {
      callback();
    });
  }, 2);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 840,
    minWidth: 1024,
    minHeight: 650,
    title: 'FM Tactic Studio - Football Manager 26',
    icon: path.join(__dirname, 'app_icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#0b091a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend(() => {
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  if (pyProcess) {
    try {
      pyProcess.kill();
    } catch (e) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
