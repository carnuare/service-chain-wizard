const {ipcRenderer} = require('electron')

var uploadFile = document.getElementById('upload-file');

//upon clicking upload file, request the file from the main process
uploadFile.addEventListener('click', () => {
  ipcRenderer.send('file-request');
});

ipcRenderer.on('file', (event, data) => {
  const fileDataContainer = document.getElementById('file-data');
  // make #confirm-data visible
  document.getElementById('confirm-data').style.display = 'block';
  fileDataContainer.innerHTML = "<code>"+JSON.stringify(data, null, 2)+"</code>"
});
ipcRenderer.on('redirect', (event, url) => {
  window.location.href = url;
});

ipcRenderer.on('import-status', (event, status) => {
  document.getElementById('import-status').innerHTML = status;
  console.log('importing...');
});

// function importToiTop
function importToiTop(server, username, password) {
  var server = document.getElementById("server").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var fileData = document.getElementById('file-data').innerHTML;
  ipcRenderer.send('import-to-itop', server, username, password, fileData);
}