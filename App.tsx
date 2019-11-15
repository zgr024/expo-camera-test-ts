import React from "react"
import { Image, View } from 'react-native'
import { AppLoading, SplashScreen, Font } from 'expo'
import { Asset } from 'expo-asset'

import MainView from "./src/views/MainView";

interface AppState {
  isSplashReady: boolean,
  isAppReady: boolean,
  user: any,
  debug: boolean
}

export default class App extends React.Component<{}, AppState> {

  state: Readonly<AppState> = {
    isSplashReady: false,
    isAppReady: false,
    user: {},
    debug: false
  }

  constructor(props: {}) {
    super(props)
  }

  render() {
    const { isAppReady, isSplashReady, user, debug } = this.state
    if (!isSplashReady) {
      return (
        <AppLoading
          startAsync={this._cacheSplashResourcesAsync}
          onFinish={() => this.setState({ isSplashReady: true })}
          onError={console.warn}
          autoHideSplash={false}
        />
      )
    }

    if (!isAppReady) {
      return (
        <View style={{ flex: 1, backgroundColor: '#2b333b' }}>
          <Image
            source={require('./assets/splash.png')}
            onLoad={this._cacheResourcesAsync}
          />
        </View>
      )
    }


    return (
      <View style={{ flex: 1 }}>
        <MainView />
      </View>
    )

  }

  _cacheSplashResourcesAsync = async () => {
    const png = require('./assets/splash.png')
    return Asset.fromModule(png).downloadAsync()
  }

  _cacheResourcesAsync = async () => {
    SplashScreen.hide()
    const images = [
      require('./assets/logo.png')
    ]

    const cacheImages = images.map((image) => {
      return Asset.fromModule(image).downloadAsync()
    })

    await Promise.all(cacheImages)
    this.setState({ isAppReady: true })
  }
}