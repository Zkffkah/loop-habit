module.exports = {

  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg')

    svgRule.uses.clear()

    svgRule
      .use('vue-loader')
      .loader('vue-loader') // or `vue-loader-v16` if you are using a preview support of Vue 3 in Vue CLI
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
  },

  configureWebpack: {
    devtool: 'source-map'
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        mac: {
          hardenedRuntime: true,
          entitlements: './build/entitlements.mac.inherit.plist',
          extendInfo: {
            'LSUIElement': 1
          }

        },
        linux: {
          target: ['AppImage']
        },
        publish: ['github'],
        appId: 'design.lost.loophabit',
        afterSign: './afterSignHook.js'
      }
    }
  }
}