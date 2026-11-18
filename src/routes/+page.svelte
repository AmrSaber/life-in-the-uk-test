<script lang="ts">
	import { resolve } from '$app/paths';
	import { EXAM_MINUTES, PASS_MARK, exams, questions, topics } from '#lib/data.ts';
	import Seo from '#lib/Seo.svelte';
	import { SITE_NAME, SITE_URL } from '#lib/site.ts';

	const chapters = topics.filter((t) => !t.chapter);
</script>

<Seo
	bare
	title="Free Life in the UK Test Practice: Mock Exams and Questions"
	description="Practise for the Life in the UK test with {exams.length} timed mock exams, {questions.length} questions with explanations, and a revision cheat sheet. Free, with no sign-up."
	jsonLd={[{ '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/', inLanguage: 'en-GB' }]}
/>

<section class="intro">
	<h1>Life in the UK test practice exams</h1>
	<p>
		Practise for the Life in the UK test with timed exams, a searchable question bank and a revision
		cheat sheet. Every answer comes with an explanation, so you learn as you go. It's free, and you
		don't need to sign up.
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
				<a class="exam card" href={resolve('/exam/[id]', { id: exam.id })}>
					<span class="name">{exam.name}</span>
					<span class="muted">{exam.questions.length} questions</span>
				</a>
			</li>
		{/each}
	</ul>
</section>

<section aria-labelledby="topics-heading">
	<h2 id="topics-heading">Practise by topic</h2>
	<p class="muted">
		The questions follow the five chapters of the official handbook. Pick a chapter to see its
		questions and answers.
	</p>
	<ul class="topics">
		{#each chapters as t (t.id)}
			<li><a href={resolve('/topic/[slug]', { slug: t.slug })}>{t.label}</a></li>
		{/each}
	</ul>
</section>

<section aria-labelledby="about-heading">
	<h2 id="about-heading">About the Life in the UK test</h2>
	<p>
		The Life in the UK test is a computer-based test for people applying to settle in the UK or to
		become British citizens. It has 24 multiple-choice questions based on the official handbook,
		<em>Life in the UK: A Guide for New Residents</em>. You have {EXAM_MINUTES} minutes and need {PASS_MARK}
		correct answers (75%) to pass.
	</p>
	<p>
		All the questions here are based on questions and topics reported by people who took the real
		exam.
	</p>
	<p class="muted">
		This is an independent practice site. It isn't affiliated with the Home Office or the official
		test.
	</p>
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
	.topics {
		columns: 2 18rem;
		padding-left: 1.25rem;
	}
	.topics li {
		padding: 0.2rem 0;
	}
	.exam .muted {
		font-size: 0.9rem;
	}
	section + section,
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
