export const SITE_URL = 'https://lifeinuktest.net';
export const SITE_NAME = 'Life in the UK practice';

/** Shorten text to a limit on a word boundary, for titles and descriptions. */
export function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return text.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** Schema.org breadcrumb trail; each path is a site path such as "/topic/x" ("/" is home). */
export function breadcrumbs(items: { name: string; path: string }[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: SITE_URL + (item.path === '/' ? '/' : item.path)
		}))
	};
}
