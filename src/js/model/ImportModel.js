const importModel = {
    data: null, // JSON data from (YAML) file
};

function setFileData(fileData) {
    importModel.data = fileData;
}

function getFileData() {
    return importModel.data;
}

// return lists of errors or false if no errors
function getValidationErrors(json) {
    const orgNames = json.orgs.map(org => org.name);
    const slaNames = json.sla.map(sla => sla.name);
    let errors = [];

    json.orgs.forEach(org => {
        if (org.services) {
            org.services.forEach(service => {
                if (service.customers) {
                    service.customers.forEach(customer => {
                        if (!orgNames.includes(customer.name)) {
                            errors.push(`The org name "${customer.name}" in the customer list of "${service.name}" service in "${org.name}" org is not in the orgs list.`);
                        }
                    });
                }
                if (service.sla && !slaNames.includes(service.sla)) {
                    errors.push(`The SLA "${service.sla}" in "${service.name}" service in "${org.name}" org is not in the SLAs list.`);
                }
            });
        }
    });

    return errors;
}

module.exports = {
    setFileData,
    getFileData,
    getValidationErrors
};