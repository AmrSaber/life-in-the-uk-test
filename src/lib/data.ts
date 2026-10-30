import questionsJson from '../../data/questions.json';
import examsJson from '../../data/exams.json';
import curriculumJson from '../../data/curriculum.json';
import tagsJson from '../../data/tags.json';

export type Question = {
	id: string;
	question: string;
	type: 'single' | 'multi' | 'boolean';
	options: string[];
	'correct-answer': number | number[] | boolean;
	tags: string[];
	explanation: string;
};

export type Exam = { id: string; name: string; questions: string[] };

export const questions = questionsJson as Question[];
export const questionById = new Map(questions.map((q) => [q.id, q]));
export const exams = examsJson as Exam[];

export const EXAM_MINUTES = 45;
export const PASS_MARK = 18;

const tagNames: Record<string, string> = tagsJson;

export function tagName(slug: string): string {
	return tagNames[slug] ?? slug;
}

/** Group filter tags by chapter in curriculum order; tags outside the curriculum come last. */
export const tagGroups: string[][] = (() => {
	const groups = curriculumJson.chapters.map((c) => [c.id, ...c.sections.map((s) => s.id)]);
	const known = new Set(groups.flat());
	const extra = [...new Set(questions.flatMap((q) => q.tags))].filter((t) => !known.has(t)).sort();
	return extra.length ? [...groups, extra] : groups;
})();

export function correctIndexes(q: Question): number[] {
	const answer = q['correct-answer'];
	if (typeof answer === 'number') return [answer];
	if (typeof answer === 'boolean') return [q.options.indexOf(answer ? 'True' : 'False')];
	return answer;
}

export function requiredCount(q: Question): number {
	return correctIndexes(q).length;
}

export function isCorrect(q: Question, selected: number[]): boolean {
	const correct = correctIndexes(q);
	return selected.length === correct.length && correct.every((i) => selected.includes(i));
}

export function shuffle<T>(items: T[]): T[] {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
