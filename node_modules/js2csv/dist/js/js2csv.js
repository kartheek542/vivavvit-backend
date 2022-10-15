'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  data: [],
  name: Date.now() + '.csv',
  heads: {},
  csvData: '',
  parsed: false,
  transformer: function transformer(row) {
    return row;
  },
  setData: function setData(data) {
    this.data = data || this.data;
    return this;
  },
  setHead: function setHead(heads) {
    this.heads = heads || this.heads;
    return this;
  },
  setName: function setName(name) {
    if (name) {
      var reg = new RegExp(/.csv$/);
      this.name = reg.test(name) ? name : name + '.csv';
    }
    return this;
  },
  transform: function transform(transformer) {
    if (typeof transformer === 'function') {
      this.transformer = transformer;
    }
    return this;
  },
  parse: function parse() {
    var _this = this;

    var csv = '';
    var keys = (0, _keys2.default)(this.heads).length ? (0, _keys2.default)(this.heads) : (0, _keys2.default)(this.data[0]);
    if ((0, _keys2.default)(this.heads).length) {
      csv = '"' + (0, _values2.default)(this.heads).join('","') + '"\r\n';
    }
    csv = this.data.reduce(function (pre, cur) {
      cur = _this.transformer(cur);
      return pre + '"' + keys.map(function (key) {
        return cur[key] || '';
      }).join('","') + '"\r\n';
    }, csv);
    this.csvData = csv;
    this.parsed = true;
    return this;
  },
  render: function render() {
    if (!this.parsed) {
      this.parse();
    }
    return this.csvData;
  },
  download: function download() {
    if (!this.parsed) {
      this.parse();
    }
    var url = window.URL || window.webkitURL;
    if (url && window.Blob) {
      var blob = new Blob(['\uFEFF' + this.csvData], { type: 'text/csv' });
      if ('msSaveBlob' in navigator) {
        navigator.msSaveBlob(blob, this.name);
      } else {
        var link = document.createElement('a');
        link.download = this.name;
        link.style.display = 'none';
        link.href = url.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        url.revokeObjectURL(blob);
      }
    }
  }
};
