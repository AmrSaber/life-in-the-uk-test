<script lang="ts">
	import { stars, toggleStar } from './storage.svelte.ts';

	let { id }: { id: string } = $props();
	const starred = $derived(stars.has(id));
</script>

<button
	type="button"
	class="star"
	class:on={starred}
	aria-pressed={starred}
	onclick={() => toggleStar(id)}
>
	<span aria-hidden="true">{starred ? '★' : '☆'}</span>
	{starred ? 'Starred' : 'Star'}
</button>

<style>
	.star {
		min-width: 6.5rem;
	}
	.star span {
		font-size: 1.2em;
		line-height: 1;
	}
	.on {
		color: var(--star);
		border-color: var(--star);
	}
</style>
