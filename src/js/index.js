// function importToiTop
function importToiTop(server, username, password) {
  var server = document.getElementById("server").value;
  var port = document.getElementById("port").value;
  var api_path = document.getElementById("api_path").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  // if(server && port && api_path && username && password) {
  //   ipcRenderer.send('import-to-itop', server, port, api_path, username, password);
  // }
  ipcRenderer.send('import-to-itop', server, port, api_path, username, password);
}

// hide alert function because btn-dissmiss is not working
function hideAlert() {
  document.getElementById('error-alert').style.display = 'none';
}