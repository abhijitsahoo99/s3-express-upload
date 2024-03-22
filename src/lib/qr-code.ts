import qrcode from 'qrcode-terminal';
import { config } from './config';

export function generateQRCode() {
  const appConfig = {
    token: config.token,
    serverUrl: config.serverUrl,
  };
  qrcode.generate(JSON.stringify(appConfig), { small: true });
}