// Vercel Serverless Function Entry Point
import('../dist/index.js').then((module) => {
  module.default || module;
}).catch((err) => {
  console.error('Failed to load server:', err);
});

export default async function handler(req, res) {
  // This will be handled by the Express server in dist/index.js
  const { default: app } = await import('../dist/index.js');
  return app(req, res);
}
