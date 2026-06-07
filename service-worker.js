/**
 * Service Worker - 离线缓存服务
 * 实现PWA离线访问功能
 */

const CACHE_NAME = 'accounting-app-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/storage.js',
    './js/import.js',
    './js/chart.js',
    './js/budget.js',
    './js/export.js',
    './js/theme.js',
    './js/voice.js',
    './js/template.js',
    './js/utils.js',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/apple-touch-icon.png'
];

const CDN_ASSETS = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    console.log('Service Worker: 安装中...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: 缓存静态资源');
                // 缓存本地资源
                const localPromise = cache.addAll(STATIC_ASSETS);
                // 尝试缓存CDN资源（失败不影响安装）
                const cdnPromise = Promise.allSettled(
                    CDN_ASSETS.map(url => cache.add(url).catch(err => {
                        console.warn('CDN资源缓存失败:', url, err);
                        return null;
                    }))
                );
                return Promise.all([localPromise, cdnPromise]);
            })
            .then(() => {
                console.log('Service Worker: 安装完成');
                return self.skipWaiting();
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('Service Worker: 激活中...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: 删除旧缓存', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: 激活完成');
            return self.clients.claim();
        })
    );
});

// 请求事件 - 网络优先策略
self.addEventListener('fetch', (event) => {
    // 只处理GET请求
    if (event.request.method !== 'GET') {
        return;
    }

    // 跳过非同源请求（除了CDN）
    const url = new URL(event.request.url);
    const isLocal = url.origin === location.origin;
    const isCDN = CDN_ASSETS.some(cdn => event.request.url.startsWith(cdn));

    if (!isLocal && !isCDN) {
        return;
    }

    event.respondWith(
        // 网络优先策略
        fetch(event.request)
            .then((response) => {
                // 如果响应成功，缓存并返回
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 网络失败，尝试从缓存获取
                console.log('Service Worker: 网络失败，使用缓存', event.request.url);
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // 如果缓存中也没有，返回离线页面或错误
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        return new Response('离线状态，资源不可用', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});