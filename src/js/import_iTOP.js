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

const importData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            imoprtOrgs(data.orgs)
            .then((id) => {
                console.log('id: ' + id);
                resolve('Import orgs success!');
            }).catch((error) => {
                reject('Error: '+ error);
            });
        } catch (error) {
            reject('Error: '+ error);
        }
    });
};

async function imoprtOrgs(orgs) {
    return new Promise((resolve, reject) => {
        // foreach org, call promise create
        for (org in orgs) {
            create('Organization', '{ "name": "'+orgs[org].name+'", "code": "'+orgs[org].code+'", "status": "'+(orgs[org].status??'active')+'" }')
                .then((id) => {
                    console.log('id: ' + id);
                    resolve('Import orgs success!');
                }).catch((error) => {
                    reject('Error: '+ error);
                });
        }
    });
}

async function create(importClass, fields) {
    return new Promise((resolve, reject) => {
        try {
            const request = net.request({
                method: 'POST',
                protocol: 'http:',
                hostname: connectConfig.server,
                port: 80,
                path: encodeURI('/itop/web/webservices/rest.php?version=1.3&json_data={"operation": "core/create", "comment": "import wizard", "class": "'+importClass+'", "output_fields": "id, name", "fields": '+fields+'}'),
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
                    // parse the body as json
                    var json = JSON.parse(body);
                    if (response.statusCode === 200 && json.code === 0) {
                        resolve(json.objects[Object.keys(json.objects)[0]].fields.id);
                    } else {
                        reject('Error: '+ 'Import orgs failed:S');
                    }
                });
            });
            request.on('error', (error) => {
                reject('Error: '+ error);
            });
            request.end();
            // send event 'redirect' to renderer process with url 'importing.html'
            // event.sender.send('redirect', 'html/importing.html');
        } catch (err) {
            console.log('Error: '+ err);
        }
    });
}


module.exports = { importData, setConfig };