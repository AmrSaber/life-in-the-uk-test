import { describe, expect, it } from 'vitest';
import cheatSheet from '../../data/cheat-sheet.json';
import { questionById } from './data.ts';

type Row = { questions: string[]; term: string; fact: string };
type Block = { rows?: Row[]; cards?: { title: string; rows: Row[] }[] };
const rows = cheatSheet.flatMap((s) =>
	(s.blocks as Block[]).flatMap((b) => b.rows ?? b.cards!.flatMap((c) => c.rows))
);

describe('cheat sheet', () => {
	it('links every row to existing questions', () => {
		// Rows can have no questions: the nation cards are complete even where nothing is tested.
		for (const r of rows) for (const id of r.questions) expect(questionById.has(id), id).toBe(true);
	});

	it('has complete rows with unique section ids', () => {
		expect(new Set(cheatSheet.map((s) => s.id)).size).toBe(cheatSheet.length);
		for (const r of rows) expect(!!(r.term && r.fact)).toBe(true);
	});
});
