"use client";

// components/chat-plugin-bootstrap.tsx
// 聊天插件运行时启动引导：应用挂载后加载全部启用插件。
// 放在根布局，保证插件的 hook 在用户进入聊天前就已注册。

import { useEffect } from "react";

export function ChatPluginBootstrap() {
    useEffect(() => {
        // iOS 15 兼容检测：如果设备太旧，直接跳过插件加载，避免崩溃
        const isOldSafari = /iPhone OS 1[0-5]_/.test(navigator.userAgent) || 
                           /iPhone OS 15_/.test(navigator.userAgent);
        
        if (isOldSafari) {
            console.log("旧版 iOS 检测到，跳过聊天插件加载以保证页面稳定");
            return;
        }

        // 用 try-catch 包裹，防止插件加载崩溃导致整个页面白屏
        try {
            import("@/lib/chat-plugin-runtime").then(({ getChatPluginRuntime }) => {
                try {
                    getChatPluginRuntime().ensureStarted();
                } catch (err) {
                    console.warn("聊天插件启动失败，但页面继续运行:", err);
                }
            }).catch(() => {
                console.warn("聊天插件模块加载失败，但页面继续运行");
            });
        } catch (err) {
            console.warn("聊天插件引导错误:", err);
        }
    }, []);
    return null;
}
