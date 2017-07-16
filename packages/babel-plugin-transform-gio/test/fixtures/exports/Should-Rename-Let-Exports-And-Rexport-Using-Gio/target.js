function getRelativeFileName() {
  return `./${getFileName()}`;
}

let _getFileName = function () {
  return 'Redundant file';
};

export let getFileName = gio.defineExport(0, 'getFileName', _getFileName);