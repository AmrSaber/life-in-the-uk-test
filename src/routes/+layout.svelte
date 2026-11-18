<script lang="ts">
	import { resolve } from '$app/paths';
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { loadStored, setTheme, theme, type Theme } from '#lib/storage.svelte.ts';

	let { children } = $props();

	onMount(loadStored);

	// count.js records the first page load itself; count the in-app page changes after it.
	afterNavigate(({ type, to }) => {
		if (type !== 'enter' && to) window.goatcounter?.count?.({ path: to.url.pathname });
	});

	const links = [
		{ path: '/', label: 'Home' },
		{ path: '/bank', label: 'Question bank' },
		{ path: '/cheat-sheet', label: 'Cheat sheet' }
	] as const;
	const themes: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'auto', label: 'Auto' }
	];

	// Close open pop-up menus on outside clicks, like native menus.
	function closeMenus(e: MouseEvent) {
		for (const menu of document.querySelectorAll<HTMLDetailsElement>('details.menu[open]'))
			if (!menu.contains(e.target as Node)) menu.open = false;
	}

	const isCurrent = (path: (typeof links)[number]['path']) => page.url.pathname === resolve(path);
</script>

<svelte:document onclick={closeMenus} />

<a class="skip" href="#main">Skip to content</a>

<header>
	<div class="inner">
		<a class="title" href={resolve('/')}>Life in the UK practice</a>
		<nav aria-label="Main">
			{#each links as link (link.path)}
				<a href={resolve(link.path)} aria-current={isCurrent(link.path) ? 'page' : undefined}
					>{link.label}</a
				>
			{/each}
		</nav>
		<fieldset class="theme">
			<legend class="visually-hidden">Appearance</legend>
			{#each themes as t (t.value)}
				<label>
					<input
						type="radio"
						name="theme"
						value={t.value}
						checked={theme.value === t.value}
						onchange={() => setTheme(t.value)}
					/>
					{t.label}
				</label>
			{/each}
		</fieldset>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer>
	<div class="inner">
		<a
			class="github"
			href="https://github.com/AmrSaber/life-in-the-uk-test"
			target="_blank"
			rel="noopener"
		>
			<svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" fill="currentColor">
				<path
					d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
				/>
			</svg>
			GitHub
			<span class="visually-hidden">(opens in a new tab)</span>
		</a>
	</div>
</footer>

<style>
	.skip {
		position: absolute;
		left: 0.5rem;
		top: -3rem;
		padding: 0.5rem 1rem;
		background: var(--surface);
		border-radius: var(--radius);
		z-index: 10;
	}
	.skip:focus {
		top: 0.5rem;
	}
	header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
	}
	.inner {
		max-width: 64rem;
		margin: 0 auto;
		padding: 0.5rem 1rem;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 1.25rem;
	}
	.title {
		font-weight: 700;
		font-size: 1.15rem;
		color: var(--text);
		text-decoration: none;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		margin-right: auto;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1rem;
	}
	nav a {
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		text-decoration: none;
		color: var(--text);
		border-bottom: 3px solid transparent;
	}
	nav a:hover {
		color: var(--accent);
	}
	nav a[aria-current='page'] {
		border-bottom-color: var(--accent);
		font-weight: 600;
	}
	.theme {
		display: flex;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0;
		margin: 0;
		overflow: hidden;
	}
	.theme label {
		position: relative;
		padding: 0.3em 0.7em;
		min-height: 36px;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.theme input {
		position: absolute;
		opacity: 0;
		inset: 0;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}
	.theme label:has(input:checked) {
		background: var(--accent);
		color: var(--accent-text);
		font-weight: 600;
	}
	.theme label:has(input:focus-visible) {
		outline: 3px solid var(--focus);
		outline-offset: -3px;
	}
	footer {
		border-top: 1px solid var(--border);
		background: var(--surface);
	}
	.github {
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text);
		text-decoration: none;
	}
	.github:hover {
		color: var(--accent);
		text-decoration: underline;
	}
	main {
		max-width: 64rem;
		margin: 0 auto;
		padding: 1rem 1rem 6rem;
	}
	@media (max-width: 40rem) {
		.inner {
			padding: 0.25rem 0.75rem;
			gap: 0 0.5rem;
		}
		.title {
			font-size: 1rem;
		}
		.theme label {
			padding: 0.3em 0.5em;
			font-size: 0.85rem;
		}
		nav {
			order: 3;
			width: 100%;
			gap: 0 0.9rem;
			font-size: 0.95rem;
		}
		main {
			padding: 0.75rem 0.75rem 6rem;
		}
	}
</style>
