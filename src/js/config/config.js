const { net } = require('electron');
const ITOP_REST_VERSION = '1.3';

const connectConfig = {
    server: "localhost",
    port: 80,
    api_path: "/itop/web/webservices/rest.php",
    username: null,
    password: null
};

// create setConfig for the above object
const setConfig = (server, port, api_path, username, password) => {
    connectConfig.server = server;
    connectConfig.port = port;
    connectConfig.api_path = api_path;
    connectConfig.username = username;
    connectConfig.password = password;
};

const checkCredentials = async () => {
    return new Promise((resolve, reject) => {
        const request = net.request({
            method: 'POST',
            protocol: 'http:',
            hostname: connectConfig.server,
            port: connectConfig.port,
            path: encodeURI(connectConfig.api_path + '?version=' + ITOP_REST_VERSION + '&json_data={"operation": "core/check_credentials", "user": "' + connectConfig.username + '", "password": "' + connectConfig.password + '"}')
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
                try {
                    // if 404 return error
                    if (response.statusCode === 404) {
                        reject(new Error('Server not found'));
                    }
                    var json = JSON.parse(body);
                    if (json.code == 0) {
                        resolve('Credentials OK');
                    } else {
                        reject(new Error('Invalid credentials'));
                    }
                } catch (error) {
                    reject(new Error('Invalid credentials'));
                }
            });
        });
        request.on('error', (error) => {
            reject(new Error('Error: ' + error));
        });
        request.end();
    });
};

module.exports = { connectConfig, setConfig, checkCredentials, ITOP_REST_VERSION };