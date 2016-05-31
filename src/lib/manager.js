import _ from 'lodash';
import Bluebird from 'bluebird';

import OS from 'os';

import Logger from './logger';

export default class Manager {
    constructor(props) {
        this.channels = {};
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }
        
        if (!this.levels) { this.levels = [] }
        if (!this.outputTemplates) { this.outputTemplates = [] }
        if (!this.loggers) { this.loggers = [] }
        if (!this.defaultLogger) { throw new Error('Default logger required') }
        
        let { defaultLogger, loggers, outputTemplates } = this;
        
        // Normalize the output templates.
        for (let logger of loggers) {
            for (let output of logger.outputs) {
                if (output.templateName) {
                    let outputTemplate = _.find(outputTemplates, ot => ot.name === output.templateName);
                    if (!outputTemplate) {
                        throw new Error(`Output template ${output.templateName} not defined`);
                    }
                    
                    _.defaults(output, _.omit(outputTemplate, 'name'));
                }
            }
        }
        for (let output of defaultLogger.outputs) {
            if (output.templateName) {
                let outputTemplate = _.find(outputTemplates, ot => ot.name === output.templateName);
                if (!outputTemplate) {
                    throw new Error(`Output template ${output.templateName} not defined`);
                }
                
                _.defaults(output, _.omit(outputTemplate, 'name'));
            }
        }
    }
    
    registerChannel(name, channel, options) {
        let { channels, loggers } = this;
        
        if (channels[name]) {
            throw new Error(`Channel ${name} already registered`);
        }
        
        channels[name] = {
            type: channel,
            options: options
        };
        
        return this;
    }
    
    createLogger(name) {
        let { loggers, defaultLogger } = this;
        
        let logger = _.find(loggers, l => l.name === name);
        if (!logger) {
            logger = defaultLogger;
        }
        
        return new Logger(this, logger);
    }
}