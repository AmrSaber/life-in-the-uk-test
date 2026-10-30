<script lang="ts">
	import cheatSheet from '../../../data/cheat-sheet.json';

	type Row = { term: string; fact: string; note?: string; questions: string[] };
	type Card = { title: string; rows: Row[] };
	type Block = { kind: 'facts' | 'cards'; title?: string; rows?: Row[]; cards?: Card[] };
	type Section = { id: string; title: string; blocks: Block[] };

	const sections = cheatSheet as Section[];
	const blockRows = (b: Block) => b.rows ?? b.cards!.flatMap((c) => c.rows);
	const questionCount = (s: Section) =>
		new Set(s.blocks.flatMap((b) => blockRows(b).flatMap((r) => r.questions))).size;
</script>

<svelte:head>
	<title>Cheat sheet · Life in the UK practice</title>
</svelte:head>

<h1>Cheat sheet</h1>
<p class="intro muted">
	The facts tested by the practice questions, grouped by topic for quick revision.
	<button type="button" class="print" onclick={() => window.print()}>Print</button>
</p>

<nav class="toc card" aria-label="Sections">
	<ol>
		{#each sections as s (s.id)}
			<li><a href="#{s.id}">{s.title}</a></li>
		{/each}
	</ol>
</nav>

{#each sections as s (s.id)}
	<section id={s.id} aria-labelledby="{s.id}-heading">
		<h2 id="{s.id}-heading">
			{s.title} <span class="count muted">{questionCount(s)} questions</span>
		</h2>
		{#each s.blocks as block, i (i)}
			{#if block.title}<h3>{block.title}</h3>{/if}
			{#if block.kind === 'cards'}
				<ul class="cards">
					{#each block.cards ?? [] as card (card.title)}
						<li class="card">
							<h3>{card.title}</h3>
							<dl class="card-rows">
								{#each card.rows as row (row.term)}
									<dt class="muted">{row.term}</dt>
									<dd>{row.fact}</dd>
								{/each}
							</dl>
						</li>
					{/each}
				</ul>
			{:else}
				<dl>
					{#each block.rows ?? [] as row, r (r)}
						<div class="row">
							<dt>{row.term}</dt>
							<dd>
								{row.fact}
								{#if row.note}<span class="note">{row.note}</span>{/if}
							</dd>
						</div>
					{/each}
				</dl>
			{/if}
		{/each}
	</section>
{/each}

<style>
	.intro {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.25rem;
		columns: 2 14rem;
	}
	.toc li {
		padding: 0.15rem 0;
	}
	section {
		margin-top: 2rem;
		scroll-margin-top: 1rem;
	}
	h2 {
		border-bottom: 2px solid var(--accent);
		padding-bottom: 0.25rem;
	}
	.count {
		font-size: 0.85rem;
		font-weight: 400;
	}
	h3 {
		font-size: 1.05rem;
		margin: 1.25rem 0 0.5rem;
	}
	dl {
		margin: 0;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}
	.row {
		display: grid;
		grid-template-columns: minmax(7rem, 14rem) 1fr;
		gap: 0.25rem 1rem;
		padding: 0.5rem 0.75rem;
		border-top: 1px solid var(--border);
	}
	.row:first-child {
		border-top: 0;
	}
	dt {
		font-weight: 700;
	}
	dd {
		margin: 0;
	}
	.note {
		display: block;
		font-size: 0.9rem;
		color: var(--muted);
		font-style: italic;
	}
	.cards {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 0.75rem;
	}
	.cards h3 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
	}
	.card-rows {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.3rem 0.75rem;
		border: 0;
		background: none;
	}
	.card-rows dt {
		font-weight: 400;
		font-size: 0.9rem;
	}
	.card-rows dd {
		font-weight: 700;
	}
	@media (max-width: 40rem) {
		.row {
			grid-template-columns: 1fr;
		}
	}
	@media print {
		.print,
		.toc,
		:global(header),
		:global(.skip) {
			display: none;
		}
		h2,
		h3 {
			break-after: avoid;
		}
		/* Denser layout on paper so the sheet stays a few pages long. */
		:global(body) {
			font-size: 10pt;
			line-height: 1.35;
		}
		:global(main) {
			padding: 0;
		}
		section {
			margin-top: 1rem;
		}
		.row {
			padding: 0.2rem 0.5rem;
		}
		.row,
		.cards li {
			break-inside: avoid;
		}
	}
</style>
