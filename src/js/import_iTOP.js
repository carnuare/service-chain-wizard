const { net } = require('electron');

const connectConfig = {
    server: null,
    username: null,
    password: null
};

// create setConfig for the above object
const setConfig = (server, username, password) => {
    connectConfig.server = server;
    connectConfig.username = username;
    connectConfig.password = password;
};

const importData = () => {
    return new Promise(async (resolve, reject) => {
        try {
            // TODO añadir funcion de validación que las credenciales sean correctas y que todo vaya bien
            await imoprtOrgs();
            await importServices();
            resolve('Import success!');
        } catch (error) {
            reject(error);
        }
    });
};

async function imoprtOrgs() {
    return new Promise((resolve, reject) => {
        try {
            const request = net.request({
                method: 'POST',
                protocol: 'http:',
                hostname: connectConfig.server,
                port: 80,
                path: encodeURI('/itop/web/webservices/rest.php?version=1.3&json_data={"operation": "list_operations"}'),
            });
            request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setHeader('Authorization', 'Basic ' + Buffer.from(connectConfig.username + ":" + connectConfig.password).toString("base64"))
            request.on('response', (response) => {
                var body = "";
                response.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`)
                    body += chunk;
                });
                response.on('end', () => {
                    console.log('No more data in response.');
                    // parse the body as json
                    var json = JSON.parse(body);
                    if (response.statusCode === 200 && json.code === 0) {
                        resolve('Import orgs success!');
                    } else {
                        reject('Import orgs failed:S');
                    }
                });
            });
            request.on('error', (error) => {
                reject(error);
            });
            request.end();
            // send event 'redirect' to renderer process with url 'importing.html'
            // event.sender.send('redirect', 'html/importing.html');
        } catch (err) {
            console.log(err);
        }
    });
}

async function importServices() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Import services success!');
        }, 2000);
    });
}

module.exports = { importData, setConfig };