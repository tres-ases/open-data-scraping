const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://senado-admin.open-data.cl',
      changeOrigin: true,
    })
  );
};
