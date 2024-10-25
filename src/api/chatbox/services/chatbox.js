'use strict';

/**
 * chatbox service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::chatbox.chatbox');
