<script lang="ts">
	import { resolve } from '$app/paths';
	import { answerText, examsWith, questions, topicOf, trailOf, type Question } from '#lib/data.ts';
	import Breadcrumb from '#lib/Breadcrumb.svelte';
	import QuestionCard from '#lib/QuestionCard.svelte';
	import Seo from '#lib/Seo.svelte';
	import { SITE_URL, breadcrumbs, truncate } from '#lib/site.ts';

	let { data } = $props();
	const q: Question = $derived(data.question);
	const topic = $derived(topicOf(q));
	const related = $derived(
		questions.filter((x) => x.id !== q.id && topic && topicOf(x) === topic).slice(0, 5)
	);
	const exams = $derived(examsWith(q));
	const description = $derived(truncate(`Answer: ${answerText(q)}. ${q.explanation}`, 160));
	const path = $derived(`/question/${q.id}`);
	const crumbs = $derived([
		{ name: 'Home', path: '/' },
		{ name: 'Question bank', path: '/bank' },
		...(topic ? trailOf(topic) : []).map((t) => ({ name: t.name, path: `/topic/${t.slug}` })),
		{ name: q.question, path }
	]);
</script>

<Seo
	title={truncate(q.question, 70)}
	{description}
	jsonLd={[
		breadcrumbs(crumbs),
		{
			'@type': 'Question',
			'@id': SITE_URL + path,
			name: q.question,
			text: q.question,
			acceptedAnswer: { '@type': 'Answer', text: `${answerText(q)}. ${q.explanation}` }
		}
	]}
/>

<Breadcrumb
	items={[
		{ name: 'Question bank', href: resolve('/bank') },
		...(topic ? trailOf(topic) : []).map((t) => ({
			name: t.name,
			href: resolve('/topic/[slug]', { slug: t.slug })
		}))
	]}
/>

<QuestionCard question={q} mode="reveal" h1 expanded />

<section class="more">
	<p>
		<a class="button primary" href={resolve('/exam/[id]', { id: exams[0].id })}
			>Take a practice exam</a
		>
		<a class="button" href={resolve('/bank')}>Browse the question bank</a>
	</p>
	{#if exams.length}
		<p class="muted">
			This question is in
			{#each exams as e, i (e.id)}{i ? ', ' : ''}<a href={resolve('/exam/[id]', { id: e.id })}
					>{e.name}</a
				>{/each}.
		</p>
	{/if}
	{#if related.length}
		<h2>More questions on {topic?.name}</h2>
		<ul>
			{#each related as r (r.id)}
				<li><a href={resolve('/question/[id]', { id: r.id })}>{r.question}</a></li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.more {
		margin-top: 1.5rem;
	}
</style>
