const { net } = require('electron');
const { connectConfig, ITOP_REST_VERSION } = require('./config/config.js');

const exportData = async () => {
    try {
        const exportJSON = {}; 
        await exportOrgs(exportJSON);
        await exportServices(exportJSON);
        await exportSLAs(exportJSON);
        // await exportSLTs(data);
        // await exportSLAs(data);
        // await exportLinkSLAtoSLT(data);
        // await exportCustomerContracts(data); // Customer Agreements 
        // await exportLinkContractToService(data);
        return exportJSON;
    } catch (error) {
        throw new Error(error);
    }
};

async function exportOrgs(json) {
    console.log("paso 1");
    return new Promise((resolve, reject) => {
        getClass('Organization', 'id, name, code, status')
            .then((data) => {
                console.log('data: ' + data);
                json.orgs = [];
                for (let key in data.objects) {
                    const org = data.objects[key];
                    json.orgs.push({
                        "name": org.fields.name,
                        "id": org.fields.id,
                        "code": org.fields.code,
                        "status": org.fields.status
                    });
                }
                resolve(json);
            }).catch((error) => {
                console.log(error);
                reject(new Error('Error getting Organizations'));
            }
            );
    }
    );
}

async function exportServices(json) {
    console.log("paso 2");
    return new Promise((resolve, reject) => {
        getClass('Service', 'id, name, org_id, description, status')
            .then((data) => {
                console.log('data: ' + data);
                // foreach org, if service.org_id == json.orgs[org].id, add service to json.orgs[org].services
                for (let key in data.objects) {
                    const service = data.objects[key];
                    for (let org in json.orgs) {
                        if (service.fields.org_id == json.orgs[org].id) {
                            if (!json.orgs[org].services) {
                                json.orgs[org].services = [];
                            }
                            json.orgs[org].services.push({
                                "name": service.fields.name,
                                "id": service.fields.id,
                                "description": service.fields.description,
                                "status": service.fields.status
                            });
                        }
                    }
                }
                resolve(json);
            }).catch((error) => {
                console.log(error);
                reject(new Error('Error getting Services'));
            }
            );
    }
    );
}

async function exportSLAs(json) {
    console.log("paso 3");
    return new Promise((resolve, reject) => {
        getClass('SLA', 'id, name, org_id, description')
            .then((data) => {
                console.log('data: ' + data);
                json.sla = [];
                for (let key in data.objects) {
                    const sla = data.objects[key];
                    json.sla.push({
                        "name": sla.fields.name,
                        "id": sla.fields.id,
                        "org_id": sla.fields.org_id,
                        "description": sla.fields.description
                    });
                }
                resolve(json);
            }).catch((error) => {
                console.log(error);
                reject(new Error('Error getting SLAs'));
            }
            );
    }
    );
}

// async function importSLTs(data) {
//     console.log("paso 3");
//     const promises = [];
//     for (const sl in data.sla) {
//         promises.push(create('SLT', '{ "name": "maxTTO", "priority": "1", "request_type": "incident", "metric": "tto", "value": "' + data.sla[sl].slt.maxTTO + '", "unit": "'+ (data.sla[sl].slt.unit || 'minutes') + '" }')
//             .then((id) => {
//                 console.log('id: ' + id);
//                 data.sla[sl].slt.idTTO = id;
//             }).catch((error) => {
//                 console.log(error);
//                 Promise.reject(new Error('Error creating SLT: ' + data.sla[sl].name));
//             }));
//         promises.push(create('SLT', '{ "name": "maxTTR", "priority": "1", "request_type": "incident", "metric": "ttr", "value": "' + data.sla[sl].slt.maxTTR + '", "unit": "'+ (data.sla[sl].slt.unit || 'minutes') + '" }')
//             .then((id) => {
//                 console.log('id: ' + id);
//                 data.sla[sl].slt.idTTR = id;
//             }).catch((error) => {
//                 console.log(error);
//                 Promise.reject(new Error('Error creating SLT: ' + data.sla[sl].name));
//             }));
//         }
//     await Promise.all(promises);
//     return data;
// }

// async function importSLAs(data) {
//     console.log("paso 4");
//     const promises = [];
//     for (const sl in data.sla) {
//         for(const org in data.orgs){
//             for (const service in data.orgs[org].services) {
//                 if (data.orgs[org].services[service].sla === data.sla[sl].name) {
//                     promises.push(create('SLA', '{ "name": "' + data.sla[sl].name + '", "description": "' + (data.sla[sl].description || '') + '", "org_id": "' + data.orgs[org].id + '" }')
//                         .then((id) => {
//                             console.log('id: ' + id);
//                             data.orgs[org].services[service].idsla = id;
//                         }).catch((error) => {
//                             console.log(error);
//                             Promise.reject(new Error('Error creating SLA: ' + data.sla[sl].name));
//                         }));
//                 }
//             }
//         }
//     }
//     await Promise.all(promises);
//     return data;
// }

