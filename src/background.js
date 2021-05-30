'use strict'

import { app, protocol, ipcMain, nativeTheme } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { autoUpdater } from "electron-updater"
const { menubar } = require('menubar');

const isDevelopment = process.env.NODE_ENV !== 'production'
const fs = require('fs')
const path = require("path");

/* istanbul ignore next */

//import * as Sentry from '@sentry/electron';
//Sentry.init({ dsn: 'https://f12af54d6a3b4f00a7ec80e69cba835e@o559982.ingest.sentry.io/5695233' });

// Turn off software rasterizer for less resource usage
app.commandLine.appendSwitch('disable-software-rasterizer', 'true')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

const browserWindowOpts = {
  width:  450,
  height: 700,
  minWidth: 450,
  minHeight: 700,
  resizable: false,
  title: 'Loop Habit',
  backgroundColor: '#161616',
  webPreferences: {
    devTools: process.env.NODE_ENV === 'development',
    nodeIntegration: true,
    contextIsolation: false,
    enableRemoteModule: true,
  },
}

const iconIdle = path.join(
  __static,
  'tray-idleTemplate.png'
);
const iconActive = path.join(__static, 'tray-active.png');
const delayedHideAppIcon = () => {
  if (app.dock && app.dock.hide) {
    // Setting a timeout because the showDockIcon is not currently working
    // See more at https://github.com/maxogden/menubar/issues/306
    setTimeout(() => {
      app.dock.hide();
    }, 1500);
  }
};
app.on('ready', async () => {

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  } else {
    createProtocol('app')
  }
  const menubarApp = menubar({
    icon: iconIdle,
    index:   process.env.WEBPACK_DEV_SERVER_URL ? process.env.WEBPACK_DEV_SERVER_URL : 'app://./index.html',
    browserWindow: browserWindowOpts,
    preloadWindow: true,
  });


  menubarApp.on('ready',async () => {
    delayedHideAppIcon();
    menubarApp.tray.setIgnoreDoubleClickEvents(true);


    autoUpdater.checkForUpdatesAndNotify();

    ipcMain.on('reopen-window', () => menubarApp.showWindow());
    ipcMain.on('app-quit', () => menubarApp.app.quit());
    ipcMain.on('update-icon', (_, arg) => {
      if (!menubarApp.tray.isDestroyed()) {
        if (arg === 'TrayActive') {
          menubarApp.tray.setImage(iconActive);
        } else {
          menubarApp.tray.setImage(iconIdle);
        }
      }
    });

    menubarApp.window.webContents.on('devtools-opened', () => {
      menubarApp.window.setSize(1200, 700);
      menubarApp.window.center();
      menubarApp.window.resizable = true;
    });

    menubarApp.window.webContents.on('devtools-closed', () => {
      const trayBounds = menubarApp.tray.getBounds();
      menubarApp.window.setSize(
        browserWindowOpts.width,
        browserWindowOpts.height
      );
      menubarApp.positioner.move('trayCenter', trayBounds);
      menubarApp.window.resizable = false;
    });
  });

  menubarApp.on('after-create-window', () => {
    if (isDevelopment) {
      menubarApp.window.openDevTools()
      menubarApp.window.setAlwaysOnTop(true)
    }
  })
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

