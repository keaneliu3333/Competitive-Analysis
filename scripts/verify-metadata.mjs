const { extractImageCandidates, extractTextSnippets, metadataFromCommerceUrl, pricesFromText } = await import("../server.mjs");

const failures = [];

function fail(message) {
  failures.push(message);
}

const sampleHtml = `
  <html>
    <head>
      <meta property="og:image" content="/images/hero.jpg" />
      <script type="application/json">{"salePrice":"3999"}</script>
    </head>
    <body>
      <img data-src="/images/detail-1.jpg" />
      <img srcset="/images/detail-2.jpg 1x, /images/detail-2@2x.jpg 2x" />
      <section>12000Pa 大吸力，热水洗拖布，自动集尘基站，支持 AI 避障。</section>
      <section>到手价 ￥3599，晒单返券后价格可能变化。</section>
    </body>
  </html>
`;

const images = extractImageCandidates(sampleHtml, "https://example.com/product/x1");
if (!images.includes("https://example.com/images/hero.jpg")) fail("metadata image should be converted to absolute URL");
if (!images.includes("https://example.com/images/detail-1.jpg")) fail("data-src detail image should be extracted");
if (!images.includes("https://example.com/images/detail-2.jpg")) fail("srcset detail image should be extracted");

const prices = pricesFromText(sampleHtml);
if (!prices.some((item) => item.price === 3599 && item.source === "text")) fail("visible CNY price should be extracted");
if (!prices.some((item) => item.price === 3999 && item.source === "embedded-json")) fail("embedded JSON price should be extracted");

const snippets = extractTextSnippets(sampleHtml);
if (!snippets.some((snippet) => snippet.includes("12000Pa") && snippet.includes("自动集尘基站"))) {
  fail("feature text snippet should include suction and base-station evidence");
}

const tmallMetadata = metadataFromCommerceUrl(
  "https://detail.tmall.com/item.htm?id=1018823558209&skuId=6048868585791&spm=a21n57.1.hoverItem.1",
);
if (tmallMetadata?.platform !== "天猫") fail("tmall URL fallback should identify the platform");
if (tmallMetadata?.itemId !== "1018823558209") fail("tmall URL fallback should preserve item id");
if (tmallMetadata?.skuId !== "6048868585791") fail("tmall URL fallback should preserve sku id");
if (!tmallMetadata?.textSnippets?.some((snippet) => snippet.includes("上传详情页截图或长图"))) {
  fail("tmall URL fallback should tell users to upload screenshots when dynamic details are blocked");
}

if (failures.length) {
  console.error("Metadata verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Metadata verification passed.");
