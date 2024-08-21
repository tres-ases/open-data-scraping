const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://d1ucdnv48zk2zl.cloudfront.net',
      changeOrigin: true,
    })
  );
};
