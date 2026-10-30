<script lang="ts">
	import cheatSheet from '../../../data/cheat-sheet.json';

	type Row = { term?: string; fact?: string; cells?: string[]; note?: string; questions: string[] };
	type Block = { kind: 'facts' | 'table'; title?: string; columns?: string[]; rows: Row[] };
	type Section = { id: string; title: string; blocks: Block[] };

	const sections = cheatSheet as Section[];
	const questionCount = (s: Section) =>
		new Set(s.blocks.flatMap((b) => b.rows.flatMap((r) => r.questions))).size;
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
			{#if block.kind === 'table'}
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								{#each block.columns ?? [] as col, c (c)}
									<th scope="col">{col}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each block.rows as row, r (r)}
								<tr>
									{#each row.cells ?? [] as cell, c (c)}
										{#if c === 0}<th scope="row">{cell}</th>{:else}<td
												data-label={block.columns?.[c]}>{cell}</td
											>{/if}
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<dl>
					{#each block.rows as row, r (r)}
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
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--surface);
		border: 1px solid var(--border);
	}
	th,
	td {
		text-align: left;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		vertical-align: top;
	}
	thead th {
		background: var(--surface-2);
	}
	@media (max-width: 40rem) {
		.row {
			grid-template-columns: 1fr;
		}
		/* Stack each table row as a card: "England: St George" lines under the row heading. */
		thead {
			display: none;
		}
		table,
		tbody,
		tr,
		th,
		td {
			display: block;
		}
		tr {
			border-top: 1px solid var(--border);
			padding: 0.5rem 0.75rem;
		}
		th,
		td {
			border: 0;
			padding: 0.1rem 0;
		}
		td::before {
			content: attr(data-label) ': ';
			color: var(--muted);
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
		th,
		td {
			padding: 0.2rem 0.5rem;
		}
		.row {
			break-inside: avoid;
		}
	}
</style>
