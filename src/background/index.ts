// Background Service Worker

console.log('[Resource Sniffer] Background script loaded');

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Resource Sniffer] Extension installed');
});

// 监听来自 popup 或 content script 的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Resource Sniffer] Received message:', message.type);

  if (message.type === 'DOWNLOAD_FILE') {
    // 处理下载请求
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
    }).then(downloadId => {
      sendResponse({ success: true, downloadId });
    }).catch(error => {
      console.error('Download error:', error);
      sendResponse({ success: false, error: String(error) });
    });
    return true;
  }

  if (message.type === 'DOWNLOAD_BATCH') {
    // 处理批量下载请求
    downloadBatch(message.urls).then(result => {
      sendResponse(result);
    }).catch(error => {
      sendResponse({ success: false, error: String(error) });
    });
    return true;
  }

  return false;
});

/**
 * 批量下载文件
 */
async function downloadBatch(urls: string[]): Promise<{ success: boolean; downloaded: number }> {
  let downloaded = 0;

  for (const url of urls) {
    try {
      await chrome.downloads.download({ url });
      downloaded++;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to download ' + url + ':', error);
    }
  }

  return { success: true, downloaded };
}
