'use strict';

/**
 * job-configuration service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::job-configuration.job-configuration');
