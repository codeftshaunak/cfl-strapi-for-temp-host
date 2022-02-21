"use strict";

/**
 * queue.js controller
 *
 * @description: A set of functions called "actions" of the `queue` plugin.
 */

module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */

  getJobs: async (ctx) => {
    const jobLog = await strapi.plugins.queue.services[
      ctx.params.queue
    ].getJobs();
    ctx.send(jobLog);
  },
};
