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

/**
 * This is the accessory class that is used to create the accessory in homebridge.
 */
export class MHPlatformAccessory {
  private service: Service;
  private MHOnControl: MHControl;
  private MHBrightnessControl: MHControl;
  private log: Logger;

  /**
   * @param platform The platform that this accessory belongs to.
   * @param accessory The accessory that this class is wrapping.
   * @param device The device configuration for this accessory.
   */
  constructor(
    log: Logger,
    private readonly platform: MagicHomePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: Device,
  ) {
    // set accessory configuration
    const configuration = {
      host: this.device.ip,
      port: this.device.port,
      connect_timeout: this.platform.config.connect_timeout,
      response_timeout: this.platform.config.response_timeout,
      command_timeout: this.platform.config.command_timeout,
    };

    // set controllers for power and brightness
    this.log = log;
    this.MHOnControl = new MHControl(this.log, configuration);
    this.MHBrightnessControl = new MHControl(this.log, configuration);

    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
      .setCharacteristic(this.platform.Characteristic.Model, ACCESSORY_NAME)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.ip)
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, VERSION)
      .setCharacteristic(this.platform.Characteristic.Identify, true);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.device.name);

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .on('get', this.getPowerState.bind(this))
      .on('set', this.setPowerState.bind(this));

    // register handlers for the Brightness Characteristic if the device is dimmable
    if (this.device.dimmable) {
      this.service
        .getCharacteristic(this.platform.Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
    }
  }

  /**
   * **Get Power State**
   *
   * This method gets the power state of the lightbulb.
   *
   * @param  {CharacteristicGetCallback} callback
   */
  getPowerState(callback: CharacteristicGetCallback) {
    this.MHOnControl.queryState()
      .then((state) => {
        // Use the onOff utility function with the state.on boolean value
        const isOn = onOff(state.on);
        this.platform.log.debug(`[${this.device.name}] Power: "${isOn}"`);
        callback(null, state.on);
      })
      .catch((error) => {
        this.platform.log.error(`[${this.device.name}] Error getting power state:`, error);
        callback(error);
      });
  }


  /**
   * **Set Power State**
   *
   * This method sets the power state of the lightbulb.
   *
   * @param  {CharacteristicValue} value
   * @param  {CharacteristicSetCallback} callback
   */
  setPowerState(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.MHOnControl.setPower(value as boolean)
      .then(() => {
        // Use the onOff utility function instead of the method on the boolean
        const powerState = onOff(value as boolean);
        this.platform.log.info(`[${this.device.name}] Power Set: "${powerState}"`);
        callback(null);
      })
      .catch((error) => {
        this.platform.log.error(`[${this.device.name}] Error setting power state:`, error);
        callback(error);
      });
  }


  /**
   * **Get Brightness**
   *
   * This method gets the brightness of the lightbulb.
   *
   * @param  {CharacteristicGetCallback} callback
   */
  getBrightness(callback: CharacteristicGetCallback) {
    this.MHBrightnessControl.queryState()
      .then((state) => {
        // Use the convertToPercent utility function with the state.brightness value
        const brightness = convertToPercent(state.brightness, 255);
        this.platform.log.debug(`[${this.device.name}] Brightness: "${brightness}%"`);
        callback(null, brightness);
      })
      .catch((error) => {
        this.platform.log.error(`[${this.device.name}] Error getting brightness:`, error);
        callback(error);
      });
  }


  /**
   * **Set Brightness**
   *
   * This method sets the brightness of the lightbulb.
   *
   * @param  {CharacteristicValue} value
   * @param  {CharacteristicSetCallback} callback
   */
  setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    // Use the convertToColor utility function with the value
    const brightnessValue = convertToColor(value as number, 255);
    this.MHBrightnessControl.sendBrightnessCommand(brightnessValue)
      .then(() => {
        this.platform.log.info(`[${this.device.name}] Brightness Set: "${value}%"`);
        callback(null);
      })
      .catch((error) => {
        this.platform.log.error(`[${this.device.name}] Error setting brightness:`, error);
        callback(error);
      });
  }

}