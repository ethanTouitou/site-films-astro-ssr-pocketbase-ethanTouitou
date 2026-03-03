// src/middleware/index.ts
import PocketBase from 'pocketbase';
import { defineMiddleware } from 'astro/middleware';

export const onRequest = defineMiddleware(async ({ locals, request, isPrerendered }, next) => {
    const pbUrl =
        import.meta.env.PB_URL ||
        (import.meta.env.MODE === 'development'
            ? 'http://localhost:8090'
            : 'https://site-films.ethantouitou.fr:443');

    locals.pb = new PocketBase(pbUrl);

    if (!isPrerendered) {
        locals.pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

        try {
            locals.pb.authStore.isValid && await locals.pb.collection('users').authRefresh();
        } catch (_) {
            locals.pb.authStore.clear();
        }
    }

    const response = await next();

    if (!isPrerendered) {
        response.headers.append('set-cookie', locals.pb.authStore.exportToCookie());
    }

    return response;
});