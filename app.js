// Import the required modules
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path')
const fs = require('fs');
const yaml = require('js-yaml');


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // false is default value after Electron v5
      contextIsolation: false, // true protect against prototype pollution
      enableRemoteModule: true, // false turn off remote
      preload: path.join(__dirname, 'service.js')
    }
  })

  // Load app
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Algunas APIs pueden solamente ser usadas despues de que este evento ocurra.
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
ipcMain.on('file-request', (event) => {
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
      console.log(filepath);
      const fileContents = fs.readFileSync(file.filePaths[0], 'utf8');
      // Parse the YAML file
      const data = yaml.load(fileContents);
      event.reply('file', data);
    }
  }).catch(err => {
    console.log(err)
  });
});