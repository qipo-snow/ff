"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { AccountGate } from "@/components/auth/account-gate";
import { CloudBackupScheduler } from "@/components/cloud-backup-scheduler";
import { MediaMaintenanceScheduler } from "@/components/media-maintenance-scheduler";
import { DesktopShell } from "./desktop-shell";
import { SplashAnimation } from "./splash-animation";
import { MusicProvider } from "@/lib/music-context";
import { hydrateKvDb } from "@/lib/kv-db";
import { getThemeAssetMap, readThemeProfile } from "@/lib/theme-storage";
import { resolveActiveIconSkins, type ThemeProfile } from "@/lib/theme-types";
import { hasPendingMcpOAuthCallback } from "@/lib/tool-executor";

const TEXT = {
  loading: "\u52A0\u8F7D\u4E2D...",
};

// ===== iOS 15 兼容性检测 =====
function isIOS15OrOlder() {
  if (typeof navigator === "undefined") return false;
  return /iPhone OS 1[0-5]_/.test(navigator.userAgent);
}

function SplashScreen({ ready = false, onEnter }: { ready?: boolean; onEnter?: () => void }) {
  return (
    <main className="app-root splash-root">
      <section
        className="phone-shell-wrap splash-shell-wrap"
        aria-label={TEXT.loading}
      >
        <div className="phone-case">
          <div className="phone-frame">
            <div className="phone-shell splash-phone-screen">
              <SplashAnimation />
              <button
                type="button"
                className={ready ? "splash-enter-button splash-enter-button-show" : "splash-enter-button"}
                onClick={onEnter}
                disabled={!ready}
                aria-label="Enter"
              >
                <ArrowRight size={18} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ===== 精简版主应用（给 iOS 15 用） =====
function LiteMainApp() {
  const [hydrated, setHydrated] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await hydrateKvDb();
      if (cancelled) return;
      setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AccountGate>
      {!splashDismissed ? (
        <SplashScreen ready={hydrated} onEnter={() => setSplashDismissed(true)} />
      ) : (
        <main className="app-root">
          <div style={{ padding: 20, textAlign: "center", fontSize: 16 }}>
            <h2>📱 精简模式</h2>
            <p style={{ color: "#666" }}>您的设备正在运行兼容版本</p>
            <div style={{ marginTop: 20, padding: 20, background: "#f5f5f5", borderRadius: 12 }}>
              <p>部分高级功能已关闭以保证稳定运行</p>
              <button 
                onClick={() => window.location.reload()}
                style={{ marginTop: 16, padding: "8px 24px", borderRadius: 8, border: "none", background: "#007AFF", color: "#fff", fontSize: 16 }}
              >
                刷新页面
              </button>
            </div>
          </div>
        </main>
      )}
    </AccountGate>
  );
}

// ===== 完整版主应用（给现代设备用） =====
function FullMainApp() {
  const [preparedDesktopTheme, setPreparedDesktopTheme] = useState<PreparedDesktopTheme | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [splashDismissed, setSplashDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await hydrateKvDb();
      if (cancelled) return;

      let nextPreparedTheme: PreparedDesktopTheme | null = null;
      try {
        nextPreparedTheme = await prepareDesktopThemeForFirstPaint();
      } catch (error) {
        console.warn("[MainApp] desktop theme preload failed:", error);
      }

      if (cancelled) return;
      setPreparedDesktopTheme(nextPreparedTheme);
      setHydrated(true);
      if (hasPendingMcpOAuthCallback()) {
        setSplashDismissed(true);
      }
    })();

    // 安卓全屏兜底：点击屏幕进入全屏模式（iOS 不支持此 API，会自动忽略）
    const isMobile = window.matchMedia("(max-width: 500px) and (hover: none) and (pointer: coarse)").matches;
    const isEdge = /Edg/i.test(navigator.userAgent);
    if (!isMobile || isEdge) return () => {
      cancelled = true;
    };

    function tryFullscreen() {
      const doc = document.documentElement;
      if (document.fullscreenElement) return;
      doc.requestFullscreen?.().catch(() => { });
    }
    document.addEventListener("click", tryFullscreen);
    return () => {
      cancelled = true;
      document.removeEventListener("click", tryFullscreen);
    };
  }, []);

  return (
    <AccountGate>
      {!splashDismissed ? (
        <SplashScreen ready={hydrated} onEnter={() => setSplashDismissed(true)} />
      ) : (
        <main className="app-root">
          <MusicProvider>
            <DesktopShell
              initialThemeProfile={preparedDesktopTheme?.profile}
              initialThemeAssets={preparedDesktopTheme?.assets}
            />
            <CloudBackupScheduler />
            <MediaMaintenanceScheduler />
          </MusicProvider>
        </main>
      )}
    </AccountGate>
  );
}

// ===== 导出：根据设备自动选择版本 =====
export function MainApp() {
  const [isOldDevice, setIsOldDevice] = useState<boolean | null>(null);

  useEffect(() => {
    setIsOldDevice(isIOS15OrOlder());
  }, []);

  // 还没检测完设备时，显示空白
  if (isOldDevice === null) {
    return <div style={{ minHeight: "100vh" }} />;
  }

  // iOS 15 及以下用精简版，其他用完整版
  return isOldDevice ? <LiteMainApp /> : <FullMainApp />;
}

// ===== 保留原有的类型和函数（供 FullMainApp 使用） =====
type PreparedDesktopTheme = {
  profile: ThemeProfile;
  assets: Record<string, string>;
};

function collectFirstPaintThemeAssetIds(profile: ThemeProfile): string[] {
  const ids = [
    profile.wallpaperAssetId,
    profile.fontAssetId,
    profile.dockSkinAssetId,
    ...Object.values(resolveActiveIconSkins(profile))
  ].filter((value): value is string => Boolean(value));
  return Array.from(new Set(ids));
}

function preloadImageDataUrl(url: string): Promise<void> {
  if (typeof window === "undefined" || !url.startsWith("data:image/")) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new Image();
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      if (typeof image.decode === "function") {
        void image.decode().catch(() => undefined).finally(resolve);
        return;
      }
      resolve();
    };
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    if (image.complete) {
      finish();
    }
  });
}

async function prepareDesktopThemeForFirstPaint(): Promise<PreparedDesktopTheme> {
  const profile = readThemeProfile();
  const assetIds = collectFirstPaintThemeAssetIds(profile);
  const assets = assetIds.length ? await getThemeAssetMap(assetIds) : {};
  await Promise.all(Object.values(assets).map(preloadImageDataUrl));
  return { profile, assets };
}
