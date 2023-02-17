const { importData } = require('./import.js');
const { exportData } = require('./export.js');
const { setConfig, checkCredentials } = require('./config/config.js');
const { setFileData, getFileData, getValidationErrors } = require('./model/ImportModel.js');

module.exports = {
    importData,
    exportData,
    setConfig,
    checkCredentials,
    setFileData,
    getFileData,
    getValidationErrors,
    init: (type) => {
        console.log(`init ITOP sc-tool!`);
    }
};
