import React, { useEffect, useState } from 'react';
import { Platform, KeyboardAvoidingView } from 'react-native';
import {
  ChannelProfile,
  NativeViewComponent,
  StreamIndex,
  RenderMode,
} from '@volcengine/react-native-rtc';
import { request, PERMISSIONS } from 'react-native-permissions';
import { useRTCRoomListeners, useRTCVideoListeners } from './rtc/RCTHandler';
import { rctClient } from './rtc/RTCHelper';
// import {
//   useRTCRoomListeners,
//   useRTCVideoListeners,
// } from '../rtc/RCTHandler';
// import { rctClient } from '../rtc/RTCHelper';

const viewId = 'my-view';

const ExamplePage = () => {
  const [isViewLoaded, setViewLoaded] = useState<boolean>(false);
  console.log('🚀 ~ ExamplePage ~ isViewLoaded:', isViewLoaded);
  const engineEventListeners = useRTCVideoListeners();
  const roomEventListeners = useRTCRoomListeners();

  const requestDevicePermission = async () => {
    if (Platform.OS === 'ios') {
      await request(PERMISSIONS.IOS.CAMERA);
      await request(PERMISSIONS.IOS.MICROPHONE);
    } else {
      await request(PERMISSIONS.ANDROID.CAMERA);
      await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
    }
  };

  const handleViewLoad = () => {
    setViewLoaded(true);
  };

  const initialize = async () => {
    /** 获取权限 */
    await requestDevicePermission();

    /** 初始化引擎 */
    await rctClient.createEngine({
      appID: '68afed4e18ee8d017b08325f',
    });

    /** 设置相关回调函数 */
    rctClient.setRTCVideoEventHandler(engineEventListeners);

    /** 设置本地渲染视图 */
    rctClient.setLocalVideoCanvas(StreamIndex.STREAM_INDEX_MAIN, {
      viewId,
      renderMode: RenderMode.ByteRTCRenderModeFill,
    });
    /** 创建房间实例 */
    rctClient.createRoom('123456');
    /** 设置相关回调函数 */
    rctClient.setRTCRoomEventHandler(roomEventListeners);

    /** 加入房间 */
    rctClient.joinRoom({
      userId: '123456',
      roomConfigs: {
        profile: ChannelProfile.CHANNEL_PROFILE_COMMUNICATION,
        isAutoPublish: true,
        isAutoSubscribeAudio: true,
        isAutoSubscribeVideo: true,
      },
    });

    /** 采集本地流 */
    rctClient.startVideoCapture();
    rctClient.startAudioCapture();
  };

  useEffect(() => {
    if (isViewLoaded) {
      try {
        initialize();
      } catch {}
    }
  }, [isViewLoaded]);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <NativeViewComponent
          viewId={viewId}
          onLoad={handleViewLoad}
          kind={
            Platform.select({
              android: 'TextureView',
              ios: 'UIView',
            })!
          }
        />
      </KeyboardAvoidingView>
    </>
  );
};

export default ExamplePage;
