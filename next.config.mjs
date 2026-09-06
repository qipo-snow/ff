import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === "win32";
const isWslUncPath = projectRoot.startsWith("\\\\wsl$\\");

function resolveDistDir() {
  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }
  if (!isWindows || !isWslUncPath) {
    return ".next";
  }
  const safeProjectName = path.basename(projectRoot).replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(os.tmpdir(), `next-dist-${safeProjectName}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: projectRoot,
  distDir: resolveDistDir(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/api/**": ["./data/**"],
  },
  env: {
    NEXT_PUBLIC_SELF_HOSTED_MODE: 'true',
  },
  experimental: {
    forceSwcTransforms: true,
  },
  // ========== 新增：兼容性配置 ==========
  compiler: {
    // 移除 console.log 以减少 iOS 15 的日志压力（可选）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 强制转译某些可能不兼容的 node_modules 包
  transpilePackages: [
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'three',
    'd3-delaunay',
    'dompurify',
    'lucide-react',
  ],
  // ========== 兼容性配置结束 ==========
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
      };
      
      // ========== 新增：为客户端注入 Polyfill ==========
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        if (entries['main-app'] && !entries['main-app'].includes('core-js/stable')) {
          entries['main-app'].unshift('core-js/stable');
        }
        if (entries['main-app'] && !entries['main-app'].includes('regenerator-runtime/runtime')) {
          entries['main-app'].unshift('regenerator-runtime/runtime');
        }
        return entries;
      };
      // ========== Polyfill 注入结束 ==========
    }
    return config;
  },
};

export default nextConfig;
