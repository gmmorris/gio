function getRelativeFileName() {
  return `./${getFileName()}`;
}

export const getFileName = gio.defineExport('getFileName', _getFileName);

function _getFileName() {
  return 'Redundant file';
}