import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockApigeePlugin = () => ({
  name: 'mock-apigee-plugin',
  enforce: 'pre' as const,
  resolveId(id: string) {
    if (id.includes('apigee_llm.js')) {
      return path.resolve(__dirname, 'src/services/mock-apigee.ts');
    }
    return null;
  }
});

const terminalLoggerPlugin = () => ({
  name: 'terminal-logger',
  configureServer(server) {
    server.middlewares.use('/api/log', (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const level = data.level || 'INFO';
            const timestamp = new Date().toLocaleTimeString();
            console.log(`\x1b[36m[Browser ${level} ${timestamp}]\x1b[0m`, data.message);
            if (data.args && data.args.length > 0) {
              data.args.forEach((arg: any) => console.log(JSON.stringify(arg, null, 2)));
            }
          } catch (e) {
            console.log('\x1b[31m[Browser Log Error]\x1b[0m Failed to parse log:', body);
          }
          res.end('ok');
        });
      } else {
        res.end();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mockApigeePlugin(),
    terminalLoggerPlugin(),
    nodePolyfills({
      include: ['util', 'os', 'buffer', 'process', 'stream', 'path', 'fs', 'zlib', 'http', 'https'],
      globals: {
        process: true,
        Buffer: true,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^p-retry$/,
        replacement: path.resolve(__dirname, 'src/services/p-retry-fix.js')
      },
      {
        find: /.*\/models\/apigee_llm\.js$/,
        replacement: path.resolve(__dirname, 'src/services/mock-apigee.ts')
      },
      {
        find: /@google\/adk\/dist\/web\/models\/apigee_llm\.js$/,
        replacement: path.resolve(__dirname, 'src/services/mock-apigee.ts')
      },
      {
        find: '@google/adk',
        replacement: path.resolve(__dirname, 'src/services/adk-web-patch.ts')
      }
    ]
  },
  optimizeDeps: {
    include: ['p-retry'],
    exclude: ['@google/adk', '@google/genai'],
    esbuildOptions: {
      alias: {
        '@google/adk': path.resolve(__dirname, 'src/services/adk-web-patch.ts'),
      },
      plugins: [
        {
          name: 'mock-apigee',
          setup(build) {
            // Match any path ending in apigee_llm.js
            build.onResolve({ filter: /apigee_llm\.js$/ }, () => ({
              path: path.resolve(__dirname, 'src/services/mock-apigee.ts'),
            }));
          },
        },
      ],
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  server: {
    proxy: {
      '/api/vertex': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/serpapi': {
        target: 'https://serpapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/serpapi/, '')
      },
      '/getprospect': {
        target: 'https://api.getprospect.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/getprospect/, '')
      },
      '/linkfinder': {
        target: 'https://api.linkfinderai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/linkfinder/, '')
      }
    }
  }
})
