import { error } from '@sveltejs/kit';
import { exams } from '#lib/data.ts';

export const entries = () => exams.map((e) => ({ id: e.id }));

export function load({ params }) {
	const exam = exams.find((e) => e.id === params.id);
	if (!exam) error(404, 'Exam not found');
	return { exam };
}
