function getRelativeFileName() {
  return `./${getFileName()}`;
}

export const getFileName = gio.defineExport(0, 'getFileName', _getFileName);

function _getFileName() {
  return 'Redundant file';
}