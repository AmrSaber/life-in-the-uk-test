import { version } from '$app/env';
import { assets, immutable, prerendered } from '$app/manifest';
import { self } from '$app/service-worker';

// One cache per deploy; the activate step deletes caches from older deploys.
const CACHE = `cache-${version}`;
// Manifest paths are relative to the base path; the worker's scope is that base.
// Dotfiles (.nojekyll) are not served, and one missing file would fail the whole install.
const urls = [...immutable, ...assets, ...prerendered]
	.filter((f) => !f.path.split('/').at(-1)!.startsWith('.'))
	.map((f) => new URL(f.path, self.registration.scope).href);
const precached = new Set(urls);

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

	// Build files and static assets don't change within a deploy: serve them from the cache.
	if (precached.has(request.url)) {
		// ignoreVary: module scripts send Origin, the precache requests didn't (servers can send Vary: Origin).
		event.respondWith(
			caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request))
		);
		return;
	}

	// Pages: prefer the network so a new deploy shows up, fall back to the cached shell offline.
	// Query strings (?id=, ?saved=) don't change the prerendered shell, so ignore them on fallback.
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(async () => {
				const hit = await caches.match(request, { ignoreSearch: true, ignoreVary: true });
				return (
					hit ??
					(await caches.match(new URL('./', self.registration.scope).href, { ignoreVary: true })) ??
					Response.error()
				);
			})
		);
	}
});
