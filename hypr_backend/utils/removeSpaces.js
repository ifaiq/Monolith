const removeWhiteSpace = (value = "") => value && value.toString().replace(/\s+/g, "");
const slugifyString = (str = "") => str.toLowerCase().trim().replace(/[^\w\s-]/g, '')
.replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

module.exports = {
  removeWhiteSpace,
  slugifyString,
};
