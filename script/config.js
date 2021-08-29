const path = require('path');//用于解析路径

//rollup相关
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const cjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const node = require('rollup-plugin-node-resolve')
const flow = require('rollup-plugin-flow-no-whitespace')

//获取项目版本信息，生成最终的头部注释
const version = process.env.VERSION || require('../package.json').version//项目版本信息
const weexVersion = process.env.WEEX_VERSION || require('../packages/weex-vue-framework/package.json').version//weex框架版本信息
const featureFlags = require('./feature-flags')//获取功能开关

//最终打包出的头部信息
const banner =
  '/*!\n' +
  ` * TenUnscrambleVue v${version}\n` +
  ` * (c) 2021-${new Date().getFullYear()} Ten(tianengu@outlook.com)\n` +
  ' */'


const aliases = require('./alias')//别名，获取绝对路径

/*
1.把传入的参数P做分割，分隔符号/
2.数组第一个作为基础path
3.根据解析出来的基础path，在alias里面获取真实地址，然后把第二数组开始的路径，一次连接，生成最终路径
 */
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    //如果存在别名，就拿出这个别名
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    //如果不存在别名，则说明不是别名路径，直接正常解析（以根目录路径）
    return path.resolve(__dirname, '../', p)
  }
}

//预设的两个基本信息，用于输出两种不同目标的框架代码，分别用于生产和开发环境
const builds = {
  'web-full-dev': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
    dest: resolve('dist/vue.js'),
    format: 'umd',
    env: 'development',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime+compiler production build  (Browser)
  'web-full-prod': {
    entry: resolve('web/entry-runtime-with-compiler.js'),
    dest: resolve('dist/vue.min.js'),
    format: 'umd',
    env: 'production',
    alias: { he: './entity-decoder' },
    banner
  }
}

//根据builds中的配置信息，需要转化为rollup.rollup()认识的信息
//上面builds中的设置是为了好看好设置，这里的方法是传为rollup函数能用的
function genConfig (name) {
  const opts = builds[name]//获取基础配置信息
  const config = {
    input: opts.entry,//打包入口
    external: opts.external,//打包配置信息的额外拓展
    plugins: [
      flow(),//引入插件
      alias(Object.assign({}, aliases, opts.alias))
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || 'Vue'
    },
    //警告信息
    onwarn: (msg, warn) => {
      if (!/Circular/.test(msg)) {
        warn(msg)
      }
    }
  }

  // built-in vars
  const vars = {
    __WEEX__: !!opts.weex,//是否开启weex的编译选项
    __WEEX_VERSION__: weexVersion,
    __VERSION__: version
  }
  // feature flags  根据配置的功能开关来决定不同环境下的具体参数
  //定义几个vars，也可以加进来
  Object.keys(featureFlags).forEach(key => {
    vars[`process.env.${key}`] = featureFlags[key]
  })

  // build-specific env  当前所处的环境
  if (opts.env) {
    vars['process.env.NODE_ENV'] = JSON.stringify(opts.env)
  }
  config.plugins.push(replace(vars))//根据用户的选配项，拼凑出构建时的基本参数，传入到插件中去

  //判断当前的构建参数里面是否需要开启对更新版本的es代码进行翻译到较早版本之前
  if (opts.transpile !== false) {
    config.plugins.push(buble())
  }

  //
  Object.defineProperty(config, '_name', {
    enumerable: false,
    value: name
  })

  return config
}

//如果指定构建的环境参数，那么就按照构建的环境参数
if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET)
} else {
  //将方法暴露出去
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}

