/**
 * 日志工具
 */

const config = require('../config');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = config.NODE_ENV === 'production' ? 'info' : 'debug';
  }

  formatMessage(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };
  }

  log(level, message, meta = {}) {
    if (this.levels[level] <= this.levels[this.currentLevel]) {
      const logData = this.formatMessage(level, message, meta);
      console.log(JSON.stringify(logData));
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

const logger = new Logger();
module.exports = logger;