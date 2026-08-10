/* Service Worker بسيط لنظام YS STEEL — الهدف الأساسي منه تفعيل خاصية "تثبيت التطبيق"
   على الموبايل واللابتوب (المتصفحات بتشترط وجود service worker شغال عشان تظهر خاصية
   التثبيت).

   مهم جدًا: بيتعامل بس مع ملفات نفس الموقع (index.html, manifest.json, الأيقونات).
   أي طلب لموقع تاني (Firebase, Firestore, Google APIs, CDN زي gstatic/cdnjs) بيتسيب
   يتحمل عادي من غير أي تدخل خالص — لأن التدخل في الطلبات دي هو اللي بيكسر اتصال
   البرنامج بقاعدة البيانات اللحظي ويسيب شاشة بيضاء بعد التثبيت. */
const CACHE_NAME = 'ysteel-shell-v2';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // أي طلب مش GET، أو مش لنفس أصل الموقع (كروس-أوريجن زي Firebase/Firestore/CDN) —
  // سيبه يتحمل عادي بدون أي تدخل من الـ service worker خالص.
  if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
