module.exports = {
  root: true,
  parserOptions: { // 检查选项
    parser: require.resolve('babel-eslint'), // 解析引擎
    ecmaVersion: 2018,
    //默认设置为 3，5（默认）， 你可以使用 6、7、8、9 或 10 来指定你想要使用的 ECMAScript 版本。
    // 你也可以用使用年份命名的版本号指定为 2015（同 6），2016（同 7），或 2017（同 8）或 2018（同 9）或 2019 (same as 10)
    sourceType: 'module' // 设置为 "script" (默认) 或 "module"（如果你的代码是 ECMAScript 模块)
  },
  env: {// 代码 的目标环境 一个环境定义了一组预定义的全局变量。可用的环境包括：
    es6: true,
    node: true,
    browser: true
  },
  plugins: [
    "flowtype" //检查代码时附带的检查插件,允许flow的存在
  ],
  extends: [
    "eslint:recommended",
    // 值为 "eslint:recommended" 的 extends 属性启用一系列核心规则，这些规则报告一些常见问题，
    // 在 规则页面 中被标记为  。这个推荐的子集只能在 ESLint 主要版本进行更新。
    "plugin:flowtype/recommended" // flow类型标记系统的检查插件
  ],
  rules: {
    /*
      ESLint 附带有大量的规则。你可以使用注释或配置文件修改你项目中要使用的规则。要改变一个规则设置，你必须将规则 ID 设置为下列值之一：
        "off" 或 0 - 关闭规则
        "warn" 或 1 - 开启规则，使用警告级别的错误：warn (不会导致程序退出)
        "error" 或 2 - 开启规则，使用错误级别的错误：error (当被触发的时候，程序会退出)
    */
    'no-console': process.env.NODE_ENV !== 'production' ? 0 : 2,
    'no-useless-escape': 0,
    'no-empty': 0
  }
}
