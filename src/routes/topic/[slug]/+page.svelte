<script lang="ts">
	import { resolve } from '$app/paths';
	import { exams, questionsForTopic, sectionsOf } from '#lib/data.ts';
	import Seo from '#lib/Seo.svelte';
	import { breadcrumbs, truncate } from '#lib/site.ts';

	let { data } = $props();
	const topic = $derived(data.topic);
	const list = $derived(questionsForTopic(topic));
	const sections = $derived(topic.chapter ? [] : sectionsOf(topic));
	const description = $derived(
		truncate(
			`${list.length} Life in the UK test practice questions on ${topic.name}, each with the correct answer and an explanation.`,
			160
		)
	);
</script>

<Seo
	bare
	title="{topic.name}: Life in the UK test questions"
	{description}
	jsonLd={[
		breadcrumbs([
			{ name: 'Home', path: '/' },
			{ name: 'Question bank', path: '/bank' },
			{ name: topic.name, path: `/topic/${topic.slug}` }
		])
	]}
/>

<h1>{topic.label}: Life in the UK test questions</h1>
<p>
	{list.length} practice questions on {topic.name.toLowerCase()}. Open a question to see the correct
	answer and why it is right.
</p>

{#if sections.length}
	<h2>Sections</h2>
	<ul>
		{#each sections as s (s.id)}
			<li>
				{#if s.page}<a href={resolve('/topic/[slug]', { slug: s.page.slug })}>{s.label}</a
					>{:else}{s.label}{/if}
			</li>
		{/each}
	</ul>
{/if}

<h2>Questions</h2>
<ol class="questions">
	{#each list as q (q.id)}
		<li><a href={resolve('/question/[id]', { id: q.id })}>{q.question}</a></li>
	{/each}
</ol>

<p>
	<a class="button primary" href={resolve('/exam/[id]', { id: exams[0].id })}
		>Take a practice exam</a
	>
	<a class="button" href={resolve('/cheat-sheet')}>Cheat sheet</a>
</p>

<style>
	.questions li {
		padding: 0.15rem 0;
	}
</style>
