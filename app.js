const { app, BrowserWindow, dialog, ipcMain, net } = require('electron');
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

ipcMain.on('import-to-itop', (event, server, username, password) => {
  // make POST request to http://localhost/itop/web/webservices/rest.php 
  // params: version = 1.3, json_data = {"operation": "list_operations"} 
  // basic auth, username = admintop, password = admintop
  try {
    console.log(username + ":" + password)
    const request = net.request({
      method: 'POST',
      protocol: 'http:',
      hostname: 'localhost',
      port: 80,
      path: encodeURI('/itop/web/webservices/rest.php?version=1.3&json_data={"operation": "list_operations"}'),
    });
    request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
    request.setHeader('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString("base64"))
    request.on('response', (response) => {
      var body = "";
      console.log(`STATUS: ${response.statusCode}`)
      console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
      response.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`)
        body += chunk;
      });
      response.on('end', () => {
        console.log('No more data in response.');
        // parse the body as json
        var json = JSON.parse(body);
        if (response.statusCode === 200 && json.code === 0) {
            // send event 'redirect' to renderer process with url 'success.html'
          event.sender.send('redirect', 'html/success.html');
        } else {
          // send event 'redirect' to renderer process with url 'error.html'
          event.sender.send('redirect', 'html/error.html');
        }
      });
    });
    request.on('error', (error) => {
      console.log(`ERROR: ${JSON.stringify(error)}`)
    });
    request.end();
    // send event 'redirect' to renderer process with url 'importing.html'
    // event.sender.send('redirect', 'html/importing.html');
  } catch (err) {
    console.log(err);
  }
  console.log('import to iTop');
});