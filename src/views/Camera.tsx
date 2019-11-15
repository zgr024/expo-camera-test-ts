import React, { Component, ReactText } from 'react'
import { View, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native'
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import * as Permissions from 'expo-permissions'
import { Camera } from "expo-camera"
import * as FileSystem from 'expo-file-system'
import * as AWS from 'aws-sdk'

const photoTimeout = 2000
let debug = false

const s3Bucket = "AWS_S3_BUCKET_NAME"

AWS.config.update({
  accessKeyId: "AWS_ACCESS_KEY",
  secretAccessKey: "AWS_SECRET_ACCESS_KEY",
  region: "AWS_REGION"
})

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: s3Bucket }
})

interface CameraState {
  type: any,
  flash: ReactText,
  ratio: string,
  zoom: number,
  result: string | null,
  hasCameraRollPermission: boolean,
  hasCameraPermission: boolean,
  saveInProgress: boolean,
  photo: string | null
}

const flashIcons = {
  off: 'flash-auto',
  on: 'flash-off',
  auto: 'flash-on'
}

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'off'
}

export default class CameraView extends Component<{},CameraState> {

  camera = null

  state: Readonly<CameraState> = {
    type: Camera.Constants.Type.back,
    flash: 'auto',
    ratio: '16:9',
    zoom: 0,
    result: null,
    hasCameraRollPermission: false,
    hasCameraPermission: false,
    saveInProgress: false,
    photo: null
  }

  constructor(props: {}) {
    super(props)
  }

  componentWillMount() {

  }

  async componentDidMount() {
    try {
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}photos`,
        {
          intermediates: true,
        }
      )
    } catch (e) {
      console.log(e)
    }

    await this.getCameraPermission()
    await this.getCameraRollPermission()
  }

  async getCameraPermission() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)
    this.setState({ hasCameraPermission: status === 'granted' })
  }

  async getCameraRollPermission() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
    this.setState({ hasCameraRollPermission: status === 'granted' })
  }

  toggleFlash = () => {
    this.setState({ flash: flashModeOrder[this.state.flash as any] })
  }

  snapPhoto = async () => {
    debug && console.log('Button Pressed')
    if (this.camera) {
      debug && console.log('Taking photo')

      const options = { quality: 1, fixOrientation: true }
      await this.camera.takePictureAsync(options).then(async photo => {

        const Bucket = s3Bucket
        const Key = `TESTING_${Date.now()}`
        const ContentType = `image/jpeg`
        const newUri = `${FileSystem.documentDirectory}photos/${Key}.jpg`
        this.setState({ photo: photo.uri })

        await FileSystem.moveAsync({
          from: photo.uri,
          to: newUri,
        })
        this.setState({ photo: newUri })
        const fetchResponse = await fetch(newUri)
        const Body = await fetchResponse.blob()
        const params = { Bucket, Key, Body, ContentType }

        // Show photo
        setTimeout(() => {
          this.setState({ photo: null })
        }, photoTimeout)

        s3.upload(params, (err, file) => {
          debug && console.log('file:', file)
          if (err) {
            console.log(err)
          }
        })

      })
    }
  }

  renderCamera() {
    const { type, flash, ratio, zoom } = this.state

    return (
      <View style={{ flex: 1}}>
        <Camera
          ref={ (ref) => {this.camera = ref} }
          style={{ flex: 1 }}
          flashMode={flash}
          type={type}
          ratio={ratio}
          zoom={zoom}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent', flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: 'transparent', flexDirection: 'column'}}>
              <View style={{ flexDirection: 'row', alignContent: 'space-between' }}>
                <TouchableOpacity style={{ flex: 1, marginTop: 35, paddingLeft: 30}} onPress={ this.toggleFlash }>
                  <MaterialIcons name={ flashIcons[flash] } color="white" size={ 40 } />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => this.snapPhoto() } style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 30, alignSelf: 'center' }}>
                <Ionicons name="ios-radio-button-on" size={70} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    )
  }

  render() {
    const { hasCameraPermission, hasCameraRollPermission, photo } = this.state

    switch(true) {
      case hasCameraPermission === null || hasCameraRollPermission === null:
        return  <Text>Requesting camera permission</Text>
      case hasCameraPermission === false || hasCameraRollPermission === false:
        return <Text>The app needs access to the camera and the camera roll</Text>
      case !!photo:
        return (
          <View style={{ flex: 1, backgroundColor: '#363834' }}>
            <Image source={{ uri: photo }} style={{ flex: 1}} />
          </View>
        )
      default:
        return this.renderCamera()
    }
  }
}