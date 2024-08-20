const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://dhyukio1988dv.cloudfront.net',
      changeOrigin: true,
    })
  );
};
