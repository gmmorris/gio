function getRelativeFileName() {
  return `./${getFileName()}`;
}

const _getFileName = function () {
  return 'Redundant file';
};

export const getFileName = gio.defineExport('getFileName', _getFileName);