function getRelativeFileName() {
  return `./${getFileName()}`;
}

const getFileName = function(named = 'Unnamed') {
  return `Redundant file:${named}`;
}

export default getFileName;