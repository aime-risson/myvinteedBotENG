




/*
(function() {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {

        this.addEventListener('load', function() {
           if(this.responseURL && this.responseURL.match(/identity\.ticketmaster\.com\/json\/user/gi)){
             var t = JSON.parse(this.responseText);
             var o = {type:"getUser",data:t};
               window.postMessage(o,"*");
          }
        });
        origOpen.apply(this, arguments);
    };
})();
*/
