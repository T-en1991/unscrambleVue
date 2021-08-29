const babelPresetFlowVue = {
  plugins: [
    require('@babel/plugin-proposal-class-properties'),//对js的类属性的定义方式，采用赋值或是defineProperty
    // require('@babel/plugin-syntax-flow'), // not needed, included in transform-flow-strip-types
    require('@babel/plugin-transform-flow-strip-types')//flow类型的识别
  ]
}

module.exports = {
  presets: [
    require('@babel/preset-env'),
    // require('babel-preset-flow-vue')
    babelPresetFlowVue
  ],
  plugins: [
    require('babel-plugin-transform-vue-jsx'),//转换vue里面的jsx语法
    require('@babel/plugin-syntax-dynamic-import')//动态导入es6语法
  ],
  ignore: [
    'dist/*.js',
    'packages/**/*.js'
  ]
}
