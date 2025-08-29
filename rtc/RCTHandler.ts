import type {
  RTCVideoEventHandler,
  RTCRoomEventHandler,
  UserInfo,
  MediaStreamType,
} from '@volcengine/react-native-rtc';

function convertObjectForPrinting(obj: Record<string, string>) {
  if (typeof obj !== 'object') {
    return obj;
  }
  const result: Record<string, string> = {};
  const properties = Object.getOwnPropertyNames(obj);
  properties.forEach((prop) => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
    if (descriptor && typeof descriptor.get === 'function') {
      try {
        result[prop] = descriptor.get.call(obj);
      } catch (error) {}
    } else if (typeof obj[prop] !== 'function') {
      result[prop] = obj[prop];
    }
  });
  return result;
}

const logger = (fnName: string, executer?: any) => {
  /** 获取函数名称 */
  const f = (...args: unknown[]) => {
    console.log(
      `------ ${fnName} : ${args
        .map((arg) =>
          typeof arg === 'object'
            ? JSON.stringify(
                Array.isArray(arg)
                  ? [...arg].map(convertObjectForPrinting)
                  : convertObjectForPrinting(arg as any),
              )
            : arg,
        )
        .join(' | ')}`,
    );
    executer?.(...args);
  };
  f.name = fnName;
  return f;
};

const useRTCVideoListeners = (): RTCVideoEventHandler => {
  // ...some hooks
  return {
    onUserStartAudioCapture: logger('onUserStartAudioCapture'),
    onUserStopAudioCapture: logger('onUserStopAudioCapture'),
    onUserStartVideoCapture: logger('onUserStartVideoCapture'),
  };
};

const useRTCRoomListeners = (): RTCRoomEventHandler => {
  // ...some hooks
  const apis = {
    onUserJoined: logger('onUserJoined', (userInfo: UserInfo) => {
      // ...
    }),
    onUserPublishStream: logger(
      'onUserPublishStream',
      (uid: string, type: MediaStreamType) => {
        // ...
      },
    ),
  };
  return apis;
};

export { useRTCVideoListeners, useRTCRoomListeners };
