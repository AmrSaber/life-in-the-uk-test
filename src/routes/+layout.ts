// Every route prerenders to static HTML that crawlers can read. Saved data (stars, exams, theme)
// only exists in the browser, so pages read it after mount (see loadStored).
export const prerender = true;
