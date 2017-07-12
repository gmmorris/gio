function getRelativeFileName() {
  return `./${getFileName()}`;
}

export const getFileName = function(named = 'Unnamed') {
  return `Redundant file:${named}`;
}, getSecondFileName = function() {
  return 'Second Redundant file';
}