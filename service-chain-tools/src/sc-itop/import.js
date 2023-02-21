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
        await importTeams(data);
        await importPerson(data);
        await importLinkPersonToTeam(data);
        await importLinkTeamToService(data);
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
        var tto_priority = data.sla[sl].guarantees.tto["x-itop-priority"] || '1';
        var tto_request_type = data.sla[sl].guarantees.tto["x-itop-request-type"] || 'incident';
        var tto_value = data.sla[sl].guarantees.tto.max.value;
        var tto_unit = data.sla[sl].guarantees.tto.max.unit || 'minutes';
        promises.push(create('SLT', '{ "name": "maxTTO", "priority": "' + tto_priority + '", "request_type": "' + tto_request_type +'", "metric": "tto", "value": "' + tto_value + '", "unit": "'+ tto_unit + '" }')
            .then((id) => {
                console.log('id: ' + id);
                data.sla[sl].guarantees.tto.id = id;
            }).catch((error) => {
                console.log(error);
                Promise.reject(new Error('Error creating SLT: ' + data.sla[sl].name));
            }));
        var ttr_priority = data.sla[sl].guarantees.ttr["x-itop-priority"] || '1';
        var ttr_request_type = data.sla[sl].guarantees.ttr["x-itop-request-type"] || 'incident';
        var ttr_value = data.sla[sl].guarantees.ttr.max.value;
        var ttr_unit = data.sla[sl].guarantees.ttr.max.unit || 'minutes';
        promises.push(create('SLT', '{ "name": "maxTTR", "priority": "' + ttr_priority + '", "request_type": "' + ttr_request_type + '", "metric": "ttr", "value": "' + ttr_value + '", "unit": "'+ ttr_unit + '" }')
            .then((id) => {
                console.log('id: ' + id);
                data.sla[sl].guarantees.ttr.id = id;
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
    for (const sl in data.sla) {
        for (const org in data.orgs){
            for (const service in data.orgs[org].services) {
                for (const customer in data.orgs[org].services[service].customers) {
                    // if SLA does not exist, create it
                    if (data.orgs[org].services[service].customers[customer].sla === data.sla[sl].name && data.sla[sl].id === undefined) {
                        try {
                            const id = await create('SLA', '{ "name": "' + data.sla[sl].name + '", "description": "' + (data.sla[sl].description || '') + '", "org_id": "' + data.orgs[org].id + '" }');
                            console.log('id: ' + id);
                            data.sla[sl].id = id;
                        } catch (error) {
                            console.log(error);
                            throw new Error('Error creating SLA: ' + data.sla[sl].name);
                        }
                    }
                }
            }
        }
    }
    return data;
}


async function importLinkSLAtoSLT(data) {
    console.log("paso 5");
    const promises = [];
    for (const sl in data.sla) {
        // create link from data.sla[sl].id to data.sla[sl].guarantees.tto.id and ttr.id
        if (data.sla[sl].id !== undefined) {
            promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.sla[sl].id + '", "slt_id": "' + data.sla[sl].guarantees.tto.id + '" }')
                .then((id) => {
                    console.log('id: ' + id);
                }).catch((error) => {
                    console.log(error);
                    Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
                }));
            promises.push(create('lnkSLAToSLT', '{ "sla_id": "' + data.sla[sl].id + '", "slt_id": "' + data.sla[sl].guarantees.ttr.id + '" }')
                .then((id) => {
                    console.log('id: ' + id);
                }).catch((error) => {
                    console.log(error);
                    Promise.reject(new Error('Error creating lnkSLAToSLT: ' + data.sla[sl].name));
                }));
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
                // we need to get the id of the SLA by accessing the SLA and checking the name
                for (const sl in data.sla) {
                    if (data.sla[sl].name === data.orgs[org].services[service].customers[customer].sla) {
                        var sla_id = data.sla[sl].id;
                    }
                }
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

async function importTeams(data) {
    console.log("paso 8");
    const promises = [];
    for (const org in data.orgs){
        for (const team in data.orgs[org].teams) {
            var name = data.orgs[org].teams[team].name;
            var org_id = data.orgs[org].id;
            promises.push(create('Team', '{ "name": "' + name + '", "org_id": "' + org_id + '" }')
                .then((id) => {
                    console.log('id: ' + id);
                    data.orgs[org].teams[team].id = id;
                }).catch((error) => {
                    console.log(error);
                    Promise.reject(new Error('Error creating Team: ' + name));
                }));
        }
    }
    await Promise.all(promises);
    return data;
}

async function importPerson(data) {
    console.log("paso 9");
    const promises = [];
    for (const org in data.orgs){
        for (const team in data.orgs[org].teams) {
            for (const person in data.orgs[org].teams[team].members) {
                var name = data.orgs[org].teams[team].members[person].name;
                var email = data.orgs[org].teams[team].members[person].email;
                var first_name = name;
                var org_id = data.orgs[org].id;
                promises.push(create('Person', '{ "name": "' + name + '", "first_name": "' + first_name + '", "email": "' + email + '", "org_id": "' + org_id + '" }')
                    .then((id) => {
                        console.log('id: ' + id);
                        data.orgs[org].teams[team].members[person].id = id;
                    }).catch((error) => {
                        console.log(error);
                        Promise.reject(new Error('Error creating Person: ' + name));
                    }));
            }
        }
    }
    await Promise.all(promises);
    return data;
}

async function importLinkPersonToTeam(data) {
    console.log("paso 10");
    const promises = [];
    for (const org in data.orgs){
        for (const team in data.orgs[org].teams) {
            for (const person in data.orgs[org].teams[team].members) {
                var person_id = data.orgs[org].teams[team].members[person].id;
                var team_id = data.orgs[org].teams[team].id;
                promises.push(create('lnkPersonToTeam', '{ "person_id": "' + person_id + '", "team_id": "' + team_id + '" }')
                    .then((id) => {
                        console.log('id: ' + id);
                    }).catch((error) => {
                        console.log(error);
                        Promise.reject(new Error('Error creating lnkPersonToTeam: ' + person_id));
                    }));
            }
        }
    }
    await Promise.all(promises);
    return data;
}

async function importLinkTeamToService(data) {
    console.log("paso 11");
    const promises = [];
    // orgs[org].teams[team].name must be the same as orgs[org].services[service].teams[team].name
    for (const org in data.orgs){
        for (const service in data.orgs[org].services) {
            for (const team in data.orgs[org].services[service].teams) {
                for (const team2 in data.orgs[org].teams) {
                    if (data.orgs[org].teams[team2].name === data.orgs[org].services[service].teams[team].name) {
                        var team_id = data.orgs[org].teams[team2].id;
                        var service_id = data.orgs[org].services[service].id;
                        promises.push(create('lnkContactToService', '{ "contact_id": "' + team_id + '", "service_id": "' + service_id + '" }')
                            .then((id) => {
                                console.log('id: ' + id);
                            }).catch((error) => {
                                console.log(error);
                                Promise.reject(new Error('Error creating lnkContactToService: ' + team_id));
                            }));
                    }
                }
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