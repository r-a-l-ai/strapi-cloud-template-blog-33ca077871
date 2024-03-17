'use strict';

/**
 * bot-user service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::bot-user.bot-user');
