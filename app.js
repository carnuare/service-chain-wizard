const { app, BrowserWindow, dialog, ipcMain, net } = require('electron');
const path = require('path')
const fs = require('fs');
const yaml = require('js-yaml');
const { setFileData, getFileData } = require('./src/js/model/ImportModel.js');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // false is default value after Electron v5
      contextIsolation: false, // true protect against prototype pollution
      enableRemoteModule: true, // false turn off remote
      // preload: path.join(__dirname, './src/js/index.js')
    }
  })

  // Load app
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  // Open the DevTools.
  mainWindow.webContents.openDevTools()
  // Remove menu
  mainWindow.setMenu(null)
}

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    app.quit()
})

// File handling
ipcMain.on('file-request', async (event) => {
  dialog.showOpenDialog({
    title: 'Select the File to be uploaded',
    buttonLabel: 'Upload',
    filters: [
      {
        name: 'Yaml Files',
        extensions: ['yaml']
      },],
    properties: ['openFile'] // en MAC es posible que haya que poner ['openFile', 'openDirectory']
  }).then(file => {
    if (!file.canceled) {
      const filepath = file.filePaths[0].toString();
      const fileContents = fs.readFileSync(file.filePaths[0], 'utf8');
      try {
        const data = yaml.load(fileContents);
        // load into model
        setFileData(data);
        event.reply('file', data);
      } catch (error) {
        console.log(error)
        console.log('Invalid YAML');
        event.sender.send('import-error', `Invalid YAML`);
      }
    }
  }).catch(error => {
    console.log(error)
    event.sender.send('import-error', `Error with file: ${error}`);
  });
});

ipcMain.on('import-to-itop', async (event, server, username, password) => {

  const { importData, setConfig } = require('./src/js/import_iTOP.js');

  data = getFileData();
  if (data == null) {
    event.sender.send('import-error', `No data to import`);
    return;
  }
  
  setConfig(server, username, password);
  
  event.sender.send('import-status', 'importing...');

  await Promise.all([importData(data)]).then(() => {
    console.log('Import successful!');
    event.sender.send('import-status', 'Import successful!');
  }).catch(error => {
    event.sender.send('import-status', `Import failed: ${error}`);
  });
});