const { app, BrowserWindow, dialog, ipcMain, net } = require('electron');
const path = require('path')
const fs = require('fs');
const yaml = require('js-yaml');
const { setFileData, getFileData, getValidationErrors } = require('./src/js/model/ImportModel.js');

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
  // mainWindow.webContents.openDevTools()
  // Remove menu
  mainWindow.setMenu(null)
  mainWindow.setResizable(false);
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
        // check that the structure of the data is correct
        errors = getValidationErrors(data);
        if (errors.length > 0) {
          event.sender.send('import-error', 'Invalid data structure: ' + errors.toString());
          return;
        }
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

ipcMain.on('import-to-itop', async (event, server, port, api_path, username, password) => {

  const { importData, setConfig, checkCredentials } = require('./src/js/import_iTOP.js');

  data = getFileData();
  if (data == null) {
    event.sender.send('import-error', `No data to import`);
    return;
  }
  
  setConfig(server, port, api_path, username, password);

  // check that the credentials are correct
  try {
    await checkCredentials();

    event.sender.send('import-status', 'importing...');

    await Promise.all([importData(data)]).then(() => {
      console.log('Import successful!');
      event.sender.send('import-status', 'Import successful!');
    }).catch(error => {
      event.sender.send('import-status', `Import failed: ${error}`);
    });
  } catch (error) {
    event.sender.send('import-error', error);
    return;
  }
});

ipcMain.on('export-from-itop', async (event, server, port, api_path, username, password) => {

  const { exportData, setConfig, checkCredentials } = require('./src/js/export_iTOP.js');

  setConfig(server, port, api_path, username, password);

  // check that the credentials are correct
  try {
    await checkCredentials();

    event.sender.send('export-status', 'exporting...');

    await Promise.all([exportData()]).then((data) => {
      console.log('Export successful!');
      event.sender.send('export-status', 'Export successful!');
      event.sender.send('export-data', data);
    }).catch(error => {
      event.sender.send('export-status', `Export failed: ${error}`);
    });
  } catch (error) {
    event.sender.send('export-error', error);
    return;
  }
});