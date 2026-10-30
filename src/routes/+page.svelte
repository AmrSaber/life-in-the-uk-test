<script lang="ts">
	import { resolve } from '$app/paths';
	import { EXAM_MINUTES, PASS_MARK, exams } from '#lib/data.ts';
</script>

<svelte:head>
	<title>Life in the UK practice exams</title>
</svelte:head>

<section class="intro">
	<h1>Life in the UK practice exams</h1>
	<p>
		Practise for the Life in the UK test with timed exams, a searchable question bank and a revision
		cheat sheet. Every answer comes with an explanation, so you learn as you go.
	</p>
	<p class="links">
		<a class="button" href={resolve('/bank')}>Browse the question bank</a>
		<a class="button" href={resolve('/bank?starred=1')}>Starred questions</a>
		<a class="button" href={resolve('/cheat-sheet')}>Cheat sheet</a>
	</p>
</section>

<section aria-labelledby="exams-heading">
	<h2 id="exams-heading">Practice exams</h2>
	<p class="muted">
		Each exam has {exams[0].questions.length} questions and {EXAM_MINUTES} minutes, like the real test.
		You need {PASS_MARK} correct answers to pass. Questions are shuffled every time.
	</p>
	<ul class="grid">
		{#each exams as exam (exam.id)}
			<li>
				<a class="exam card" href={resolve(`/exam?id=${exam.id}`)}>
					<span class="name">{exam.name}</span>
					<span class="muted">{exam.questions.length} questions</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

<aside class="notice card" aria-label="About your saved data">
	<strong>Your study data stays in this browser.</strong>
	Stars and saved exams are kept only in this browser on this device. They don't sync to other browsers
	or devices, and clearing your browser data removes them.
</aside>

<style>
	.intro p {
		max-width: 40rem;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
		gap: 0.75rem;
	}
	.exam {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		text-decoration: none;
		color: var(--text);
		min-height: 44px;
	}
	.exam:hover {
		border-color: var(--accent);
	}
	.name {
		font-weight: 700;
		font-size: 1.1rem;
	}
	.exam .muted {
		font-size: 0.9rem;
	}
	.notice {
		margin-top: 2rem;
		font-size: 0.95rem;
	}
	@media (max-width: 40rem) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
