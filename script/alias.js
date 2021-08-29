const path = require('path')//用于解析路径


// 传入path（针对项目根目录的路径），返回一个绝对路径，方便node找到该文件
const resolve = p => path.resolve(__dirname, '../', p)

//对应不同常见模块的入口，做一个路径解析和重命名
module.exports = {
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  compiler: resolve('src/compiler'),
  core: resolve('src/core'),
  shared: resolve('src/shared'),
  web: resolve('src/platforms/web'),
  weex: resolve('src/platforms/weex'),
  server: resolve('src/server'),
  sfc: resolve('src/sfc')
}
