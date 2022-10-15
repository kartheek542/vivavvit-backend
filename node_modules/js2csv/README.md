# js2csv

> 一个可链式调用的将 `json` 或 `js` 对象转换或导出为 `CSV` 的包。

## 安装

``` bash

# install
npm install js2csv --save

```

## 使用示例

```ecmascript 6

import js2csv from 'js2csv'

const data = [
  {
    name: 'wang',
    email: 'wang@gmail.com',
    phone: '12312312312'
  },
  {
     name: 'zhang',
     email: 'zhang@gmail.com',
     phone: '12312312312'
   },
   {
     name: 'li',
     email: 'li@gmail.com',
     phone: '12312312312'
   }
]

const heads = {
  name: '姓名',
  email: '邮箱',
  phone: '手机号'
}

// 解析并下载

js2csv.setData(data).setHead(heads).setName('花名册').parse().download()

// 解析并返回字符串

let string = js2csv.setData(data).setHead(heads).setName('花名册').render()

console.log(string) // 返回解析后的csv字符串

// transform 接受一个函数，该函数接受一个行为参数

js2csv.setData(data).setHead(heads).setName('花名册').transform(function (row) {
  // 返回新的行数据
  return {
    name: row.name,
    email: row.email,
    phone: row.phone
  }
}).parse().download()

```
## 可用方法

|方法名称|参数类型|默认值|说明|返回值|
|----|----|----|----|----|
|setData()|Array|[]|*必须， 待转换的原始数据|this|
|setHead()|Object|{}|设置表头，如果为空或忽略导出数据不包含表头|this|
|setName()|String|Date.now() + '.csv'|导出文件名，如果为空或忽略将以当前时间戳为文件名|this|
|transform|Function|无|接收一个函数。该函数以当前处理行作为参数并返回经过处理的新行|this|
|parse()|无|无|格式化数据|this|
|download()|无|无|下载文件|无|
|render()|无|无|返回CSV格式字符串|格式化后字符串|

## IE浏览器支持

`download()` 方法支持 `IE >= 10`

如果需要低版本支持，可使用 `render()` 方法获取格式化字符串，自行编写下载文件方法。

[MIT](https://github.com/jiaxincui/js2csv/blob/master/LICENSE.md) © [JiaxinCui](https://github.com/jiaxincui)
