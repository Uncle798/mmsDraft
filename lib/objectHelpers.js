function flattenObject(obj) {
  const flattened = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value));
    } else {
      flattened[key] = value;
    }
  });
  return flattened;
}

function prettyKeys(obj) {
  const returnObj = {};
  Object.keys(obj).forEach((key) => {
    if (typeof key === 'object') { prettyKeys(obj[key]); }
    let i = 0;
    const value = obj[key];
    let newKey = String();
    while (i < key.length) {
      if (i === 0) {
        newKey += key[i].toLocaleUpperCase();
      } else if (key[i] === key[i].toLocaleUpperCase()) {
        newKey += ' ';
        newKey += key[i];
      } else { newKey += key[i]; }
      i += 1;
    }
    returnObj[newKey] = value;
  });
  return returnObj;
}

function objHelpers(obj) {
  const flatObj = flattenObject(obj);
  const prettyObj = prettyKeys(flatObj);
  return prettyObj;
}

exports.flattenObject = flattenObject;
exports.prettyKeys = prettyKeys;
exports.objHelpers = objHelpers;
