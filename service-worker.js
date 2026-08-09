/* Service Worker بسيط لنظام YS STEEL — الهدف الأساسي منه تفعيل خاصية "تثبيت التطبيق"
   على الموبايل واللابتوب (المتصفحات بتشترط وجود service worker شغال عشان تظهر خاصية
   التثبيت). بيعمل كمان كاش خفيف لصفحة البرنامج نفسها عشان تفتح بسرعة أكبر حتى لو
   الاتصال بطيء (البيانات الفعلية دايمًا بتيجي لايف من Firebase، مش من الكاش). */
const CACHE_NAME = 'ysteel-shell-v1';
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

/* استراتيجية "الشبكة أولاً، والكاش احتياطي فقط لو مفيش نت" — عشان البرنامج دايمًا
   يحاول يجيب أحدث نسخة أولاً (خصوصًا بعد أي تحديث)، ولو الشبكة فشلت (أوفلاين تمامًا)
   يرجع لآخر نسخة محفوظة بدل ما الصفحة تفضل بيضاء تمامًا. */
self.addEventListener('fetch', (event) => {
  if(event.request.method !== 'GET') return;
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
