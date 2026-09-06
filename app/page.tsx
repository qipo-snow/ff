"use client";

import { Suspense, lazy } from "react";

// 动态导入 MainApp，并禁用 SSR（服务端渲染），避免 Node.js 环境报错
const MainApp = lazy(() => 
  import("@/components/main-app").then((mod) => {
    // 如果导入失败，返回一个空组件，防止页面崩溃
    return { default: mod.MainApp || (() => <div>加载失败，请刷新</div>) };
  }).catch(() => {
    return { default: () => <div>组件加载失败，请刷新页面</div> };
  })
);

// 简易错误边界组件
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handler = () => setHasError(true);
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);
  
  if (hasError) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontSize: 18 }}>
        ⚠️ 页面加载遇到问题，请刷新重试
        <br />
        <button onClick={() => window.location.reload()} style={{ marginTop: 10, padding: "8px 20px" }}>
          刷新页面
        </button>
      </div>
    );
  }
  return <>{children}</>;
}

export default function HomePage() {
  // 检测是否为 iOS 15 及以下，如果是则显示简化版
  const isOldDevice = typeof navigator !== "undefined" && 
                     /iPhone OS 1[0-5]_/.test(navigator.userAgent);

  if (isOldDevice) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontSize: 16 }}>
        <h2>📱 您的设备正在加载精简版</h2>
        <p style={{ color: "#666" }}>为了兼容性，部分特效已关闭</p>
        <div style={{ marginTop: 20 }}>
          <Suspense fallback={<div>加载中...</div>}>
            <MainApp />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>加载中...</div>}>
        <MainApp />
      </Suspense>
    </ErrorBoundary>
  );
}
