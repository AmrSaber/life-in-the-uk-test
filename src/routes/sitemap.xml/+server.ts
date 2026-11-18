import { exams, questions, topics } from '#lib/data.ts';
import { SITE_URL } from '#lib/site.ts';

export const prerender = true;

export function GET() {
	const paths = [
		'/',
		'/bank',
		'/cheat-sheet',
		...exams.map((e) => `/exam/${e.id}`),
		...topics.map((t) => `/topic/${t.slug}`),
		...questions.map((q) => `/question/${q.id}`)
	];
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `<url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc></url>`).join('\n')}
</urlset>
`;
	return new Response(body, { headers: { 'content-type': 'application/xml' } });
}
