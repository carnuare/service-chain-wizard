const {ipcRenderer} = require('electron')

var uploadFile = document.getElementById('upload-file');

//upon clicking upload file, request the file from the main process
uploadFile.addEventListener('click', () => {
  ipcRenderer.send('file-request');
});

ipcRenderer.on('file', (event, data) => {
  const fileDataContainer = document.getElementById('file-data');
  fileDataContainer.innerHTML = JSON.stringify(data, null, 2);
});

// // Show a file open dialog when the user clicks a button
// function selectFile() {
//     dialog.showOpenDialog(mainWindow, {
//       properties: ['openFile'],
//       filters: [{ name: 'YAML Files', extensions: ['yaml'] }],
//     }, (filePaths) => {
//       if (filePaths) {
//         // Read the file contents
//         const fileContents = fs.readFileSync(filePaths[0], 'utf8');
  
//         // Parse the YAML file
//         const data = yaml.load(fileContents);
  
//         // Log the contents of the YAML file to the console
//         console.log(data);
//         // you can use the mainWindow.webContents.send('file-data', data);
//       }
//     });
//   };

