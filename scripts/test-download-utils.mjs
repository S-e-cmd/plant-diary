import assert from 'node:assert/strict';
import { downloadBrowserBlob } from '../client/download-utils.js';

const calls = {
  blob: null,
  createObjectUrl: null,
  revokeObjectUrl: null,
  createdTag: null,
  clicked: false,
};

class FakeBlob {
  constructor(parts, options) {
    calls.blob = { parts, options };
  }
}

const anchor = {
  href: '',
  download: '',
  click() {
    calls.clicked = true;
  },
};

globalThis.Blob = FakeBlob;
globalThis.document = {
  createElement(tag) {
    calls.createdTag = tag;
    return anchor;
  },
};
globalThis.URL = {
  createObjectURL(blob) {
    calls.createObjectUrl = blob;
    return 'blob:test-download';
  },
  revokeObjectURL(url) {
    calls.revokeObjectUrl = url;
  },
};
globalThis.setTimeout = callback => {
  callback();
  return 1;
};

downloadBrowserBlob('sample-content', 'sample.csv', 'text/csv;charset=utf-8');

assert.deepEqual(calls.blob?.parts, ['sample-content']);
assert.equal(calls.blob?.options?.type, 'text/csv;charset=utf-8');
assert.equal(calls.createdTag, 'a');
assert.ok(calls.createObjectUrl instanceof FakeBlob);
assert.equal(anchor.href, 'blob:test-download');
assert.equal(anchor.download, 'sample.csv');
assert.equal(calls.clicked, true);
assert.equal(calls.revokeObjectUrl, 'blob:test-download');

console.log('download utility: ok');
