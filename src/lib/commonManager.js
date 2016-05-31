import Bluebird from 'bluebird';
import Yaml from 'js-yaml';

import FS from 'fs-extra';

import Manager from './manager';

export default class CommonManager {
    static manager;
    
    static initialize(config, channels) {
        let manager = CommonManager.manager = new Manager(config);
        
        for (let channel in channels) {
            manager.registerChannel(channel, channels[channel]);
        }
        
        return manager;
    }
    
    constructor(name) {
        return CommonManager.manager.createLogger(name);
    }
}