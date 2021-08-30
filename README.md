#VUE2.x&&VUE3.x解读
这是一个对vue2.x及vue3.x源码非常详细的学习项目  

学习源码就是想*提升*自己，也可以小伙伴一起*交流*心得   

将详细注释每行源码代码及所有重要及不重要的内容，也会整理工程化的逻辑，项目运行的机制等等  

不定期回顾已经写过的内容，进行补充或修改  

以下将从N（我也不知道有多少个）个方面用*大白话*去全面解读。（希望自己每天都会有更新）  

##文件结构介绍  
vue的项目结构大体如下：  
* __dist__  
    ex：构建后文件存放的目录。构建时通过rollup进行打包的，构建的配置及防呆代码在script中
* __flow__  
    ex：js是弱类型，这里用flow进行了变量声明，flow和typescript差不多
* __node_modules__  
    ex:项目依赖
* __script__  
    ex：包含与构建相关的脚本和配置文件。代码写完以后，要进行打包吧？从哪里进入，打包到哪里，打包的时候做什么判断等等配置
    - alias.js
      ex：修改别名。这个文件就是尤大佬将常用的文件入口取一个自己喜欢的名字，以后找这个文件地址，就用别名就行
    - build.js  
      ex：打包的逻辑代码。包含知道用户输了什么命令，打包成什么环境，要不要压缩，提示语报错信息等等的内容
    - config.js  
      ex：打包的配置信息就在这儿。尤大佬用了rollup进行打包的，配置可以在command中写，不过应该没人会这么做，那么多那么长，谁看得清啊。也可以用一个写好的配置文件，命令去读比如（rollup --c ./build/rollup.config.js）。这里用的rolluo.rollup()方法去调用配置信息的，毕竟配置信息是不能固定死的，需要根据不同场景变化的。
    - feature-tag.js  
      ex：功能开关。
* __src__  
    - compiler
    - core  
    - platforms  
    - shared  
* __.babelrc.js__  
      ex：babale的配置信息
* __.eslintrc.js__  
      ex：eslint的配置信息
* __.flowconfig__  
      ex：flow的配置信息
* __.gitignore__  
     ex：git忽略内容
* __package.json__  
     ex：独立发布的包的目录
