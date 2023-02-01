const importModel = {
    data: null, // JSON data from (YAML) file
};

function setFileData(fileData) {
    importModel.data = fileData;
}

function getFileData() {
    return importModel.data;
}

module.exports = {
    setFileData,
    getFileData,
};