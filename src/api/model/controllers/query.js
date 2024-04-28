// src/api/models/controllers/query.js
module.exports = {
    async forwardToAutoGen(ctx) {
      try {
        const response = ctx.state.autogenResponse;
        ctx.body = response;
      } catch (error) {
        ctx.body = error;
        ctx.status = 500;
      }
    },
  };
  