const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'store.json');

function ensureStoreExists() {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(
      dataPath,
      JSON.stringify({ users: [], files: [], user_files: [], requests: [] }, null, 2),
      'utf8'
    );
  }
}

function readStore() {
  ensureStoreExists();
  const raw = fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw || '{}');
}

function writeStore(data) {
  ensureStoreExists();
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(collection, prefix) {
  if (!collection.length) return `${prefix}1`;
  const max = collection
    .map((item) => Number(String(item.id || '').replace(prefix, '')))
    .filter((n) => Number.isFinite(n))
    .reduce((acc, cur) => Math.max(acc, cur), 0);
  return `${prefix}${max + 1}`;
}

module.exports = {
  readStore,
  writeStore,
  nextId
};
