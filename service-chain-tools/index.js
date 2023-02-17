module.exports = {
    init : (type) => {
        console.log(`init ${type}!`);
        var ctrl = null;
        if (type === 'itop') {
            ctrl = require('./src/sc-itop');
            module.exports.importData = ctrl.importData;
            module.exports.exportData = ctrl.exportData;
            module.exports.setConfig = ctrl.setConfig;
            module.exports.checkCredentials = ctrl.checkCredentials;
            module.exports.setFileData = ctrl.setFileData;
            module.exports.getFileData = ctrl.getFileData;
            module.exports.getValidationErrors = ctrl.getValidationErrors;
        }
        ctrl.init(type);
    }
};