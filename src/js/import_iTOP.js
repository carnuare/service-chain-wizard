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

const importData = async (data) => {
    try {
        await importOrgs(data);
        await importServices(data);
        await importSLTs(data);
        await importSLAs(data);
        await importLinkSLAtoSLT(data);
        // await importContracts(data); // Customer Agreements 
        return 'Import success!';
    } catch (error) {
        return 'Error: ' + error;
    }
};

async function importOrgs(data) {
    const promises = [];
    for (const org in data.orgs) {
        promises.push(create('Organization', '{ "name": "' + data.orgs[org].name + '", "code": "' + data.orgs[org].code + '", "status": "' + (data.orgs[org].status || 'active') + '" }')
            .then((id) => {
                console.log('id: ' + id);
                data.orgs[org].id = id;
            }).catch((error) => {
                console.log(error);
                Promise.reject(new Error('Error creating Organization: ' + data.orgs[org].name));
            }));
    }
    await Promise.all(promises);
    return data;
}

async function importServices(data) {
    console.log("paso 2");
    const promises = [];
    for (const org in data.orgs) {
        for (const service in data.orgs[org].services) {
            promises.push(create('Service', '{ "name": "' + data.orgs[org].services[service].name + '", "org_id": "' + data.orgs[org].id + '", "description": "' + (data.orgs[org].services[service].description || '') + '" }')
                .then((id) => {
                    console.log('id: ' + id);
                    data.orgs[org].services[service].id = id;
                }).catch((error) => {
                    console.log(error);
                    Promise.reject(new Error('Error creating Service: ' + data.orgs[org].services[service].name));
                }));
        }
    }
    await Promise.all(promises);
    return data;
}

async function importSLTs(data) {
    console.log("paso 3");
    const promises = [];
    for (const sl in data.sla) {
        promises.push(create('SLT', '{ "name": "maxTTO", "priority": "1", "request_type": "incident", "metric": "tto", "value": "' + data.sla[sl].slt.maxTTO + '", "unit": "'+ (data.sla[sl].slt.unit || 'minutes') + '" }')
            .then((id) => {
                console.log('id: ' + id);
                data.sla[sl].slt.idTTO = id;
            }).catch((error) => {
                console.log(error);
                Promise.reject(new Error('Error creating SLT: ' + data.sla[sl].name));
            }));
        promises.push(create('SLT', '{ "name": "maxTTR", "priority": "1", "request_type": "incident", "metric": "ttr", "value": "' + data.sla[sl].slt.maxTTR + '", "unit": "'+ (data.sla[sl].slt.unit || 'minutes') + '" }')
            .then((id) => {
                console.log('id: ' + id);
                data.sla[sl].slt.idTTR = id;
            }).catch((error) => {
                console.log(error);
                Promise.reject(new Error('Error creating SLT: ' + data.sla[sl].name));
            }));
        }
    await Promise.all(promises);
    return data;
}

async function importSLAs(data) {
    console.log("paso 4");
    const promises = [];
    for (const sl in data.sla) {
        for(const org in data.orgs){
            for (const service in data.orgs[org].services) {
                if (data.orgs[org].services[service].sla === data.sla[sl].name) {
                    promises.push(create('SLA', '{ "name": "' + data.sla[sl].name + '", "description": "' + (data.sla[sl].description || '') + '", "org_id": "' + data.orgs[org].id + '" }')
                        .then((id) => {
                            console.log('id: ' + id);
                            data.orgs[org].services[service].sla.id = id;
                        }).catch((error) => {
                            console.log(error);
                            Promise.reject(new Error('Error creating SLA: ' + data.sla[sl].name));
                        }));
                }
            }
        }
    }
    await Promise.all(promises);
    return data;
}

async function importLinkSLAtoSLT(data) {
    console.log("paso 5");
    const promises = [];
    for (const sl in data.sla) {
        for(const org in data.orgs){
            for (const service in data.orgs[org].services) {
                if (data.orgs[org].services[service].sla === data.sla[sl].name) {
                    promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].sla.id + '", "slt_id": "' + data.sla[sl].slt.idTTO + '" }')
                        .then((id) => {
                            console.log('id: ' + id);
                        }).catch((error) => {
                            console.log(error);
                            Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
                        }));
                    promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].sla.id + '", "slt_id": "' + data.sla[sl].slt.idTTR + '" }')
                        .then((id) => {
                            console.log('id: ' + id);
                        }).catch((error) => {
                            console.log(error);
                            Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
                        }));
                }
            }
        }
    }
    await Promise.all(promises);
    return data;
}

// async function importContracts(data) {
//     console.log("paso 5");
//     const promises = [];
//     for (const org in data.orgs){
//         for (const service in data.orgs[org].services) {
//             for (const customer in data.orgs[org].services[service].customers) {


async function create(importClass, fields) {
    return new Promise((resolve, reject) => {
        try {
            const request = net.request({
                method: 'POST',
                protocol: 'http:',
                hostname: connectConfig.server,
                port: 80,
                path: encodeURI('/itop/web/webservices/rest.php?version=1.3&json_data={"operation": "core/create", "comment": "import wizard", "class": "'+importClass+'", "output_fields": "id", "fields": '+fields+'}'),
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
                        reject(new Error('Error creating '+importClass+' : '+json.message));
                    }
                });
            });
            request.on('error', (error) => {
                reject(new Error('Error creating '+importClass+' : '+error));
            });
            request.end();
            // send event 'redirect' to renderer process with url 'importing.html'
            // event.sender.send('redirect', 'html/importing.html');
        } catch (err) {
            console.log(new Error('Error creating '+importClass+' : '+err));
        }
    });
}


module.exports = { importData, setConfig };