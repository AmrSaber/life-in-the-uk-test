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

export type Topic = {
	id: string;
	/** URL segment, for example "3-4-a-global-power". */
	slug: string;
	/** Short name, without numbering. */
	name: string;
	/** Name with its curriculum numbering, as in the handbook. */
	label: string;
	/** The chapter's id for a section; undefined for a chapter. */
	chapter?: string;
};

const slugify = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const topic = (id: string, label: string, chapter?: string): Topic => {
	const name = label.replace(/^(Chapter )?[\d.]+[.:]?\s+/, '');
	return { id, slug: `${id.slice(2).replace('.', '-')}-${slugify(name)}`, name, label, chapter };
};

/**
 * Sections with fewer questions than this are too thin for a page; their chapter lists them.
 * A chapter with one section has no section page, because it would repeat the chapter's.
 */
const MIN_SECTION_QUESTIONS = 3;

/** Each chapter and each substantial section has its own page. */
export const topics: Topic[] = curriculumJson.chapters.flatMap((c) => [
	topic(c.id, c.name),
	...(c.sections.length > 1 ? c.sections : [])
		.filter((s) => questions.filter((q) => q.tags.includes(s.id)).length >= MIN_SECTION_QUESTIONS)
		.map((s) => topic(s.id, s.name, c.id))
]);
export const topicById = new Map(topics.map((t) => [t.id, t]));
export const topicBySlug = new Map(topics.map((t) => [t.slug, t]));

/** The most specific topic page a question belongs to: its section's, else its chapter's. */
export function topicOf(q: Question): Topic | undefined {
	const found = q.tags.map((t) => topicById.get(t)).filter((t) => t !== undefined);
	return found.find((t) => t.chapter) ?? found[0];
}

/** A topic page lists every question tagged with it, so a chapter page includes its sections'. */
export const questionsForTopic = (t: Topic) => questions.filter((q) => q.tags.includes(t.id));

/** The chapter's sections, with their own page when they have one. */
export const sectionsOf = (t: Topic) =>
	curriculumJson.chapters
		.find((c) => c.id === t.id)!
		.sections.map((s) => ({ id: s.id, label: s.name, page: topicById.get(s.id) }));

export const examsWith = (q: Question) => exams.filter((e) => e.questions.includes(q.id));

/** The correct options as text, for page descriptions and structured data. */
export const answerText = (q: Question) =>
	correctIndexes(q)
		.map((i) => q.options[i])
		.join('; ');

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
