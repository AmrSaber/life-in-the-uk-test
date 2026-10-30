import { describe, expect, it } from 'vitest';
import {
	correctIndexes,
	exams,
	isCorrect,
	questionById,
	questions,
	requiredCount,
	tagGroups,
	tagName
} from './data.ts';

const q = (id: string) => questionById.get(id)!;

describe('answers', () => {
	it('normalises the three answer shapes', () => {
		const single = questions.find((x) => x.type === 'single')!;
		expect(correctIndexes(single)).toEqual([single['correct-answer']]);
		expect(correctIndexes(q('q0001'))).toEqual([0, 1]);
		expect(correctIndexes(q('q0007'))).toEqual([1]); // false -> "False"
		expect(correctIndexes(q('q0013'))).toEqual([0]); // true -> "True"
	});

	it('requires three answers for q0125', () => {
		expect(requiredCount(q('q0125'))).toBe(3);
	});

	it('scores all-or-nothing', () => {
		expect(isCorrect(q('q0001'), [1, 0])).toBe(true);
		expect(isCorrect(q('q0001'), [0])).toBe(false);
		expect(isCorrect(q('q0001'), [0, 1, 2])).toBe(false);
		expect(isCorrect(q('q0001'), [0, 2])).toBe(false);
	});
});

describe('data integrity', () => {
	it('references only existing questions', () => {
		expect(exams).toHaveLength(17);
		for (const e of exams) for (const id of e.questions) expect(questionById.has(id)).toBe(true);
	});

	it('has valid correct answers', () => {
		for (const x of questions) {
			const idx = correctIndexes(x);
			expect(idx.every((i) => i >= 0 && i < x.options.length)).toBe(true);
			if (x.type === 'boolean') expect(x.options).toEqual(['True', 'False']);
		}
	});

	it('names tags and groups them by chapter', () => {
		expect(tagName('ch4.6')).toBe('[Ch4.6] Leisure');
		expect(tagName('outdated')).toBe('outdated');
		expect(tagGroups[0].slice(0, 2)).toEqual(['ch1', 'ch1.1']);
		expect(tagGroups.at(-1)).toEqual(['outdated']);
	});
});
