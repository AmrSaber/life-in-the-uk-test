<script lang="ts">
	import { untrack } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import {
		EXAM_MINUTES,
		PASS_MARK,
		correctIndexes,
		isCorrect,
		requiredCount,
		shuffle,
		type Question
	} from '#lib/data.ts';
	import ConfirmDialog from '#lib/ConfirmDialog.svelte';
	import QuestionCard from '#lib/QuestionCard.svelte';

	let {
		name,
		questions,
		timed,
		onrestart
	}: { name: string; questions: Question[]; timed: boolean; onrestart: () => void } = $props();

	// Fixed for the whole attempt; later edits to a saved exam don't affect it.
	const order = shuffle(untrack(() => questions));
	const answers = $state(
		Object.fromEntries(order.map((q) => [q.id, { selected: [] as number[], submitted: false }]))
	);

	let index = $state(0);
	let finished = $state(false);
	let announcement = $state('');

	const q = $derived(order[index]);
	const a = $derived(answers[q.id]);
	const submittedCount = $derived(order.filter((x) => answers[x.id].submitted).length);
	const unanswered = $derived(order.length - submittedCount);
	const score = $derived(
		order.filter((x) => answers[x.id].submitted && isCorrect(x, answers[x.id].selected)).length
	);
	const hasProgress = $derived(
		order.some((x) => answers[x.id].submitted || answers[x.id].selected.length)
	);

	// ---- Timer: recomputed from the start time so it stays right if the tab sleeps.
	const startedAt = Date.now();
	const limit = EXAM_MINUTES * 60;
	let now = $state(Date.now());
	const remaining = $derived(Math.max(0, limit - Math.floor((now - startedAt) / 1000)));

	$effect(() => {
		if (!timed || finished) return;
		const timer = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(timer);
	});

	$effect(() => {
		if (timed && remaining === 0 && !finished) finish();
	});

	const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

	// ---- Answering

	function check() {
		a.submitted = true;
		const correct = correctIndexes(q).map((i) => q.options[i]);
		announcement = isCorrect(q, a.selected)
			? 'Correct.'
			: `Incorrect. The correct answer is: ${correct.join('; ')}.`;
	}

	function go(i: number) {
		index = i;
		announcement = '';
	}

	function status(x: Question) {
		const ans = answers[x.id];
		if (!ans.submitted) return { mark: '', text: 'not answered' };
		return isCorrect(x, ans.selected)
			? { mark: '✓', text: 'answered, correct' }
			: { mark: '✗', text: 'answered, incorrect' };
	}

	// ---- Finishing

	let finishOpen = $state(false);

	function requestFinish() {
		if (unanswered) finishOpen = true;
		else finish();
	}

	function finish() {
		finished = true;
		finishOpen = false;
		reviewProblemsOnly = score < order.length;
		window.scrollTo(0, 0);
	}

	// ---- Leaving and restarting an unfinished attempt

	let leaveOpen = $state(false);
	let restartOpen = $state(false);
	let leaveTo: URL | null = null;
	let allowLeave = false;

	beforeNavigate((nav) => {
		if (finished || allowLeave || !hasProgress || nav.willUnload || !nav.to) return;
		nav.cancel();
		leaveTo = nav.to.url;
		leaveOpen = true;
	});

	function leave() {
		allowLeave = true;
		if (leaveTo) goto(leaveTo);
	}

	function requestRestart() {
		if (hasProgress && !finished) restartOpen = true;
		else onrestart();
	}

	// ---- Review

	let reviewProblemsOnly = $state(false);
	const review = $derived(
		order
			.map((x, i) => ({ q: x, n: i + 1 }))
			.filter(
				({ q: x }) =>
					!reviewProblemsOnly || !(answers[x.id].submitted && isCorrect(x, answers[x.id].selected))
			)
	);
	const passed = $derived(score >= PASS_MARK);
</script>

