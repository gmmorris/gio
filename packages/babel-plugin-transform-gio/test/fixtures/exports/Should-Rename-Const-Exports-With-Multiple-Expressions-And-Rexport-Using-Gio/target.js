function getRelativeFileName() {
  return `./${getFileName()}`;
}

const _getFileName = function (named = 'Unnamed') {
  return `Redundant file:${named}`;
},
      _getSecondFileName = function () {
  return 'Second Redundant file';
};

export const getFileName = gio.defineExport(0, 'getFileName', _getFileName),
      getSecondFileName = gio.defineExport(1, 'getSecondFileName', _getSecondFileName);