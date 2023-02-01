// function importToiTop
function importToiTop(server, username, password) {
  var server = document.getElementById("server").value;
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  ipcRenderer.send('import-to-itop', server, username, password);
}

// hide alert function because btn-dissmiss is not working
function hideAlert() {
  document.getElementById('error-alert').style.display = 'none';
}