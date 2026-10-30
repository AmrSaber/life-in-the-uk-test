import { describe, expect, it } from 'vitest';
import { questions } from './data.ts';
import { emptyFilters, filterQuestions, type Filters } from './filter.ts';

const run = (f: Partial<Filters>, stars = new Set<string>()) =>
	filterQuestions(questions, { ...emptyFilters(), ...f }, stars).map((q) => q.id);

describe('filterQuestions', () => {
	it('returns everything with no filters', () => {
		expect(run({})).toHaveLength(questions.length);
	});

	it('matches any selected tag by default', () => {
		const ids = run({ tags: ['ch4.4', 'outdated'] });
		const expected = questions.filter(
			(q) => q.tags.includes('ch4.4') || q.tags.includes('outdated')
		);
		expect(ids).toEqual(expected.map((q) => q.id));
	});

	it('matches every selected tag with matchAll', () => {
		expect(run({ tags: ['ch4.4', 'outdated'], matchAll: true })).toEqual(['q0011']);
		expect(run({ tags: ['ch3.1', 'ch3.2'], matchAll: true })).toEqual([]);
	});

	it('searches question and options case-insensitively, explanations only on request', () => {
		expect(run({ search: '  BIG BEN ' })).toContain('q0002');
		expect(run({ search: 'elizabeth tower' })).not.toContain('q0002');
		expect(run({ search: 'elizabeth tower', includeExplanations: true })).toContain('q0002');
	});

	it('combines starred with other filters', () => {
		const stars = new Set(['q0002', 'q0011']);
		expect(run({ starredOnly: true }, stars)).toEqual(['q0002', 'q0011']);
		expect(run({ starredOnly: true, tags: ['ch4.4'] }, stars)).toEqual(['q0011']);
	});
});
