function getRelativeFileName() {
  return `./${getFileName()}`;
}

let _getFileName = function () {
  return 'Redundant file';
};

export let getFileName = gio.defineExport('getFileName', _getFileName);