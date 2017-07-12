function getRelativeFileName() {
  return `./${getFileName()}`;
}

const _getFileName = function _getFileName(named = 'Unnamed') {
  return `Redundant file:${named}`;
};

const getFileName = gio.defineDefaultExport('getFileName', _getFileName);
export default getFileName;