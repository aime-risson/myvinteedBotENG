
 var popup = chrome.extension.getURL("src/browser_action/browser_action.html");

    if(!document.querySelector("#tmIframe")){

        var iframe = document.createElement("iframe");
             iframe.src = popup;
             iframe.style ='position:fixed; display:block; border-radius:4px; box-shadow:0 3px 10px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12);  width:440px; overflow:auto;border:1px solid #ddd; height:98%; z-index:99999999999999999999999999999999999999999999999; top:5px; right:20px';
             iframe.id = "tmIframe";

             document.body.appendChild(iframe);

	}
	else {
	   document.body.removeChild(document.querySelector("#tmIframe"));
	}
