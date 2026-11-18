import { error } from '@sveltejs/kit';
import { topicBySlug, topics } from '#lib/data.ts';

export const entries = () => topics.map((t) => ({ slug: t.slug }));

export function load({ params }) {
	const topic = topicBySlug.get(params.slug);
	if (!topic) error(404, 'Topic not found');
	return { topic };
}
