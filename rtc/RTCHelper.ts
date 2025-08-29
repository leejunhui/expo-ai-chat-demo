import type {
  IEngine,
  IRoom,
  RTCVideoEventHandler,
  RTCRoomEventHandler,
  IJoinRoomProps,
  ICreateRTCEngineOptions,
  StreamIndex,
  IVideoCanvas,
} from '@volcengine/react-native-rtc';
import { RTCManager } from '@volcengine/react-native-rtc';
import { tokenWithAppID } from './RTCTokenHelper';

class RTCClient {
  manager?: RTCManager;
  engine?: IEngine | null;
  room?: IRoom | null;

  constructor() {
    this.manager = new RTCManager();
  }

  /** 引擎相关 */
  async createEngine({ appID }: ICreateRTCEngineOptions) {
    this.engine = await this.manager!.createRTCEngine({ appID });
  }
  setRTCVideoEventHandler(handlers: RTCVideoEventHandler) {
    this.engine?.setRtcVideoEventHandler(handlers);
  }
  setRTCRoomEventHandler(handlers: RTCRoomEventHandler) {
    this.room?.setRTCRoomEventHandler(handlers);
  }
  startAudioCapture() {
    return this.engine?.startAudioCapture();
  }
  startVideoCapture() {
    return this.engine?.startVideoCapture();
  }
  setLocalVideoCanvas(streamIndex: StreamIndex, canvas: IVideoCanvas) {
    return streamIndex < 0
      ? 0
      : this.engine?.setLocalVideoCanvas(streamIndex, canvas);
  }
  destroyEngine() {
    this.leaveRoom();
    this.room?.destroy();
    this.room = null;
    this.manager!.destroyRTCEngine();
    this.engine = null;
  }

  /** 房间相关 */
  joinRoom(params: IJoinRoomProps) {
    const token = tokenWithAppID(
      '',
      '',
      '123456',
      '123456',
    );

    return this.room?.joinRoom({
      token,
      ...params,
    });
  }
  leaveRoom() {
    this.room?.leaveRoom();
  }
  createRoom(roomId: string) {
    this.room = this.engine?.createRTCRoom(roomId);
    return this.room;
  }
}

export const rctClient = new RTCClient();
