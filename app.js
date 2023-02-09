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
  mainWindow.webContents.openDevTools()
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

  const { importData } = require('./src/js/import_iTOP.js');
  const { setConfig, checkCredentials } = require('./src/js/config/config.js');

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

  const { exportData } = require('./src/js/export_iTOP.js');
  const { setConfig, checkCredentials } = require('./src/js/config/config.js');
  
  setConfig(server, port, api_path, username, password);
  
  // check that the credentials are correct
  try {
    await checkCredentials();

    event.sender.send('export-status', 'exporting...');

    await exportData().then((data) => {
      console.log('Export successful!');
      // turn json into YAML
      var yamlFile = yaml.dump(data);
      event.sender.send('download', {
        payload: {
          fileURL: 'data:text/plain;charset=utf-8,' + encodeURIComponent(yamlFile),
          fileName: 'export.yaml'
        }
      });
    }).catch(error => {
      console.log(error);
      event.sender.send('export-status', `Export failed`);
    });
  } catch (error) {
    event.sender.send('import-error', error);
    return;
  }
});

ipcMain.on('download', async (event, {payload}) => {
  console.log('downloading...');
  const { fileURL, fileName } = payload;
  const { download } = require('electron-dl');
  const win = BrowserWindow.getFocusedWindow();
  try {
    const dl = await download(win, fileURL, {
      filename: fileName,
      saveAs: true
    });
    console.log(dl.getSavePath());
    event.sender.send('export-status', 'Export successful!');
  }catch (e) {
    console.log(e);
    // event.sender.send('download-error', e);
  }
});