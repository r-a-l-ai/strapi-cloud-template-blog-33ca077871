'use strict';

/**
 * thread controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::thread.thread', ({ strapi }) => ({
  async delete(ctx) {
    const { id } = ctx.params;
    
    try {
      // Get the thread to be deleted
      const thread = await strapi.entityService.findOne('api::thread.thread', id);

      if (!thread) {
        return ctx.notFound();
      }

      // Delete the thread and let Strapi handle cascading deletes
      const response = await strapi.entityService.delete('api::thread.thread', id);

      // Return success response
      return ctx.send({
        data: response
      });
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}));
