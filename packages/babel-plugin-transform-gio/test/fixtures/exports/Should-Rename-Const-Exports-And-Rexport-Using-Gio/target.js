function getRelativeFileName() {
  return `./${getFileName()}`;
}

export const getFileName = gio.defineExport('getFileName', _getFileName);

const _getFileName = function () {
  return 'Redundant file';
};