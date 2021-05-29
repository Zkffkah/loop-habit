'use strict'

import { app, protocol, BrowserWindow, ipcMain, nativeTheme, Tray, screen, Menu } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { autoUpdater } from "electron-updater"

const isDevelopment = process.env.NODE_ENV !== 'production'
const fs = require('fs')
const path = require("path");
const { platform } = require("os");

let win
let trayIcon = null;
/* istanbul ignore next */

//import * as Sentry from '@sentry/electron';
//Sentry.init({ dsn: 'https://f12af54d6a3b4f00a7ec80e69cba835e@o559982.ingest.sentry.io/5695233' });

// Turn off software rasterizer for less resource usage
app.commandLine.appendSwitch('disable-software-rasterizer', 'true')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 450,
    minWidth: 450,
    maxWidth: isDevelopment? 1050:450,
    height: 1000,
    title: 'Loop Habit',
    backgroundColor: '#161616',
    webPreferences: {
      devTools: process.env.NODE_ENV === 'development',
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  })

  // Load the url of the dev server if in development mode
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')

    /**
     * Will fire the autoupdater to check for new updates and notify the
     * user. This only needs to happen when *NOT* in development mode.
     */
    autoUpdater.checkForUpdatesAndNotify()
  }

  win.on('closed', () => {
    win = null
  })
}

const getTrayIconName = () =>
  `./icon.png`;
// const isWin = platform() === "win32";
// const getWindowPosition = (window, tray) => {
//   const trayBounds = tray.getBounds();
//   const windowSize = window.getSize();
//   const cursorPosition = screen.getCursorScreenPoint();
//   const display = screen.getDisplayNearestPoint(cursorPosition);
//   const displayArea = display.workArea;
//
//   if (isWin) {
//     const horizontalPosition =
//       displayArea.x + displayArea.width - windowSize[0];
//     const verticalPosition = displayArea.y + displayArea.height - windowSize[1];
//
//     return [horizontalPosition, verticalPosition];
//   } else {
//     const trayCenter = trayBounds.x + trayBounds.width / 2;
//     const horizontalPosition = trayCenter - windowSize[0] / 2;
//     // The macOS implementation of Electron. Tray ceils trayBounds.y to zero
//     // making it unreliable for vertically positioning the window.
//     // Use the display's work area instead.
//     const verticalPosition = displayArea.y + 5;
//     const left = horizontalPosition + windowSize[0];
//     const maxLeft = displayArea.width - 15;
//
//     // Check if window would be outside screen
//     // If yes, make sure it isn't
//     if (left > maxLeft) {
//       return [horizontalPosition - left - maxLeft, verticalPosition];
//     }
//
//     return [horizontalPosition, verticalPosition];
//   }
// };
const toggleTray = (window, tray) => () => {
  /* istanbul ignore next */

  // const [horizontalPosition, verticalPosition] = getWindowPosition(
  //   window,
  //   tray
  // );
  //
  // window.setPosition(horizontalPosition, verticalPosition);

  if (window.isVisible()) {
    window.hide();
  } else {
    window.show();
  }
};

const configureTrayIcon = (window, trayIcon, menu) => {
  const menuIconPath = path.join(__static, getTrayIconName());
  console.log(menuIconPath)
  trayIcon = new Tray(menuIconPath);

  const toggleTrayWithContext = toggleTray(window, trayIcon);

  trayIcon.setToolTip("Barnacal");

  trayIcon.on("click", toggleTrayWithContext);
  // trayIcon.on("double-click", toggleTrayWithContext);
  // trayIcon.on("right-click", () => {
  //   menu.popup(window);
  // });

};

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  const menu = new Menu();
  configureTrayIcon(win, trayIcon, menu);

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.handle('dark-mode:toggle', (event, mode) => {
  if (mode === 'light') {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('load-file', async (event, args) => {
  const [year, fileName] = args
  const dataPath = getFilePath(year , fileName)
  const filePath = `${dataPath}/${fileName}.json`
  let file

  // create the file if it does not exist yet
  if (!fs.existsSync(filePath)) {
    file = fs.promises.mkdir(dataPath, {recursive: true}).then(() => {
      return fs.promises.writeFile(filePath, getDefaultData()).then(() => {
        return fs.promises.readFile(filePath, 'utf-8').then((data) => {
          return JSON.parse(data)
        })
      })
    })
  } else {
    file = fs.promises.readFile(filePath, 'utf-8').then((data) => {
      return JSON.parse(data)
    })
  }

  // return the file
  return file
})

ipcMain.handle('save-file', (event, args) => {
  const [year, fileName, content, rating] = args
  const dataPath = getFilePath(year , fileName)
  const filePath = `${dataPath}/${fileName}.json`

  fs.promises.writeFile(filePath, JSON.stringify(
    {
      "content": content,
      "rating": rating
    }
  ))
})

ipcMain.handle('load-habit-file', async (event, args) => {
  const [year, fileName] = args
  const dataPath = getFilePath(year , fileName)
  const filePath = `${dataPath}/${fileName}.json`
  let file

  // create the file if it does not exist yet
  if (!fs.existsSync(filePath)) {
    file = fs.promises.mkdir(dataPath, {recursive: true}).then(() => {
      return fs.promises.writeFile(filePath, getDefaultData()).then(() => {
        return fs.promises.readFile(filePath, 'utf-8').then((data) => {
          return JSON.parse(data)
        })
      })
    })
  } else {
    file = fs.promises.readFile(filePath, 'utf-8').then((data) => {
      return JSON.parse(data)
    })
  }

  // return the file
  return file
})

ipcMain.handle('save-habit-file', (event, args) => {
  console.log(content)
  const [year, fileName, content] = args
  const dataPath = getFilePath(year , fileName)
  const filePath = `${dataPath}/${fileName}.json`

  fs.promises.writeFile(filePath, JSON.stringify(
    {
      "content": content,
    }
  ))
})


/**
 * Construct the base path where files are stored and loaded from
 */
const basePath = app.getPath('documents')
const getFilePath = (year) => {
  return `${basePath}/loop-habit/${year}`
}

const getDefaultData = () => {
  return JSON.stringify({
    "content": "",
    "rating": 0
  })
}

