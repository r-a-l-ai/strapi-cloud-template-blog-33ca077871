// src/api/models/controllers/query.js
module.exports = {
    async forwardToMindsDB(ctx) {
      try {
        // Assuming your middleware modifies ctx.state.mindsdbResponse
        const response = ctx.state.mindsdbResponse;
        ctx.body = response;
      } catch (error) {
        ctx.body = error;
        ctx.status = 500;
      }
    },
  };
  