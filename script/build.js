/*
简单描述该文件的整个流程
1.创建dist文件夹：有就算了，没有就创建，用于存放打包后的代码
2.获取配置信息
3.根据用户输入的执行脚本，筛选有用的构建版本（通过比对文件的目标地址或名称）
4.根据3中的想要生成的版本数进行build，异步过程
5.判断环境是不是生产，是生产的需要进行压缩，不是的话直接生成
6.生成过程中会有一些console信息的展示，用于提示用户
 */


const fs=require('fs');//导入构建源码时的核心node模块
const path=require('path');//用于解析路径
const zlib=require('zlib');//zip压缩
const rollup=require('rollup');//导入打包器
const terser=require('terser');//代码压缩器，无可读性

//使用同步函数，在打包代码的主业务逻辑前,对dist目录存在与否做确认
//使用且只能使用同步
//用来存放最终打包的代码
if (!fs.existsSync('dist')){
  fs.mkdirSync('dist')
}
let builds = require('./config').getAllBuilds();//获取所有构建参数【{某一环境的构建参数对象，{}}】

/*
根据用户的指令来构建做一个过滤
process.argv[2]为命令的第三个参数
如：node scrips/build production  其中production为第三个参数，即argv[2]
下面代码就是将命令和已有的配置进行筛选，筛选出有用的，也就是配置了的，防止用户指定目录。没配置的瞎写的当然识别不出来

 */
if (process.argv[2]) {
  const filters = process.argv[2].split(',')
  builds = builds.filter(b => {
    //有可能用file的名字，也有可能用name。在config文件中
    return filters.some(f => b.output.file.indexOf(f) > -1 || b._name.indexOf(f) > -1)
  })
} else {
  // filter out weex builds by default
  builds = builds.filter(b => {
    return b.output.file.indexOf('weex') === -1
  })
}



build(builds)

//构建函数，传入构建参数数组，来构建目标代码，构建业务入口
function build (builds) {
  let built = 0
  const total = builds.length//获取需要的构建版本数
  const next = () => {
    buildEntry(builds[built]).then(() => {
      built++
      //没有和构建完成，继续
      if (built < total) {
        next()
      }
    }).catch(logError)
    //出错则抛错
  }

  next()
}

//实际构建过程
function buildEntry (config) {
  const output = config.output//获取输出信息
  const { file, banner } = output//获取的文件地址和头部内容
  const isProd = /(min|prod)\.js$/.test(file)//正则，判断是不是生产版本
  return rollup.rollup(config)
    .then(bundle => bundle.generate(output))
    .then(({ output: [{ code }] }) => {
      if (isProd) {
        //如果是生产环境，压缩
        //判断banner有没有，有的话，拼接，整个压缩的代码其实就是一个string，所以拼接
        //\n是换行，否则如果banner有注释，则把所有内容都会注释掉
        const minified = (banner ? banner + '\n' : '') + terser.minify(code, {
          //默认false，开启对全局方法，变量采用混淆/压缩/简化操作
          //1.有全局变量，从未被使用过，则直接删除
          //2.在条件允许的情况下（如果变量超过26个，那就以两个字母组成），所有变量转换成单个字符串
          toplevel: true,
          output: {
            ascii_only: true//输出格式阿斯克码
          },
          compress: {
            pure_funcs: ['makeMap']//压缩选项，参数：删除指定功能
          }
        }).code
        return write(file, minified, true)//地址代码和是否压缩
      } else {
        return write(file, code)
      }
    })
}

//写入文件
function write (dest, code, zip) {
  return new Promise((resolve, reject) => {
    function report (extra) {
      //完成压缩后，打印信息
      console.log(blue(path.relative(process.cwd(), dest)) + ' ' + getSize(code) + (extra || ''))
      resolve()
    }

    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (zip) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err)
          report(' (gzipped: ' + getSize(zipped) + ')')
        })
      } else {
        report()
      }
    })
  })
}

//文件的大小
function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

//报错信息
function logError (e) {
  console.log(e)
}

//给字加颜色
function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}
