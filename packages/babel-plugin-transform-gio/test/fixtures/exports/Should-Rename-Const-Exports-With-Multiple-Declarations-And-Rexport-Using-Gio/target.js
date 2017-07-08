function getRelativeFileName() {
  return `./${getFileName()}`;
}

export const getSecondFileName = gio.defineExport('getSecondFileName', _getSecondFileName);

const _getSecondFileName = function () {
  return 'Second Redundant file';
};

export const getFileName = gio.defineExport('getFileName', _getFileName);

const _getFileName = function () {
  return 'Redundant file';
};