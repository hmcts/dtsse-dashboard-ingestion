const { File, Blob } = require('buffer');
if (!global.File) {
  global.File = File;
}
if (!global.Blob) {
  global.Blob = Blob;
}
