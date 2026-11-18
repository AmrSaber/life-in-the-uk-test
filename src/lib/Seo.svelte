<script lang="ts">
	import { page } from '$app/state';
	import { SITE_NAME, SITE_URL } from '#lib/site.ts';

	let {
		title,
		description,
		bare = false,
		noindex = false,
		jsonLd = []
	}: {
		title: string;
		description: string;
		/** Use the title as is, without the site name suffix. */
		bare?: boolean;
		noindex?: boolean;
		jsonLd?: object[];
	} = $props();

	const fullTitle = $derived(bare ? title : `${title} · ${SITE_NAME}`);
	// The query string is left out: every view of a page shares one canonical URL.
	// The site is served from the domain root, so the pathname is the site path.
	const url = $derived(SITE_URL + page.url.pathname);
	const image = `${SITE_URL}/og.png`;
	// "<" is escaped so data can't close the script element.
	const ld = $derived(
		jsonLd.map(
			(d) =>
				`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...d }).replaceAll('<', '\\u003c')}<\/script>`
		)
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	{#if noindex}<meta name="robots" content="noindex" />{/if}
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_GB" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	{#each ld as tag (tag)}{@html tag}{/each}
</svelte:head>
