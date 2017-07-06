function getRelativeFileName() {
  return `./${getFileName()}`;
}

function _getFileName() {
  return 'Redundant file';
}

export const getFileName = gio.defineExport('getFileName', _getFileName);