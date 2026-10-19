/** JSON for <script type="application/ld+json">: escapes "<" so data can never close the script tag */
export const toJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
