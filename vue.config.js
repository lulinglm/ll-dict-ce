const CopyWebpackPlugin = require("copy-webpack-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const path = require("path");

// Generate pages object
const pagesObj = {};
const chromeName = ["popup", "options", "dictAdmin", "background"];

chromeName.forEach(name => {
  pagesObj[name] = {
    entry: `src/chrome/${name}/index.js`,
    template: "public/index.html",
    filename: `${name}.html`
  };
});

// 生成manifest文件
const manifest =
  process.env.NODE_ENV === "production"
    ? {
      from: path.resolve("public/manifest.production.json"),
      to: `${path.resolve("dist")}/manifest.json`
    }
    : {
      from: path.resolve("public/manifest.development.json"),
      to: `${path.resolve("dist")}/manifest.json`
    };

const plugins = [new CopyWebpackPlugin([manifest])];
// 图片文件
plugins.push(
  new CopyWebpackPlugin([
    {
      from: path.resolve("public/img"),
      to: path.resolve("dist")
    }
  ])
);

// 开发环境将热加载文件复制到dist文件夹
// if (process.env.NODE_ENV !== 'production') {
//     plugins.push(
//         new CopyWebpackPlugin([
//             {
//                 from: path.resolve('src/utils/hot-reload.js'),
//                 to: path.resolve('dist')
//             }
//         ])
//     )
// }

// 生产环境打包dist为zip
if (process.env.NODE_ENV === "production") {
  plugins.push(
    new ZipPlugin({
      path: path.resolve("dist"),
      filename: "dist.zip"
    })
  );
}

module.exports = {
  pages: pagesObj,
  // // 生产环境是否生成 sourceMap 文件
  productionSourceMap: false,

  configureWebpack: {
    entry: {
      content: "./src/chrome/content/index.js"
    },
    output: {
      filename: "js/[name].js"
    },
    resolve: {
      alias: {
        '@': path.resolve('src'),
        'config': path.resolve('config'),
        'chrome': path.resolve('src/chrome')
      }
    },
    plugins: plugins,
  },
  css: {
    extract: {
      filename: "css/[name].css"
      // chunkFilename: 'css/[name].css'
    }
  },

  chainWebpack: config => {
    // 处理字体文件名，去除hash值
    const fontsRule = config.module.rule("fonts");

    // 清除已有的所有 loader。
    // 如果你不这样做，接下来的 loader 会附加在该规则现有的 loader 之后。
    fontsRule.uses.clear();
    fontsRule
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use("url")
      .loader("url-loader")
      .options({
        limit: 1000,
        name: "fonts/[name].[ext]"
      });

    // 查看打包组件大小情况
    if (process.env.npm_config_report) {
      config
        .plugin("webpack-bundle-analyzer")
        .use(require("webpack-bundle-analyzer").BundleAnalyzerPlugin);
    }
  }
};
