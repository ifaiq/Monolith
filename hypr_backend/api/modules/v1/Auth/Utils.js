/**
 * This method is responsible to generate 5 digits pin code
 * @returns {number}
 */
const randomCode = () =>
  // need to add 90000 otherwise Math.random will generate 4 digits number as well
  Math.floor(Math.random() * 90000) + 10000;

/**
 * This method is responsible to validate 15 digits tax id
 * @returns {number}
 */
const digitCount = num => {
  if (num === 0) return 1;
  return Math.floor(Math.log10(Math.abs(num))) + 1;
};
module.exports = {
  randomCode,
  digitCount,
};
