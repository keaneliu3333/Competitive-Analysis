const { extractImageCandidates, extractTextSnippets, fetchRemoteImageDataUrls, metadataFromCommerceUrl, pricesFromText } = await import("../server.mjs");

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
      <img data-original-src="/images/detail-lazy.jpg" />
      <img data-ks-lazyload="/images/detail-ks.jpg" />
      <img data-lazy-src="&#47;&#47;cdn.example.com/images/entity-image.png" />
      <img srcset="/images/detail-2.jpg 1x, /images/detail-2@2x.jpg 2x" />
      <section>12000Pa 大吸力，热水洗拖布，自动集尘基站，支持 AI 避障。</section>
      <section>到手价 ￥3599，晒单返券后价格可能变化。</section>
    </body>
  </html>
`;

const images = extractImageCandidates(sampleHtml, "https://example.com/product/x1");
if (!images.includes("https://example.com/images/hero.jpg")) fail("metadata image should be converted to absolute URL");
if (!images.includes("https://example.com/images/detail-1.jpg")) fail("data-src detail image should be extracted");
if (!images.includes("https://example.com/images/detail-lazy.jpg")) fail("data-original-src detail image should be extracted");
if (!images.includes("https://example.com/images/detail-ks.jpg")) fail("data-ks-lazyload detail image should be extracted");
if (!images.includes("https://cdn.example.com/images/entity-image.png")) fail("HTML entity image URL should be decoded");
if (!images.includes("https://example.com/images/detail-2.jpg")) fail("srcset detail image should be extracted");

const productImageHtml = `
  <html>
    <body>
      <img class="site-logo" width="48" height="48" src="/logo.png" />
      <img class="coupon-banner" width="750" height="120" src="/coupon.png" />
      <img class="sku-main product-gallery" width="800" height="800" alt="商品主图 扫地机 X1" src="/product-main.jpg" />
      <img class="product-gallery-thumb" width="360" height="360" src="/product-thumb.jpg" />
    </body>
  </html>
`;
const productImages = extractImageCandidates(productImageHtml, "https://example.com/product/x1");
if (productImages[0] !== "https://example.com/product-main.jpg") fail("first image candidate should prefer the product main image");

const prices = pricesFromText(sampleHtml);
if (!prices.some((item) => item.price === 3599 && item.source === "text")) fail("visible CNY price should be extracted");
if (!prices.some((item) => item.price === 3999 && item.source === "embedded-json")) fail("embedded JSON price should be extracted");

const snippets = extractTextSnippets(sampleHtml);
if (!snippets.some((snippet) => snippet.includes("12000Pa") && snippet.includes("自动集尘基站"))) {
  fail("feature text snippet should include suction and base-station evidence");
}

function pngHeader(width, height) {
  const header = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write("IHDR", 12, "ascii");
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  header[24] = 8;
  header[25] = 2;
  return header;
}
const largePng = pngHeader(800, 600);
const smallPng = pngHeader(120, 120);
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  if (url === "https://cdn.example.com/product-main.png") {
    return new Response(largePng, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(largePng.length),
      },
    });
  }
  if (url === "https://cdn.example.com/product-thumb.png") {
    return new Response(smallPng, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(smallPng.length),
      },
    });
  }
  return new Response("missing", { status: 404 });
};
try {
  const imageFetch = await fetchRemoteImageDataUrls(["https://cdn.example.com/product-main.png"], {
    referer: "https://example.com/product/x1",
  });
  if (imageFetch.dataUrls.length !== 1) fail("remote detail image should be downloaded as data URL");
  if (!imageFetch.dataUrls[0]?.startsWith("data:image/png;base64,")) fail("downloaded detail image should keep image MIME type");
  if (imageFetch.fetchedUrls.length !== 1) fail("downloaded detail image should record fetched source URL");
  if (imageFetch.fetchedDimensions[0]?.width !== 800 || imageFetch.fetchedDimensions[0]?.height !== 600) {
    fail("downloaded detail image should record dimensions");
  }
  const smallImageFetch = await fetchRemoteImageDataUrls(["https://cdn.example.com/product-thumb.png"], {
    referer: "https://example.com/product/x1",
  });
  if (smallImageFetch.dataUrls.length !== 0) fail("small remote detail image should be skipped before vision analysis");
  if (!smallImageFetch.warnings.some((warning) => warning.includes("图片尺寸太小"))) {
    fail("small remote detail image should report a size warning");
  }
} finally {
  globalThis.fetch = originalFetch;
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

const jdMetadata = metadataFromCommerceUrl("https://item.jd.com/100138985587.html");
if (jdMetadata?.platform !== "京东") fail("jd URL fallback should identify the platform");
if (jdMetadata?.itemId !== "100138985587") fail("jd URL fallback should parse item id from path");
if (jdMetadata?.canonicalUrl !== "https://item.jd.com/100138985587.html") fail("jd URL fallback should keep canonical item URL");

const pddMetadata = metadataFromCommerceUrl("https://mobile.yangkeduo.com/goods.html?goods_id=123456789");
if (pddMetadata?.platform !== "拼多多") fail("pdd URL fallback should identify the platform");
if (pddMetadata?.itemId !== "123456789") fail("pdd URL fallback should parse goods_id");
if (!pddMetadata?.fetchWarning?.includes("动态加载")) fail("pdd URL fallback should warn about dynamic loading");

if (failures.length) {
  console.error("Metadata verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Metadata verification passed.");
