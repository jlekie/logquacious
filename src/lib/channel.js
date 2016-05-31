import _ from 'lodash';

import { EventEmitter } from 'events';

export default class Channel {
    constructor(logger, props) {
        this.logger = logger;
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }
    }
}
_.defaults(Channel.prototype, _.omit(EventEmitter.prototype, 'domain', '_events', '_maxListeners'));