/**
* isNewerVersion takes the old app version ,and new app version make a comparison and returns boolean.
* If there is no change in the versions it will return false.
* @param {string} oldVer 
* @param {string} newVer
*/
const isNewerVersion = (oldVer, newVer) => {
    if (!oldVer || !newVer) return false;

    const oldParts = oldVer?.split('.');
    const newParts = newVer?.split('.');
    for (let i = 0; i < newParts?.length; i++) {
        let a = ~~newParts[i]; // Using ~~ syntax to convert string into number 
        let b = ~~oldParts[i];
        if (a > b) return true;
        if (a < b) return false;
    }
    return true;
};

const hasDuplicates = (arr) => {
  return new Set(arr).size !== arr.length;
}

module.exports = {
    isNewerVersion,
    hasDuplicates,
};
