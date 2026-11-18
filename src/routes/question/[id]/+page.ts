import { error } from '@sveltejs/kit';
import { questionById, questions } from '#lib/data.ts';

export const entries = () => questions.map((q) => ({ id: q.id }));

export function load({ params }) {
	const question = questionById.get(params.id);
	if (!question) error(404, 'Question not found');
	return { question };
}
