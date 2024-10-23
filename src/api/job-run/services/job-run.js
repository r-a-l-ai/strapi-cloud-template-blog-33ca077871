'use strict';

/**
 * job-run service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::job-run.job-run');
