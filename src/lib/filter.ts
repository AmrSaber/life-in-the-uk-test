import type { Question } from './data.ts';

export type Filters = {
	tags: string[];
	matchAll: boolean;
	search: string;
	includeExplanations: boolean;
	starredOnly: boolean;
};

export const emptyFilters = (): Filters => ({
	tags: [],
	matchAll: false,
	search: '',
	includeExplanations: false,
	starredOnly: false
});

export function filterQuestions(list: Question[], f: Filters, stars: Set<string>): Question[] {
	const term = f.search.trim().toLowerCase();
	return list.filter((q) => {
		if (f.tags.length) {
			const has = (t: string) => q.tags.includes(t);
			if (f.matchAll ? !f.tags.every(has) : !f.tags.some(has)) return false;
		}
		if (f.starredOnly && !stars.has(q.id)) return false;
		if (term) {
			const text = [q.question, ...q.options, f.includeExplanations ? q.explanation : '']
				.join('\n')
				.toLowerCase();
			if (!text.includes(term)) return false;
		}
		return true;
	});
}
