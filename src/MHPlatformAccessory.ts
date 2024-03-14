/**
 * ./src/MHPlatformAccessory.ts
 * @author Will Kapcio
 */

import {
  Service,
  PlatformAccessory,
  CharacteristicValue,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  Logger,
} from 'homebridge';

import { MagicHomePlatform } from './MagicHomePlatform';
import { ACCESSORY_NAME, MANUFACTURER } from './settings';
import { version as VERSION } from '../package.json';
import { MHControl } from './MHControl';
import { Device } from './MagicHomePlatform';
import './extensions';
import { convertToColor, convertToPercent, onOff } from './extensions';

export class MHPlatformAccessory {
  private service: Service | undefined;
  private MHOnControl: MHControl;
  private MHBrightnessControl: MHControl;

  constructor(
    private readonly log: Logger,
    private readonly platform: MagicHomePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
  ) {
    const configuration = {
      host: this.device.ip,
      port: this.device.port,
      connect_timeout: this.platform.config.connect_timeout,
      response_timeout: this.platform.config.response_timeout,
      command_timeout: this.platform.config.command_timeout,
    };

    this.MHOnControl = new MHControl(this.log, configuration);
    this.MHBrightnessControl = new MHControl(this.log, configuration);

    this.setAccessoryInformation();
    this.setService();
  }

  private setAccessoryInformation() {
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, ACCESSORY_NAME)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.ip)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, VERSION)
      .setCharacteristic(this.platform.Characteristic.Identify, true);
  }

  private setService() {
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    if (this.device.dimmable) {
      this.service
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
    }
  }

  private getPowerState(callback: CharacteristicGetCallback) {
    this.MHOnControl.queryState()
      .then((state) => {
        const isOn = onOff(state.on);
        this.log.debug(`[${this.device.name}] Power: "${isOn}"`);
        callback(null, state.on);
      })
      .catch((error) => {
        this.log.error(`[${this.device.name}] Error getting power state:`, error);
        callback(error);
      });
  }

  private setPowerState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.MHOnControl.setPower(value as boolean)
      .then(() => {
        const powerState = onOff(value as boolean);
        this.log.info(`[${this.device.name}] Power Set: "${powerState}"`);
        callback(null);
      })
      .catch((error) => {
        this.log.error(`[${this.device.name}] Error setting power state:`, error);
        callback(error);
      });
  }

  private getBrightness(callback: CharacteristicGetCallback) {
    this.MHBrightnessControl.queryState()
      .then((state) => {
        const brightness = convertToPercent(state.brightness, 255);
        this.log.debug(`[${this.device.name}] Brightness: "${brightness}%"`);
        callback(null, brightness);
      })
      .catch((error) => {
        this.log.error(`[${this.device.name}] Error getting brightness:`, error);
        callback(error);
      });
  }

  private setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const brightnessValue = convertToColor(value as number, 255);
    this.MHBrightnessControl.sendBrightnessCommand(brightnessValue)
      .then(() => {
        this.log.info(`[${this.device.name}] Brightness Set: "${value}%"`);
        callback(null);
      })
      .catch((error) => {
        this.log.error(`[${this.device.name}] Error setting brightness:`, error);
        callback(error);
      });
  }
}
