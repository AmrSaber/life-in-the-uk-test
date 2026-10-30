<script lang="ts">
	import { tagGroups, tagName } from './data.ts';

	let { tags = $bindable([]), matchAll = $bindable(false) }: { tags: string[]; matchAll: boolean } =
		$props();

	function toggle(tag: string) {
		tags = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
	}
</script>

<details class="tag-filter">
	<summary>Tags{tags.length ? ` (${tags.length} selected)` : ''}</summary>
	<div class="panel">
		<div class="panel-top">
			<label class="check">
				<input type="checkbox" bind:checked={matchAll} />
				Match all
			</label>
			<button type="button" disabled={!tags.length} onclick={() => (tags = [])}>Clear tags</button>
		</div>
		<p class="muted note">
			{matchAll
				? 'Showing questions that have every selected tag.'
				: 'Showing questions that have any selected tag.'}
		</p>
		<div class="groups">
			{#each tagGroups as [first, ...rest] (first)}
				<ul>
					{#each [first, ...rest] as tag, i (tag)}
						<li class:sub={i > 0 && rest.length > 0 && first.startsWith('ch')}>
							<label class="check">
								<input type="checkbox" checked={tags.includes(tag)} onchange={() => toggle(tag)} />
								{tagName(tag)}
							</label>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	</div>
</details>

<style>
	summary {
		cursor: pointer;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		padding: 0 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-weight: 600;
	}
	.tag-filter[open] summary {
		border-color: var(--accent);
	}
	.panel {
		margin-top: 0.5rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.panel-top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.note {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
	}
	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: 0.5rem 1.5rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li:first-child {
		font-weight: 600;
	}
	.sub {
		padding-left: 1.5rem;
	}
	.check {
		min-height: 40px;
		align-items: flex-start;
		padding-top: 0.5rem;
	}
	.check input {
		margin-top: 0.15em;
	}
</style>
