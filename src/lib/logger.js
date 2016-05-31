import _ from 'lodash';
import Bluebird from 'bluebird';

import OS from 'os';

export default class Logger {
    get channels() { return this.manager.channels }
    get levels() { return this.manager.levels }
    get outputTemplates() { return this.manager.outputTemplates }
    get defaultLogger() { return this.manager.defaultLogger }
    get loggers() { return this.manager.loggers }
    get managerMetadata() { return this.manager.metadata }
    
    constructor(manager, props) {
        this.manager = manager;
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }
        
        if (!this.outputs) { this.outputs = [] }
        
        let { outputs, levels, outputTemplates, channels } = this;
        
        for (let level of levels) {
            this[level.name] = (...args) => this.log(level.name, ...args);
            
            for (let alias of level.aliases || []) {
                this[alias] = this[level.name];
            }
        }
        
        this.registeredChannels = {};
        for (let output of outputs) {
            if (!channels[output.channel]) {
                throw new Error(`Channel ${output.channel} not defined`);
            }
            
            this.registeredChannels[output.channel] = new channels[output.channel].type(this, _.defaults(_.omit(output, 'channel', 'level'), channels[output.channel].options || {}));
            this.registeredChannels[output.channel].on('error', (err) => this.emit('error', err));
        }
    }
    
    createSubLogger(name) {
        let { manager, loggers, defaultLogger } = this;
        
        let logger = _.find(loggers, l => l.name === name);
        if (!logger) {
            logger = defaultLogger;
        }
        
        return new Logger(manager, logger);
    }
    
    log(level, message, ...args) {
        let metadata, cb;
        if (!_.isFunction(args[0])) { metadata = args.shift() }
        if (_.isFunction(args[0])) { cb = args.shift() }
        
        if (cb) {
            this.logAsync(level, message, metadata).asCallback(cb);
        }
        else {
            this.logAsync(level, message, metadata);
        }
        
        return this;
    }
    async logAsync(level, message, metadata) {
        let { levels, channels, outputs } = this;
        
        let record = this.createRecord(level, message, metadata);
        
        let levelIdx = _.findIndex(levels, l => l.name === level || _.includes(l.aliases, level));
        
        let channelPromises = [];
        for (let output of outputs) {
            let outputLevelIdx = _.findIndex(levels, l => l.name === output.level || _.includes(l.aliases, output.level));
            
            if (levelIdx <= outputLevelIdx) {
                if (this.registeredChannels[output.channel]) {
                    channelPromises.push(this.registeredChannels[output.channel].logAsync(record));
                }
                else {
                    channelPromises.push(Bluebird.reject(new Error(`Channel ${output.channel} not defined.`)));
                }
            }
        }
        
        await Bluebird.all(channelPromises);
        
        return this;
    }
    
    createRecord(level, message, metadata) {
        let { name, levels, metadata: loggerMetadata, managerMetadata } = this;
        
        let hostname = OS.hostname();
        
        let matchedLevel = _.find(levels, l => l.name === level || _.includes(l.aliases, level));
        if (matchedLevel) {
            level = matchedLevel.name;
        }
        
        return _.defaults({
            message: message,
            level: level,
            hostname: hostname,
            logger: name || 'default'
        }, metadata, loggerMetadata, managerMetadata);
    }
}