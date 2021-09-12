var set;

chrome.extension.onMessage.addListener(function (req, sender, sendResponse) {
  if (req.msg == "getStore") {
    store = getStore();
    sendResponse(store);
  }

  if (req.msg == "currentUser") {
    var r = $(".js-react-on-rails-component:eq(0)").text();
    r = JSON.parse(r);
    sendResponse(r.userId);
  }

  if (req.msg == "ajax") {
    window.postMessage(req, "*");

    set = setInterval(function () {
      if ($("body").attr("res")) {
        clearInterval(set);

        var res = $("body").attr("res");

        try {
          res = JSON.parse(res);
        } catch (e) {}

        sendResponse({ type: "ajaxResponse", data: res });

        $("body").attr("res", "");
      }
    }, 1000);
  }

  if (req.msg == "uploadListing") {
    var photos = req.item.files;
    var files = [];
    var count = 1;

    for (var p of photos) {
      async function createFile() {
        let response = await fetch(p);
        let data = await response.blob();
        let metadata = {
          type: "image/jpeg",
        };
        let file = new File([data], "img" + count + ".jpg", metadata);
        // ... do something with the file or return it

        files.push(file);
        count++;

        if (files.length >= photos.length) {
          req.item.files = files;
          window.postMessage(req, "*");
        }
      }
      createFile();
    }
  }

  return true;
});

$(".c-tabs__content:eq(0)").append(
  "<li> <a href='#' id='LaunchVinBot'> VinBot </a> </li>"
);

$(document).on("click", "#LaunchVinBot", function () {
  chrome.extension.sendMessage({ msg: "openPopup" });
});

var script = document.createElement("script");
script.src = chrome.extension.getURL("js/addAjax.js");

document.documentElement.appendChild(script);

/*


 var store = {};





function getStore(){
  var name = $(".Cell_title__1gULu:eq(0)").text();
  var image = $(".Cell_image__3kOWg img:eq(0)").attr("src");

  return {name:name,image:image};
}
*/
