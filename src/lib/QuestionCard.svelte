<script lang="ts">
	import type { Snippet } from 'svelte';
	import { correctIndexes, isCorrect, tagName, type Question } from './data.ts';
	import StarButton from './StarButton.svelte';

	/**
	 * answer: editable; locked: submitted answer with feedback; reveal: bank view with the
	 * correct answer marked and the explanation collapsed.
	 */
	type Mode = 'answer' | 'locked' | 'reveal';

	let {
		question: q,
		mode,
		selected = $bindable([]),
		label,
		actions
	}: {
		question: Question;
		mode: Mode;
		selected?: number[];
		label?: string;
		actions?: Snippet;
	} = $props();

	const correct = $derived(correctIndexes(q));
	const multi = $derived(q.type === 'multi');
	const hint = $derived(`Choose ${correct.length} answer${correct.length > 1 ? 's' : ''}`);
	const result = $derived(
		mode !== 'locked'
			? null
			: !selected.length
				? 'unanswered'
				: isCorrect(q, selected)
					? 'correct'
					: 'wrong'
	);

	function choose(i: number) {
		if (!multi) selected = [i];
		else selected = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i];
	}

	function badge(i: number): string {
		const isRight = correct.includes(i);
		if (mode === 'reveal') return isRight ? '✓ Correct answer' : '';
		if (mode !== 'locked') return '';
		const mine = selected.includes(i);
		if (isRight && mine) return '✓ Your answer, correct';
		if (isRight) return '✓ Correct answer';
		return mine ? '✗ Your answer' : '';
	}
</script>

<article class="card">
	<fieldset>
		<legend>
			{#if label}<span class="label muted">{label}</span>{/if}
			<span class="text">{q.question}</span>
		</legend>
		<p class="hint muted">
			{hint}{#if mode === 'answer' && multi}&nbsp;({selected.length} selected){/if}
		</p>
		<ul class="options">
			{#each q.options as option, i (i)}
				{@const b = badge(i)}
				<li>
					<label
						class="option"
						class:right={b.startsWith('✓')}
						class:wrong={b.startsWith('✗')}
						class:editable={mode === 'answer'}
					>
						<input
							type={multi ? 'checkbox' : 'radio'}
							name="answer-{q.id}"
							checked={mode === 'reveal' ? correct.includes(i) : selected.includes(i)}
							disabled={mode !== 'answer'}
							onchange={() => choose(i)}
						/>
						<span class="option-text">{option}</span>
						{#if b}<span class="badge">{b}</span>{/if}
					</label>
				</li>
			{/each}
		</ul>
	</fieldset>

	{#if result}
		<p class="result result-{result}">
			{#if result === 'correct'}✓ Correct{:else if result === 'wrong'}✗ Incorrect{:else}Not answered{/if}
		</p>
		<p class="explanation">{q.explanation}</p>
	{:else if mode === 'reveal'}
		<details>
			<summary>Explanation</summary>
			<p class="explanation">{q.explanation}</p>
		</details>
	{/if}

	<footer>
		<ul class="tags" aria-label="Tags">
			{#each q.tags as tag (tag)}<li>{tagName(tag)}</li>{/each}
		</ul>
		<div class="actions">
			<StarButton id={q.id} />
			{@render actions?.()}
		</div>
	</footer>
</article>

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		font-size: 1.15rem;
		font-weight: 600;
	}
	.label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.hint {
		margin: 0.35rem 0 0.75rem;
		font-size: 0.95rem;
	}
	.options {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}
	.option {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.75rem;
		min-height: 48px;
		padding: 0.55rem 0.8rem;
		border: 2px solid var(--border);
		border-radius: var(--radius);
	}
	.editable {
		cursor: pointer;
	}
	.editable:hover {
		background: var(--surface-2);
	}
	.option:has(input:checked) {
		border-color: var(--accent);
	}
	.option:has(input:focus-visible) {
		outline: 3px solid var(--focus);
		outline-offset: 2px;
	}
	.option-text {
		flex: 1;
		min-width: 10rem;
	}
	.right {
		border-color: var(--correct) !important;
		background: var(--correct-bg);
	}
	.wrong {
		border-color: var(--wrong) !important;
		background: var(--wrong-bg);
		border-style: dashed;
	}
	.badge {
		font-size: 0.85rem;
		font-weight: 700;
	}
	.right .badge {
		color: var(--correct);
	}
	.wrong .badge {
		color: var(--wrong);
	}
	input:disabled {
		opacity: 1;
	}
	.result {
		margin: 1rem 0 0.25rem;
		font-weight: 700;
		font-size: 1.1rem;
	}
	.result-correct {
		color: var(--correct);
	}
	.result-wrong {
		color: var(--wrong);
	}
	.explanation {
		margin: 0.25rem 0 0;
	}
	details {
		margin-top: 0.75rem;
	}
	summary {
		cursor: pointer;
		min-height: 44px;
		display: flex;
		align-items: center;
		font-weight: 600;
		color: var(--accent);
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.tags {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.tags li {
		font-size: 0.8rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-left: auto;
	}
</style>
