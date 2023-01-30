

// make above function a const with a promise that waits 2 seconds
// then returns a string
const importData = () => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Import data success!');
        }, 2000);
    });
};

module.exports = { importData };