{#if !finished}
	<div class="top">
		<h1>{name}</h1>
		<p class="progress" aria-live="polite">Question {index + 1} of {order.length}</p>
		{#if timed}<p class="timer" role="timer">{clock(remaining)} left</p>{/if}
		<div class="top-actions">
			<button type="button" onclick={requestRestart}>Restart</button>
			<button type="button" class={unanswered ? '' : 'primary'} onclick={requestFinish}
				>Finish</button
			>
		</div>
	</div>

	<div class="layout">
		<nav class="navigator" aria-label="Questions">
			<ol>
				{#each order as x, i (x.id)}
					{@const s = status(x)}
					<li>
						<button
							type="button"
							class:current={i === index}
							class:done={!!s.mark}
							aria-current={i === index ? 'step' : undefined}
							aria-label="Question {i + 1}, {s.text}"
							onclick={() => go(i)}
						>
							{i + 1}{#if s.mark}<span aria-hidden="true" class="mark">{s.mark}</span>{/if}
						</button>
					</li>
				{/each}
			</ol>
			<p class="muted legend">{submittedCount} of {order.length} answered</p>
		</nav>

		<div class="question">
			{#key q.id}
				<QuestionCard
					question={q}
					mode={a.submitted ? 'locked' : 'answer'}
					bind:selected={a.selected}
				/>
			{/key}
			<p class="visually-hidden" aria-live="polite">{announcement}</p>

			<div class="controls">
				<button type="button" disabled={index === 0} onclick={() => go(index - 1)}>
					<span aria-hidden="true">←</span> Previous
				</button>
				{#if !a.submitted}
					<button
						type="button"
						class="primary"
						disabled={a.selected.length !== requiredCount(q)}
						onclick={check}
					>
						Check answer
					</button>
				{:else if !unanswered}
					<button type="button" class="primary" onclick={finish}>Finish</button>
				{/if}
				<button
					type="button"
					class={a.submitted && unanswered ? 'primary' : ''}
					disabled={index === order.length - 1}
					onclick={() => go(index + 1)}
				>
					Next <span aria-hidden="true">→</span>
				</button>
			</div>
		</div>
	</div>
{:else}
	<h1>{name}: results</h1>
	<section class="card summary" aria-label="Score">
		<p class="score">{score} / {order.length} correct</p>
		{#if timed}
			<p class="verdict" class:pass={passed} class:fail={!passed}>
				{passed ? '✓ Passed' : `✗ Not passed. The pass mark is ${PASS_MARK}.`}
			</p>
		{/if}
		{#if unanswered}<p class="muted">{unanswered} unanswered, counted as incorrect.</p>{/if}
		<div class="summary-actions">
			<button type="button" class="primary" onclick={onrestart}>Try again</button>
			<a class="button" href="/">Home</a>
		</div>
	</section>

	<h2>Review your answers</h2>
	{#if score < order.length}
		<label class="check">
			<input type="checkbox" bind:checked={reviewProblemsOnly} />
			Show only incorrect and unanswered ({order.length - score})
		</label>
	{/if}
	<ol class="review">
		{#each review as { q: x, n } (x.id)}
			<li>
				<QuestionCard
					question={x}
					mode="locked"
					selected={answers[x.id].submitted ? answers[x.id].selected : []}
					label="Question {n}"
				/>
			</li>
		{/each}
	</ol>
{/if}

<ConfirmDialog
	bind:open={finishOpen}
	title="Finish this exam?"
	confirmLabel="Finish"
	onconfirm={finish}
>
	<p>
		{unanswered} question{unanswered === 1 ? ' is' : 's are'} unanswered and will count as incorrect.
		Selections you haven't checked count as unanswered.
	</p>
</ConfirmDialog>

<ConfirmDialog
	bind:open={leaveOpen}
	title="Leave this exam?"
	confirmLabel="Leave exam"
	danger
	onconfirm={leave}
>
	<p>Your attempt can't be resumed. Your stars and saved exams are kept.</p>
</ConfirmDialog>

<ConfirmDialog
	bind:open={restartOpen}
	title="Restart this exam?"
	confirmLabel="Restart"
	danger
	onconfirm={onrestart}
>
	<p>Your current attempt can't be resumed. Your stars and saved exams are kept.</p>
</ConfirmDialog>

<style>
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1rem;
		margin-bottom: 1rem;
	}
	.top h1 {
		margin: 0;
		font-size: 1.5rem;
		margin-right: auto;
	}
	.top p {
		margin: 0;
	}
	.timer {
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}
	.top-actions {
		display: flex;
		gap: 0.5rem;
	}
	.layout {
		display: grid;
		gap: 1rem;
	}
	.navigator ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(2.9rem, 1fr));
		gap: 0.35rem;
	}
	.navigator button {
		width: 100%;
		padding: 0;
		gap: 0.1em;
		font-variant-numeric: tabular-nums;
	}
	.navigator .done {
		background: var(--surface-2);
	}
	.navigator .current {
		outline: 3px solid var(--accent);
		outline-offset: -1px;
	}
	.mark {
		font-size: 0.8em;
	}
	.legend {
		margin: 0.4rem 0 0;
		font-size: 0.9rem;
	}
	.controls {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
		margin-top: 1rem;
	}
	.controls .primary {
		flex: 1;
		max-width: 16rem;
		margin: 0 auto;
	}
	.summary .score {
		font-size: 2rem;
		font-weight: 800;
		margin: 0;
	}
	.verdict {
		font-size: 1.2rem;
		font-weight: 700;
		margin: 0.25rem 0;
	}
	.pass {
		color: var(--correct);
	}
	.fail {
		color: var(--wrong);
	}
	.summary-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
	.review {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 1rem;
	}
	@media (min-width: 56rem) {
		.layout {
			grid-template-columns: 15rem 1fr;
			align-items: start;
		}
		.navigator {
			position: sticky;
			top: 1rem;
		}
	}
	@media (max-width: 40rem) {
		.controls {
			position: sticky;
			bottom: 0;
			margin: 1rem -0.75rem 0;
			padding: 0.6rem 0.75rem;
			background: var(--bg);
			border-top: 1px solid var(--border);
		}
		.top h1 {
			font-size: 1.25rem;
			width: 100%;
		}
		.controls button {
			padding: 0.45em 0.7em;
			white-space: nowrap;
		}
		/* Question first on phones; the navigator follows it. */
		.navigator {
			order: 2;
		}
	}
</style>
