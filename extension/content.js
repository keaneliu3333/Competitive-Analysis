(() => {
  if (window.__cleanerCaptureContentLoaded) return;
  window.__cleanerCaptureContentLoaded = true;

  const pageInfo = () => ({
    title: document.title || "",
    url: location.href,
    scrollY: Math.max(0, Math.round(window.scrollY || document.documentElement.scrollTop || 0)),
    viewportHeight: Math.max(480, Math.round(window.innerHeight || document.documentElement.clientHeight || 900)),
    scrollHeight: Math.max(
      document.documentElement?.scrollHeight || 0,
      document.body?.scrollHeight || 0,
      window.innerHeight || 0,
    ),
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "CAPTURE_PAGE_INFO") {
      sendResponse(pageInfo());
      return true;
    }
    if (message?.type === "CAPTURE_SCROLL_TO") {
      const y = Math.max(0, Number(message.y || 0));
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
      window.setTimeout(() => sendResponse(pageInfo()), Number(message.waitMs || 650));
      return true;
    }
    return false;
  });
})();
