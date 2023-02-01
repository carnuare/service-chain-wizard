const {ipcRenderer} = require('electron')

//upon clicking upload file, request the file from the main process
var uploadFile = document.getElementById('upload-file');

uploadFile.addEventListener('click', () => {
  ipcRenderer.send('file-request');
});

ipcRenderer.on('file', (event, data) => {
  const fileDataContainer = document.getElementById('file-data');
  // make file-data div background white with black text and border visible in the bootstrap class
  fileDataContainer.className = "mb-4 mt-3 w-75 bg-white text-dark border";
  fileDataContainer.innerHTML = "<pre><code>"+JSON.stringify(data, null, 2)+"</code></pre>"
  // make #confirm-data visible
  document.getElementById('confirm-data').style.display = 'block';
});

ipcRenderer.on('redirect', (event, url) => {
  window.location.href = url;
});

ipcRenderer.on('import-status', (event, status) => {
  document.getElementById('import-status').innerHTML = status;
});

ipcRenderer.on('import-error', (event, error) => {
  document.getElementById('error-alert').style.display = 'block';
  document.getElementById('import-error').innerHTML = error;
});