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
  const keys = Object.keys(obj);
  const returnObj = {};
  keys.forEach((key) => {
    let i = 0;
    const value = obj[key];
    let string = String();
    while (i < key.length) {
      if (i === 0) {
        string += key[i].toLocaleUpperCase();
      } else if (key[i] === key[i].toLocaleUpperCase()) {
        string += ' ';
        string += key[i];
      } else { string += key[i]; }
      i += 1;
    }
    returnObj[string.toString()] = value;
  });
  return returnObj;
}

exports.prettyKeys = prettyKeys;
exports.flattenObject = flattenObject;
