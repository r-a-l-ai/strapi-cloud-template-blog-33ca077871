'use strict';

module.exports = {
  async beforeDelete(event) {
    const { params: { where } } = event;
    
    // Find all threads associated with this client
    const threads = await strapi.entityService.findMany('api::thread.thread', {
      filters: {
        client: where.id
      }
    });

    // Delete all associated threads (which will trigger thread's beforeDelete)
    if (threads && threads.length > 0) {
      for (const thread of threads) {
        await strapi.entityService.delete('api::thread.thread', thread.id);
      }
    }
  }
}; 