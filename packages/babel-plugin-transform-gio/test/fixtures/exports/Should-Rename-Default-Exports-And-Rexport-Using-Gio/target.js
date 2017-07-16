function getRelativeFileName() {
  return `./${getFileName()}`;
}

function _getFileName() {
  return 'Redundant file';
}

const getFileName = gio.defineDefaultExport(0, 'getFileName', _getFileName);
export default getFileName;