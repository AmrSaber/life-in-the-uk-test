<script lang="ts">
	/** The last item is the current page and has no link. */
	let { items }: { items: { name: string; href?: string }[] } = $props();
</script>

<nav class="crumbs muted" aria-label="Breadcrumb">
	<ol>
		{#each items as item, i (i)}
			<li aria-current={item.href ? undefined : 'page'}>
				{#if item.href}<a href={item.href}>{item.name}</a>{:else}{item.name}{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.crumbs {
		margin-bottom: 0.75rem;
		font-size: 0.95rem;
	}
	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.5rem;
	}
	li:not(:last-child)::after {
		content: '›';
		margin-left: 0.5rem;
	}
</style>
