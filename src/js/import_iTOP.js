const { net } = require('electron');
const { connectConfig, ITOP_REST_VERSION } = require('./config/config.js');

const importData = async (data) => {
    try {
        await importOrgs(data);
        await importServices(data);
        await importSLTs(data);
        await importSLAs(data);
        await importLinkSLAtoSLT(data);
        await importCustomerContracts(data); // Customer Agreements 
        await importLinkContractToService(data);
        return 'Import success!';
    } catch (error) {
        throw new Error(error);
    }
};

async function importOrgs(data) {
    const promises = [];
    for (const org in data.orgs) {
        var name = data.orgs[org].name;
        var code = data.orgs[org].code;
        var status = data.orgs[org].status || 'active';
        promises.push(create('Organization', '{ "name": "' + name+ '", "code": "' + code + '", "status": "' + status + '" }')
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
            var name = data.orgs[org].services[service].name;
            var org_id = data.orgs[org].id;
            var description = data.orgs[org].services[service].description || '';
            var status = data.orgs[org].services[service].status || 'production';
            promises.push(create('Service', '{ "name": "' + name + '", "org_id": "' + org_id + '", "description": "' + description + '", "status": "' + status + '" }')
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
                            data.orgs[org].services[service].idsla = id;
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
                    promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].idsla + '", "slt_id": "' + data.sla[sl].slt.idTTO + '" }')
                        .then((id) => {
                            console.log('id: ' + id);
                        }).catch((error) => {
                            console.log(error);
                            Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
                        }));
                    promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].idsla + '", "slt_id": "' + data.sla[sl].slt.idTTR + '" }')
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

async function importCustomerContracts(data) {
    console.log("paso 6");
    const promises = [];
    for (const org in data.orgs){
        for (const service in data.orgs[org].services) {
            for (const customer in data.orgs[org].services[service].customers) {
                var name = data.orgs[org].services[service].name + ' : ' + data.orgs[org].services[service].customers[customer].name;
                var description = data.orgs[org].services[service].customers[customer].description || '';
                var provider_id = data.orgs[org].id;
                // the org_id is the customer org
                for (const org2 in data.orgs){
                    if (data.orgs[org2].name === data.orgs[org].services[service].customers[customer].name) {
                        var org_id = data.orgs[org2].id;
                    }
                }
                if (!org_id) {
                    Promise.reject(new Error('Error creating Contract: ' + name + ' - customer org not found'));
                }
                promises.push(create('CustomerContract', '{ "name": "' + name + '", "description": "' + description + '", "org_id": "' + org_id + '", "provider_id": "' + provider_id + '", "finalclass":"CustomerContract" }')
                    .then((id) => {
                        console.log('id: ' + id);
                        data.orgs[org].services[service].customers[customer].idContract = id;
                    }).catch((error) => {
                        console.log(error);
                        Promise.reject(new Error('Error creating Contract: ' + name));
                    }));
            }
        }
    }
    await Promise.all(promises);
    return data;
}

async function importLinkContractToService(data) {
    console.log("paso 7");
    const promises = [];
    for (const org in data.orgs){
        for (const service in data.orgs[org].services) {
            for (const customer in data.orgs[org].services[service].customers) {
                var customercontract_id = data.orgs[org].services[service].customers[customer].idContract;
                var service_id = data.orgs[org].services[service].id;
                var sla_id = data.orgs[org].services[service].idsla;
                promises.push(create('lnkCustomerContractToService', '{ "customercontract_id": "' + customercontract_id + '", "service_id": "' + service_id + '", "sla_id": "' + sla_id + '" }')
                    .then((id) => {
                        console.log('id: ' + id);
                    }).catch((error) => {
                        console.log(error);
                        Promise.reject(new Error('Error creating lnkCustomerContractToService: ' + customercontract_id));
                    }));
            }
        }
    }
    await Promise.all(promises);
    return data;
}

async function create(importClass, fields) {
    return new Promise((resolve, reject) => {
        try {
            const request = net.request({
                method: 'POST',
                protocol: 'http:',
                hostname: connectConfig.server,
                port: connectConfig.port,
                path: encodeURI(connectConfig.api_path + '?version='+ ITOP_REST_VERSION +'&json_data={"operation": "core/create", "comment": "import wizard", "class": "'+importClass+'", "output_fields": "id", "fields": '+fields+'}'),
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

module.exports = { importData };