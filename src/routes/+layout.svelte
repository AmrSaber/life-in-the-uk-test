<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { setTheme, theme, type Theme } from '#lib/storage.svelte.ts';

	let { children } = $props();

	const links = [
		{ href: '/bank', label: 'Question bank' },
		{ href: '/bank?starred=1', label: 'Starred questions' },
		{ href: '/cheat-sheet', label: 'Cheat sheet' }
	];
	const themes: { value: Theme; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'auto', label: 'Auto' }
	];

	const isCurrent = (href: string) => {
		const [path, query] = href.split('?');
		return page.url.pathname === path && page.url.search === (query ? `?${query}` : '');
	};
</script>

<a class="skip" href="#main">Skip to content</a>

<header>
	<div class="inner">
		<a class="title" href="/">Life in the UK practice</a>
		<nav aria-label="Main">
			{#each links as link (link.href)}
				<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a
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
