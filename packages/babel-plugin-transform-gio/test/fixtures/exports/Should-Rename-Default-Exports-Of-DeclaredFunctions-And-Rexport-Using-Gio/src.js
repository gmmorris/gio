function getRelativeFileName() {
  return `./${getFileName()}`;
}

function getFileName(named = 'Unnamed') {
  return `Redundant file:${named}`;
}

export default getFileName;