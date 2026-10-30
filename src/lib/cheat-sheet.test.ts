import { describe, expect, it } from 'vitest';
import cheatSheet from '../../data/cheat-sheet.json';
import { questionById, questions } from './data.ts';

type Row = { questions: string[]; term?: string; fact?: string; cells?: string[] };
const rows = cheatSheet.flatMap((s) => s.blocks.flatMap((b) => b.rows as Row[]));

describe('cheat sheet', () => {
	it('covers every question and only real questions', () => {
		const covered = new Set(rows.flatMap((r) => r.questions));
		expect(questions.filter((q) => !covered.has(q.id)).map((q) => q.id)).toEqual([]);
		expect([...covered].filter((id) => !questionById.has(id))).toEqual([]);
	});

	it('has complete rows with unique section ids', () => {
		expect(new Set(cheatSheet.map((s) => s.id)).size).toBe(cheatSheet.length);
		for (const r of rows) {
			expect(r.questions.length).toBeGreaterThan(0);
			expect(r.cells ? r.cells.length > 0 : !!(r.term && r.fact)).toBe(true);
		}
	});
});
