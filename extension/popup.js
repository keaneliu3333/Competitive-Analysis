const button = document.querySelector("#capture");
const statusEl = document.querySelector("#status");

function setStatus(message) {
  statusEl.textContent = message;
}

button.addEventListener("click", () => {
  button.disabled = true;
  setStatus("正在准备截图...");
  const port = chrome.runtime.connect({ name: "capture" });
  port.onMessage.addListener((message) => {
    if (message.type === "progress") setStatus(message.message);
    if (message.type === "done") {
      setStatus(message.message || "提交完成，请回到工作台。");
      button.disabled = false;
    }
    if (message.type === "error") {
      setStatus(`失败：${message.message}`);
      button.disabled = false;
    }
  });
  port.postMessage({ type: "start" });
});
