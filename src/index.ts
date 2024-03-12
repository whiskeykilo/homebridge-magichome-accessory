/**
 * ./src/index.ts
 * @author Will Kapcio
 */

import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { MagicHomePlatform } from './MagicHomePlatform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, MagicHomePlatform);
};
