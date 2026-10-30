import { SvelteSet } from 'svelte/reactivity';
import { questionById } from './data.ts';

export type SavedExam = { id: string; name: string; questions: string[] };
export type Theme = 'light' | 'dark' | 'auto';

function load<T>(key: string, fallback: T, valid: (v: unknown) => boolean): T {
	try {
		const v = JSON.parse(localStorage.getItem(key) ?? 'null');
		return valid(v) ? v : fallback;
	} catch {
		return fallback;
	}
}

function save(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage full or blocked: keep working in memory for this visit.
	}
}

const isStringArray = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string');

// ---- Stars

export const stars = new SvelteSet<string>(load('lituk:stars', [], isStringArray));

const saveStars = () => save('lituk:stars', [...stars]);

export function toggleStar(id: string) {
	if (stars.has(id)) stars.delete(id);
	else stars.add(id);
	saveStars();
}

export function starAll(ids: Iterable<string>) {
	for (const id of ids) stars.add(id);
	saveStars();
}

// ---- Saved exams

const isSavedExam = (v: unknown) => {
	const e = v as SavedExam;
	return (
		!!e && typeof e.id === 'string' && typeof e.name === 'string' && isStringArray(e.questions)
	);
};

export const savedExams: SavedExam[] = $state(
	load<SavedExam[]>('lituk:saved-exams', [], (v) => Array.isArray(v) && v.every(isSavedExam)).map(
		(e) => ({ ...e, questions: e.questions.filter((id) => questionById.has(id)) })
	)
);

const saveExams = () => save('lituk:saved-exams', savedExams);

export function getSavedExam(id: string | null): SavedExam | undefined {
	return savedExams.find((e) => e.id === id);
}

export function createSavedExam(name: string, ids: Iterable<string>): SavedExam {
	const exam = { id: crypto.randomUUID(), name: name.trim(), questions: [...ids] };
	savedExams.push(exam);
	saveExams();
	return exam;
}

export function updateSavedExam(id: string, name: string, ids: Iterable<string>) {
	const exam = getSavedExam(id);
	if (!exam) return;
	exam.name = name.trim();
	exam.questions = [...ids];
	saveExams();
}

export function deleteSavedExam(id: string) {
	const i = savedExams.findIndex((e) => e.id === id);
	if (i >= 0) savedExams.splice(i, 1);
	saveExams();
}

export function toggleInSavedExam(examId: string, questionId: string) {
	const exam = getSavedExam(examId);
	if (!exam) return;
	exam.questions = exam.questions.includes(questionId)
		? exam.questions.filter((id) => id !== questionId)
		: [...exam.questions, questionId];
	saveExams();
}

// ---- Theme (also applied before first paint by the inline script in app.html)

export const theme = $state({
	value: load<Theme>('lituk:theme', 'auto', (v) => v === 'light' || v === 'dark' || v === 'auto')
});

export function setTheme(value: Theme) {
	theme.value = value;
	save('lituk:theme', value);
	document.documentElement.dataset.theme = value;
}
