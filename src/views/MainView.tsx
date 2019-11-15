import React from 'react';
import { View } from 'react-native'


import CameraView from "./Camera"

interface MainProps {

}

interface MainState {
  view: String
}

export default class MainView extends React.Component<MainProps, MainState> {

  constructor(props) {
    super(props)
    this.state = {
      view: 'camera'
    }
  }

  render() {

    return (
      <View style={{ flex: 1 }}>
        { this.state.view === 'camera' && <CameraView /> }
      </View>
    )

  }


}