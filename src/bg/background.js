// localStorage.endpoint = endpoint;

// chrome.storage.local.set({ endpoint: endpoint });

chrome.browserAction.onClicked.addListener(function () {
  openPopup();
});

chrome.extension.onMessage.addListener(function (req, sender, sendResponse) {
  if (req.msg == "ajax") {
    $.ajax({
      method: req.type,
      url: req.url,
      data: req.data,
      success: function (res) {
        var d = this.data;
        d = d.split("&")[0].split("=")[1];
        d = decodeURIComponent(d);

        sendResponse({ res: res, url: d });
      },
    });
  }

  if (req.msg == "openPopup") {
    openPopup();
  }
});

function openPopup() {
  chrome.tabs.executeScript({ file: "js/slider.js" }, function () {});
}
