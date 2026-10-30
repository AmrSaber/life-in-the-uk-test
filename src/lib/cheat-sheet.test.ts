import { describe, expect, it } from 'vitest';
import cheatSheet from '../../data/cheat-sheet.json';
import { questionById } from './data.ts';

type Row = { questions: string[]; term?: string; fact?: string; cells?: string[] };
const rows = cheatSheet.flatMap((s) => s.blocks.flatMap((b) => b.rows as Row[]));

describe('cheat sheet', () => {
	it('links every row to existing questions', () => {
		for (const r of rows) {
			expect(r.questions.length).toBeGreaterThan(0);
			for (const id of r.questions) expect(questionById.has(id), id).toBe(true);
		}
	});

	it('has complete rows with unique section ids', () => {
		expect(new Set(cheatSheet.map((s) => s.id)).size).toBe(cheatSheet.length);
		for (const r of rows)
			expect(r.cells ? r.cells.every(Boolean) : !!(r.term && r.fact)).toBe(true);
	});
});