// async function importLinkSLAtoSLT(data) {
//     console.log("paso 5");
//     const promises = [];
//     for (const sl in data.sla) {
//         for(const org in data.orgs){
//             for (const service in data.orgs[org].services) {
//                 if (data.orgs[org].services[service].sla === data.sla[sl].name) {
//                     promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].idsla + '", "slt_id": "' + data.sla[sl].slt.idTTO + '" }')
//                         .then((id) => {
//                             console.log('id: ' + id);
//                         }).catch((error) => {
//                             console.log(error);
//                             Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
//                         }));
//                     promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.orgs[org].services[service].idsla + '", "slt_id": "' + data.sla[sl].slt.idTTR + '" }')
//                         .then((id) => {
//                             console.log('id: ' + id);
//                         }).catch((error) => {
//                             console.log(error);
//                             Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
//                         }));
//                 }
//             }
//         }
//     }
//     await Promise.all(promises);
//     return data;
// }

// async function importCustomerContracts(data) {
//     console.log("paso 6");
//     const promises = [];
//     for (const org in data.orgs){
//         for (const service in data.orgs[org].services) {
//             for (const customer in data.orgs[org].services[service].customers) {
//                 var name = data.orgs[org].services[service].name + ' : ' + data.orgs[org].services[service].customers[customer].name;
//                 var description = data.orgs[org].services[service].customers[customer].description || '';
//                 var provider_id = data.orgs[org].id;
//                 // the org_id is the customer org
//                 for (const org2 in data.orgs){
//                     if (data.orgs[org2].name === data.orgs[org].services[service].customers[customer].name) {
//                         var org_id = data.orgs[org2].id;
//                     }
//                 }
//                 if (!org_id) {
//                     Promise.reject(new Error('Error creating Contract: ' + name + ' - customer org not found'));
//                 }
//                 promises.push(create('CustomerContract', '{ "name": "' + name + '", "description": "' + description + '", "org_id": "' + org_id + '", "provider_id": "' + provider_id + '", "finalclass":"CustomerContract" }')
//                     .then((id) => {
//                         console.log('id: ' + id);
//                         data.orgs[org].services[service].customers[customer].idContract = id;
//                     }).catch((error) => {
//                         console.log(error);
//                         Promise.reject(new Error('Error creating Contract: ' + name));
//                     }));
//             }
//         }
//     }
//     await Promise.all(promises);
//     return data;
// }

// async function importLinkContractToService(data) {
//     console.log("paso 7");
//     const promises = [];
//     for (const org in data.orgs){
//         for (const service in data.orgs[org].services) {
//             for (const customer in data.orgs[org].services[service].customers) {
//                 var customercontract_id = data.orgs[org].services[service].customers[customer].idContract;
//                 var service_id = data.orgs[org].services[service].id;
//                 var sla_id = data.orgs[org].services[service].idsla;
//                 promises.push(create('lnkCustomerContractToService', '{ "customercontract_id": "' + customercontract_id + '", "service_id": "' + service_id + '", "sla_id": "' + sla_id + '" }')
//                     .then((id) => {
//                         console.log('id: ' + id);
//                     }).catch((error) => {
//                         console.log(error);
//                         Promise.reject(new Error('Error creating lnkCustomerContractToService: ' + customercontract_id));
//                     }));
//             }
//         }
//     }
//     await Promise.all(promises);
//     return data;
// }

async function getClass(exportClass, output_fields) {
    return new Promise((resolve, reject) => {
        const request = net.request({
            method: 'POST',
            protocol: 'http:',
            hostname: connectConfig.server,
            port: connectConfig.port,
            path: encodeURI(connectConfig.api_path + '?version=' + ITOP_REST_VERSION + '&json_data={"operation": "core/get", "class": "' + exportClass + '", "key": "SELECT ' + exportClass + '", "output_fields": "' + output_fields + '"}'),
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
                    // parse the body as json
                    var json = JSON.parse(body);
                    if (response.statusCode === 200 && json.code === 0) {
                        resolve(json);
                    } else {
                        reject(new Error('Error exporting ' + exportClass + ' : ' + json.message));
                    }
                } catch (error) {
                    reject(new Error('Error exporting ' + exportClass + ' : ' + error));
                }
            });
        });
        request.on('error', (error) => {
            reject(new Error('Error exporting ' + exportClass + ' : ' + error));
        });
        request.end();
    });
}

module.exports = { exportData };