import CryptoJS from 'crypto-js';

// 固定长度（需要和服务端保持一致）
const VERSION = '001';
const APP_ID_LENGTH = 24; // 一般 AppId 是 32 位
const VERSION_LENGTH = VERSION.length;

export enum Privileges {
  PrivPublishStream = 0,
  privPublishAudioStream = 1,
  privPublishVideoStream = 2,
  privPublishDataStream = 3,
  PrivSubscribeStream = 4,
}

export class AccessToken {
  appId: string;
  appKey: string;
  roomId: string;
  userId: string;
  issuedAt: number;
  nonce: number;
  expireAt: number = 0;
  privileges: Map<number, number> = new Map();
  signature: string = '';

  constructor(appId: string, appKey: string, roomId: string, userId: string) {
    this.appId = appId;
    this.appKey = appKey;
    this.roomId = roomId;
    this.userId = userId;
    this.issuedAt = Math.floor(Date.now() / 1000);
    this.nonce = Math.floor(Math.random() * 1e9);
  }

  static Version() {
    return VERSION;
  }

  addPrivilege(privilege: Privileges, expireTimestamp: number = 0) {
    this.privileges.set(privilege, expireTimestamp);

    if (privilege === Privileges.PrivPublishStream) {
      this.privileges.set(Privileges.privPublishAudioStream, expireTimestamp);
      this.privileges.set(Privileges.privPublishVideoStream, expireTimestamp);
      this.privileges.set(Privileges.privPublishDataStream, expireTimestamp);
    }
  }

  expireTime(expireAt: number) {
    this.expireAt = expireAt;
  }

  private packMsg(): string {
    const msg = {
      nonce: this.nonce,
      issuedAt: this.issuedAt,
      expireAt: this.expireAt,
      roomID: this.roomId,
      userID: this.userId,
      privileges: Object.fromEntries(this.privileges),
    };
    return JSON.stringify(msg);
  }

  private hmacSign(msg: string): string {
    const hash = CryptoJS.HmacSHA256(msg, this.appKey);
    return CryptoJS.enc.Base64.stringify(hash);
  }

  serialize(): string {
    const msg = this.packMsg();
    this.signature = this.hmacSign(msg);

    // 模拟 Pack: msg + signature -> JSON -> base64
    const content = CryptoJS.enc.Base64.stringify(
      CryptoJS.enc.Utf8.parse(
        JSON.stringify({ msg, signature: this.signature }),
      ),
    );

    return AccessToken.Version() + this.appId + content;
  }

  static parse(raw: string): AccessToken {
    if (raw.substring(0, VERSION_LENGTH) !== VERSION) {
      throw new Error('Invalid version');
    }

    const appId = raw.substring(VERSION_LENGTH, VERSION_LENGTH + APP_ID_LENGTH);
    const contentEncoded = raw.substring(VERSION_LENGTH + APP_ID_LENGTH);

    const decoded = CryptoJS.enc.Base64.parse(contentEncoded).toString(
      CryptoJS.enc.Utf8,
    );
    const obj = JSON.parse(decoded);

    const msg = JSON.parse(obj.msg);
    const token = new AccessToken(appId, '', msg.roomID, msg.userID);
    token.nonce = msg.nonce;
    token.issuedAt = msg.issuedAt;
    token.expireAt = msg.expireAt;
    token.privileges = new Map(
      Object.entries(msg.privileges).map(([k, v]) => [Number(k), v as number]),
    );
    token.signature = obj.signature;

    return token;
  }

  verify(appKey: string): boolean {
    if (this.expireAt > 0 && Math.floor(Date.now() / 1000) > this.expireAt) {
      return false;
    }
    const checkSig = CryptoJS.HmacSHA256(this.packMsg(), appKey);
    const checkSigBase64 = CryptoJS.enc.Base64.stringify(checkSig);
    return checkSigBase64 === this.signature;
  }
}

// ========== 使用示例 ==========
export function tokenWithAppID(
  appId: string,
  appKey: string,
  roomId: string,
  userId: string,
): string {
  const token = new AccessToken(appId, appKey, roomId, userId);
  const now = Math.floor(Date.now() / 1000);

  token.addPrivilege(Privileges.PrivSubscribeStream, now);
  token.addPrivilege(Privileges.PrivPublishStream, now + 3600);
  token.expireTime(now + 3600 * 2);

  const s = token.serialize();
  console.log('token:', s);

  const t = AccessToken.parse(s);
  console.log('appID:', t.appId);
  console.log('roomID:', t.roomId);
  console.log('userID:', t.userId);
  console.log('issuedAt:', t.issuedAt);
  console.log('expireAt:', t.expireAt);
  console.log('nonce:', t.nonce);
  console.log('data:', t.privileges.get(Privileges.PrivSubscribeStream));
  console.log('signature:', t.signature);
  console.log('verify:', t.verify(appKey));

  return s;
}
