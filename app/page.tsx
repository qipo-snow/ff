"use client";

import { Suspense, lazy, useEffect, useState } from "react";

// 动态导入 MainApp，禁用 SSR
const MainApp = lazy(() => 
  import("@/components/main-app").then((mod) => {
    return { default: mod.MainApp || (() => <div>加载失败，请刷新</div>) };
  }).catch(() => {
    return { default: () => <div>组件加载失败，请刷新页面</div> };
  })
);

// 简易错误边界
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
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
  // 检测是否为 iOS 15 及以下
  const [isOldDevice, setIsOldDevice] = useState(false);

  useEffect(() => {
    const isOld = /iPhone OS 1[0-5]_/.test(navigator.userAgent);
    setIsOldDevice(isOld);
  }, []);

  // 如果是 iOS 15，显示精简提示（避免加载 MainApp 里的复杂组件）
  if (isOldDevice) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        padding: 20,
        textAlign: "center",
        fontSize: 16
      }}>
        <h2>📱 精简模式</h2>
        <p style={{ color: "#666" }}>您的设备正在运行兼容版本</p>
        <div style={{ marginTop: 20, padding: 20, background: "#f5f5f5", borderRadius: 12, maxWidth: 300 }}>
          <p>部分高级功能已关闭以保证稳定运行</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: "8px 24px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", fontSize: 16, cursor: "pointer" }}
          >
            刷新页面
          </button>
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
