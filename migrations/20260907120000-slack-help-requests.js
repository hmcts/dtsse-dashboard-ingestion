'use strict';
const fs = require('fs');
const path = require('path');
exports.up = db => db.runSql(fs.readFileSync(path.join(__dirname, 'sqls/20260907120000-slack-help-requests-up.sql'), 'utf8'));
exports.down = db => db.runSql(fs.readFileSync(path.join(__dirname, 'sqls/20260907120000-slack-help-requests-down.sql'), 'utf8'));
exports._meta = { version: 1 };
