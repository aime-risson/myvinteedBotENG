
window.customAjax = function(req,callback){
  var del = false;
 if(req.method.match(":delete")){
   req.method = "get";
   del = true;
 }
  $.ajax({
  method:req.method,
  url:req.url,
  data:req.data,
  headers:{'content-type':'application/json'},
  success:function(res){
     callback(res);

     if(del){
       var div = $("<div/>").html(res);
       var url = div.find("form").attr("action");
       var token = div.find("input[name='authenticity_token']").val();

       $.ajax({
         method:"post",
         url:url,
         data:{
           authenticity_token:token,
           commit: "Confirm and delete"
         }
       })

     }
  }
})

}


window.addEventListener("message",function(e){
  if(e.data && e.data.msg){
    var req = e.data;

     if(req.msg == "ajax"){
       window.customAjax(req,function(res){
          $("body").attr("res",JSON.stringify(res));
       });
     }

     if(req.msg == "uploadListing"){
       startUploadingProcess(req.item);
     }
  }
})



function startUploadingProcess(item){

     $.get("/items/new",function(res){
       var tempId = $("<div/>").html(res).find('[data-component-name="ItemUpload"]').text();
           tempId = JSON.parse(tempId).tempUuid;

           item.assigned_photos = [];

           for(var f of item.files){

            var fr = new FormData();
                fr.append("photo[type]","item");
                fr.append("photo[file]",f);
                fr.append("photo[temp_uuid]",tempId);



                $.ajax({
                  method:"post",
                  url:"/api/v2/photos",
                  data:fr,
                  cache: false,
                  processData: false,
                  contentType: false,
                  success:function(res){

                     item.assigned_photos.push({id:res.id,orientation:false});

                       if(item.assigned_photos.length>=item.files.length){
                         item.files = [];
                         item.id = null;
                         $.ajax({
                           method:"post",
                           url:"/api/v2/items",
                           data:JSON.stringify({item:item}),
                           headers:{'content-type':'application/json'}
                         })
                       }
                  }
                })

           }
     })

}
