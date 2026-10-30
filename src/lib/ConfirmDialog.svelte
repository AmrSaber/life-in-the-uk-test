<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		confirmLabel = 'Confirm',
		danger = false,
		confirmDisabled = false,
		onconfirm,
		children
	}: {
		open?: boolean;
		title: string;
		confirmLabel?: string;
		danger?: boolean;
		confirmDisabled?: boolean;
		onconfirm: () => void;
		children?: Snippet;
	} = $props();

	const titleId = $props.id();
	let dialog: HTMLDialogElement;

	$effect(() => {
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (confirmDisabled) return;
		open = false;
		onconfirm();
	}
</script>

<dialog bind:this={dialog} aria-labelledby={titleId} onclose={() => (open = false)}>
	<form onsubmit={submit}>
		<h2 id={titleId}>{title}</h2>
		{@render children?.()}
		<div class="actions">
			<button type="button" onclick={() => (open = false)}>Cancel</button>
			<button class={danger ? 'danger' : 'primary'} disabled={confirmDisabled}
				>{confirmLabel}</button
			>
		</div>
	</form>
</dialog>

<style>
	dialog {
		width: min(28rem, calc(100vw - 2rem));
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 50%);
	}
	h2 {
		margin-top: 0;
		font-size: 1.25rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}
</style>
