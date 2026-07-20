/* ═══════════════════════════════════════════════════════════
   출고 계획 서비스워커
   카카오톡 등에서 "보내기(공유)"로 전달된 PDF를 받아
   shipping.html 에서 꺼내 쓸 수 있도록 임시 보관합니다.
   ═══════════════════════════════════════════════════════════ */
const SHARE_CACHE = 'bnf-shipping-share-v1';
const SHARE_PREFIX = '/__bnf_shared__/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  /* 공유로 들어온 POST 요청만 가로챕니다 */
  if (req.method !== 'POST' || !url.pathname.endsWith('/shipping.html')) return;

  event.respondWith((async () => {
    const target = new URL('./shipping.html?shared=1', self.location.href).href;
    try {
      const form = await req.formData();
      const files = form.getAll('files').filter((f) => f && typeof f.size === 'number' && f.size > 0);
      const cache = await caches.open(SHARE_CACHE);

      /* 이전 공유 잔여물 정리 */
      for (const key of await cache.keys()) {
        if (key.url.indexOf(SHARE_PREFIX) !== -1) await cache.delete(key);
      }

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        await cache.put(
          SHARE_PREFIX + i,
          new Response(f, {
            headers: {
              'content-type': f.type || 'application/pdf',
              'x-bnf-filename': encodeURIComponent(f.name || ('공유파일' + (i + 1) + '.pdf'))
            }
          })
        );
      }
      await cache.put(SHARE_PREFIX + 'count', new Response(String(files.length)));
    } catch (e) {
      /* 실패해도 앱은 정상적으로 열리게 둡니다 */
    }
    return Response.redirect(target, 303);
  })());
});
