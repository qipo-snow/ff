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
  const [isOldDevice, setIsOldDevice] = useState<boolean | null>(null);
  const [enterApp, setEnterApp] = useState(false);

  useEffect(() => {
    const isOld = /iPhone OS 1[0-5]_/.test(navigator.userAgent);
    setIsOldDevice(isOld);
  }, []);

  // 还没检测完设备时，显示空白
  if (isOldDevice === null) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  // iOS 15 且用户还没点击"进入应用"
  if (isOldDevice && !enterApp) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        padding: 20,
        textAlign: "center",
        fontSize: 16,
        background: "#f8f7f2"
      }}>
        <h2 style={{ fontSize: 24, marginBottom: 8 }}>📱 精简模式</h2>
        <p style={{ color: "#666", marginBottom: 20 }}>您的设备正在运行兼容版本</p>
        <div style={{ padding: 20, background: "#fff", borderRadius: 12, maxWidth: 300, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <p style={{ marginBottom: 16, color: "#333" }}>部分高级功能已关闭以保证稳定运行</p>
          <button 
            onClick={() => setEnterApp(true)}
            style={{ 
              padding: "10px 32px", 
              borderRadius: 8, 
              border: "none", 
              background: "#007AFF", 
              color: "#fff", 
              fontSize: 16, 
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            进入应用 →
          </button>
        </div>
      </div>
    );
  }

  // 现代设备 或 iOS 15 用户已点击进入
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>加载中...</div>}>
        <MainApp />
      </Suspense>
    </ErrorBoundary>
  );
}
