const { net } = require('electron');
const { connectConfig, ITOP_REST_VERSION } = require('./config/config.js');

const exportData = async () => {
    try {
        const exportJSON = {}; 
        await exportOrgs(exportJSON);
        await exportServices(exportJSON);
        await exportSLAs(exportJSON);
        await exportSLTs(exportJSON);
        await exportCustomers(exportJSON);
        await cleanIds(exportJSON);
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

async function exportSLTs(json) {
    console.log("paso 4");
    return new Promise((resolve, reject) => {
        getClass('SLT', 'id, metric, value, unit')
            .then((data) => {
                console.log('data: ' + data);
                slts = [];
                for (let key in data.objects) {
                    const slt = data.objects[key];
                    slts.push({
                        "id": slt.fields.id,
                        "metric": slt.fields.metric,
                        "value": slt.fields.value,
                        "unit": slt.fields.unit
                    });
                }
                // then get SLA SLT links
                getClass('lnkSLAToSLT', 'sla_id, slt_id')
                    .then((data) => {
                        console.log('data: ' + data);
                        // for each SLA, if sla_id == json.sla[sla].id, add slt_id to json.sla[sla].slt
                        for (let key in data.objects) {
                            const link = data.objects[key];
                            for (let sla in json.sla) {
                                if (link.fields.sla_id == json.sla[sla].id) {
                                    if (!json.sla[sla].slt) {
                                        json.sla[sla].slt = [];
                                    }
                                    for (let slt in slts) {
                                        if (link.fields.slt_id == slts[slt].id) {
                                            var sltMetric = slts[slt].metric == 'tto' ? 'maxTTO' : 'maxTTR';
                                            json.sla[sla].slt.push({
                                                [sltMetric]: slts[slt].value,
                                                "unit": slts[slt].unit
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        resolve(json);
                    }).catch((error) => {
                        console.log(error);
                        reject(new Error('Error getting SLT links'));
                    }
                    );
            }).catch((error) => {
                console.log(error);
                reject(new Error('Error getting SLTs'));
            }
            );
    }
    );
}

async function exportCustomers(json) {
    console.log("paso 5");
    return new Promise((resolve, reject) => {
        getClass('CustomerContract', 'id, org_id, provider_id')
            .then((data) => {
                console.log('data: ' + data);
                var contracts = [];
                for (let key in data.objects) {
                    const contract = data.objects[key];
                    contracts.push({
                        "id": contract.fields.id,
                        "org_id": contract.fields.org_id,
                        "provider_id": contract.fields.provider_id
                    });
                }
                // get links between services and contracts
                getClass('lnkCustomerContractToService', 'customercontract_id, service_id, sla_id')
                    .then((data) => {
                        console.log('data: ' + data);
                        // for each service in org, if service_id == json.orgs[org].services[service].id, add the name of org_id from customercontract_id to json.orgs[org].services[service].customers
                        // and add the sla_id name to json.orgs[org].services[service].sla
                        for (let key in data.objects) {
                            const link = data.objects[key];
                            for (let org in json.orgs) {
                                for (let service in json.orgs[org].services) {
                                    if (link.fields.service_id == json.orgs[org].services[service].id) {
                                        if (!json.orgs[org].services[service].customers) {
                                            json.orgs[org].services[service].customers = [];
                                        }
                                        for (let contract in contracts) {
                                            if (link.fields.customercontract_id == contracts[contract].id) {
                                                for (let org2 in json.orgs) {
                                                    if (contracts[contract].org_id == json.orgs[org2].id) {
                                                        json.orgs[org].services[service].customers.push({
                                                            "name": json.orgs[org2].name,
                                                            "id": json.orgs[org2].id
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                        // if (!json.orgs[org].services[service].sla) {
                                        //     json.orgs[org].services[service].sla = [];
                                        // }
                                        for (let sla in json.sla) {
                                            if (link.fields.sla_id == json.sla[sla].id) {
                                                json.orgs[org].services[service].sla = json.sla[sla].name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        resolve(json);
                    }).catch((error) => {
                        console.log(error);
                        reject(new Error('Error getting customer contract links'));
                    }
                    );
            }).catch((error) => {
                console.log(error);
                reject(new Error('Error getting customer contracts'));
            }
            );
    }
    );
}

async function cleanIds(json) {
    console.log("paso 6");
    return new Promise((resolve, reject) => {
        for (let org in json.orgs) {
            delete json.orgs[org].id;
            for (let service in json.orgs[org].services) {
                delete json.orgs[org].services[service].id;
                for (let customer in json.orgs[org].services[service].customers) {
                    delete json.orgs[org].services[service].customers[customer].id;
                }
            }
        }
        for (let sla in json.sla) {
            delete json.sla[sla].id;
        }
        resolve(json);
    }
    );
}

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