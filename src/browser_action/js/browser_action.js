var app = angular.module("myapp", []);

app.controller("ctrl", function ($scope, $http, $q, $filter, $interval) {
  toastr.options.positionClass = "toast-bottom-right";

  var baseurl = localStorage.endpoint;
  $scope.baseurl = baseurl;
  $scope.page = "login";
  $scope.s = {};
  $scope.settings = {
    message:
      "Hello, ton dressing est top ! En ce moment j’ai des vêtements en super état, de qualité et de belles marques (Levi's, Zara, Vintage...) ! Prix très intéressants et négociation évidemment possible !",
  };
  var set;

  var tab = {};

  var bg = chrome.extension.getBackgroundPage();

  $scope.ajax = function (d) {
    var defer = $q.defer();
    $http({
      method: "post",
      url: baseurl + "master.php",
      data: $.param(d),
      headers: { "content-type": "application/x-www-form-urlencoded" },
    }).then(function (res) {
      defer.resolve(res.data);
    });

    return defer.promise;
  };

  $scope.getSettings = function () {
    try {
      $scope.settings = JSON.parse(localStorage.settings);
    } catch (e) {}
  };

  $scope.getSettings();

  $scope.saveSettings = function () {
    localStorage.settings = angular.toJson($scope.settings);
  };

  $scope.ajax2 = function (path, d, method, cpath) {
    var defer = $q.defer();
    var url = vintedEndpoint + "api/v2/" + path;

    if (cpath) {
      url = path;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        msg: "ajax",
        url: url,
        method: method || "POST",
        data: angular.toJson(d),
      },
      function (res) {
        $scope.$apply(function () {
          defer.resolve(res);
        });
      }
    );

    return defer.promise;
  };

  $scope.closePopup = function () {
    chrome.extension.sendMessage({ msg: "openPopup" });
  };

  var vintedEndpoint = "";

  $scope.getStoreInfo = function () {
    $http
      .get(
        vintedEndpoint + "api/v2/users/" + $scope.s.storeId + "?localize=false"
      )
      .then(function (res) {
        $scope.s.store = res.data.user;

        console.log($scope.s);
      });
  };

  $scope.followStoreCustomers = function () {
    var customers = [];

    $scope.s.status = "Getting Customers...";

    var page = 1;
    (function s2() {
      $http
        .get(
          vintedEndpoint +
            "api/v2/feedbacks?user_id=" +
            $scope.s.storeId +
            "&page=" +
            page

        )
        .then(function (res) {
          res = res.data;
          var items = res.user_feedbacks;
          customers = customers.concat(items);

          var p = [];

          $scope.s.status =
            "Getting Customers " +
            customers.length +
            " of " +
            res.pagination.total_entries;

          console.log(customers);

          for (var x of items) {
            if (!x.user) {
              x.user = {};
            }
            if (!x.user.is_favourite) {
              p.push(x.user.id);
            }
          }

          var o = {
            type: "user",
            user_favourites: p,
          };

          if (customers.length < res.pagination.total_entries) {
            page++;
            s2();
          } else {
            toastr.success("Successfully finished.");

            $scope.s.status = "";
          }

          $scope.ajax2("user_favourites/toggle", o).then(function (res) {});
        });
    })();
  };

  $scope.followStoreProducts = function (type) {
    var defer = $q.defer();
    var products = [];
    var sold = 0;

    $scope.s.status = "Getting products...";
    var page = 1;
    (function s1() {
      $http
        .get(
          vintedEndpoint +
            "api/v2/users/" +
            $scope.s.storeId +
            "/items?" +
            "page=" +
            page +

            "&order=relevance&currency=EUR"
        )
        .then(function (res) {
          res = res.data;
          var items = res.items;
          console.log("items : ", items);

          // products = products.concat(items);
          items.forEach((x, i) => {
            if (x.is_visible == 1 && x.promoted == false) {
              console.log(x);
              products.push(x);
            }
            else {
              sold++
            }
          });

          var p = [];

          $scope.s.status =
            "Getting Products " +
            products.length +
            " of " +
            res.pagination.total_entries;

          for (var x of items) {
            if (!x.is_favourite) {
              p.push(x.id);
            }
          }

          console.log("items fav :", items)

          var o = {
            type: "item",
            user_favourites: p,
          };

          if ((products.length + sold) < res.pagination.total_entries) {
            page++;
            s1();
          } else {
            if (type == "products") {

              console.log("products to push: ", products);
              defer.resolve(products);
            } else {
              toastr.success("Successfully finished.");
            }
            $scope.s.status = "";
          }
          if (type != "products") {
            $scope.ajax2("user_favourites/toggle", o).then(function (res) {});
          }
        });
    })();

    return defer.promise;
  };

  $scope.unfollowEveryOne = function () {
    $scope.followStoreFollowers("unfollow");
  };

  $scope.messageAllFollowers = function () {
    $scope.followStoreFollowers("followers").then(function (res) {
      var count = 0;

      $interval.cancel(set);

      set = $interval(function () {
        $scope.messageStore(res[count]);
        count++;

        $scope.s.status = "Messages sent (" + count + " of " + res.length + ")";

        if (count >= res.length) {
          $interval.cancel(set);
        }
      }, 500);
    });
  };

  $scope.unfavouriteEverything = function () {
    var favourites = [];

    $scope.s.status = "Getting favourites...";
    var page = 1;
    (function s1() {
      $http
        .get(
          vintedEndpoint +
            "api/v2/users/" +
            $scope.s.storeId +
            "/items/favourites?page=" +
            page +
            "&include_sold=true"
        )
        .then(function (res) {
          res = res.data;
          var items = res.items;
          favourites = favourites.concat(items);

          var p = [];

          $scope.s.status =
            "Getting favourites " +
            favourites.length +
            " of " +
            res.pagination.total_entries;

          for (var x of items) {
            if (x.is_favourite) {
              p.push(x.id);
            }
          }

          var o = {
            type: "item",
            user_favourites: p,
          };

          if (favourites.length < res.pagination.total_entries || page < 5) {
            page++;
            s1();
          } else {
            toastr.success("Successfully finished.");
            $scope.s.status = "";
          }

          $scope.ajax2("user_favourites/toggle", o).then(function (res) {});
        });
    })();
  };

  $scope.createFile = function (item) {
    var defer = $q.defer();
    var photos = [];
    var count = 1;

    for (var c of item.photos) {
      async function createFile() {
        let response = await fetch(c.full_size_url);
        let data = await response.blob();
        let metadata = {
          type: "image/jpeg",
        };
        let file = new File([data], "img" + count + ".jpg", metadata);
        var url = URL.createObjectURL(file);

        photos.push(url);

        count++;
        if (photos.length >= item.photos.length) {
          item.files = photos;
          defer.resolve(item);
        }
      }
      createFile();
    }
    return defer.promise;
  };

  $scope.uploadListing = function (item) {
    item.price = item.price_numeric;
    item.color_ids = [];
    //  item.assigned_photos = [];

    /*
          for(var img of item.photos){
            item.assigned_photos.push({id:img.id,orientation:0});
          } */

    for (var key of Object.keys(item)) {
      if (key.match(/color\d+_\id/gi)) {
        item.color_ids.push(item[key]);
      }
    }

    // if (item.is_reserved == 0 && item.) {
    //
    // }
    $scope.createFile(item).then(function (item) {
      //console.log(item);

      chrome.tabs.sendMessage(tab.id, { msg: "uploadListing", item: item });
    });

    $scope.deleteListing(item).then(function (item) {
      $scope.ajax2("items", { item: item }).then(function () {});
    });
  };

  $scope.deleteListing = function (item) {
    var defer = $q.defer();

    $scope
      .ajax2(
        vintedEndpoint +
          "items/" +
          item.id +
          "/item_deletion_confirmation/new?ref_url=%2Fmember%2F" +
          $scope.s.storeId,
        {},
        "GET:delete",
        true
      )
      .then(function (res) {
        defer.resolve(item);
      });

    return defer.promise;
  };

  $scope.bumpAllListings = function () {
    $scope.followStoreProducts("products").then(function (res) {
      var count = 0;

      $scope.s.status = "Bumping...";

      $interval.cancel(set);

      set = $interval(function () {
        $scope.uploadListing(res[count]);

        count++;

        $scope.s.status = "Bumped (" + count + " of " + res.length + ")";

        if (count >= res.length) {
          $interval.cancel(set);
        }
      }, 5000);
    });
  };

  $scope.followStoreFollowers = function (type) {
    var defer = $q.defer();
    var mb = "followers";

    if (type == "unfollow") {
      mb = "following";
    }

    var url = vintedEndpoint + "member/general/" + mb + "/" + $scope.s.storeId;
    var page = 1;
    var allFollowers = [];

    $scope.s.status = "Getting Followers...";

    (function s() {
      $http.get(url + "?page=" + page).then(function (res) {
        var div = $("<div/>").html(res.data);
        var items = div.find(".follow");
        var p = [];

        items.each(function () {
          var member = $(this).find("a:eq(0)").attr("href");
          member = member.split("/")[2].split("-")[0];

          var login = $(this).find("a:eq(1)").text();

          var oo = {
            id: member,
            login: login,
          };

          if (type == "unfollow") {
            if ($(this).find("a[data-state='true']").length) {
              p.push(oo);
            }
          } else {
            p.push(oo);
          }
        });

        allFollowers = allFollowers.concat(p);

        $scope.s.status = "Getting Followers " + allFollowers.length;

        var p2 = [];

        for (var pp of p) {
          p2.push(pp.id);
        }

        var o = {
          type: "user",
          user_favourites: p2,
        };

        if (items.length == 30) {
          page++;
          s();
        } else {
          if (type == "followers") {
            defer.resolve(allFollowers);
          } else {
            toastr.success("Successfully finished");
          }
          $scope.s.status = "";
        }

        if (type != "followers") {
          $scope.ajax2("user_favourites/toggle", o).then(function (res) {});
        }
      });
    })();

    return defer.promise;
  };

  $scope.followStore = function () {
    var o = {
      type: "user",
      user_favourites: [$scope.s.storeId],
    };

    $scope.ajax2("user_favourites/toggle", o).then(function (res) {
      toastr.success("Successfully followed");
      $scope.s.store.is_favourite = true;
    });
  };

  $scope.messageStore = function (user) {
    var message = $scope.settings.message;

    var name = user.real_name || user.login;
    user.first_name = name.split(" ")[0];

    message = message.replace(/\{\{first_name\}\}/gi, user.first_name);

    var o = {
      body: message,
      photo_temp_uuids: [],
      recipient_id: user.id,
    };

    $scope
      .ajax2("users/" + $scope.s.loggedInUserId + "/msg_threads", o)
      .then(function (res) {
        if (user.profile_url) {
          toastr.success("Message sent Successfully");
        }
      });
  };

  chrome.tabs.query({ active: true }, function (tabs) {
    tab = tabs[0];

    var storeId = tab.url.match(/member\/\d+\-/gi);

    if (storeId) {
      $scope.$apply(function () {
        storeId = storeId[0].split("/")[1].split("-")[0];

        vintedEndpoint = "https://" + new URL(tab.url).hostname + "/";

        $scope.s.storeId = storeId;
        $scope.getStoreInfo();

        chrome.tabs.sendMessage(tab.id, { msg: "currentUser" }, function (res) {
          $scope.s.loggedInUserId = res;
        });
      });
    }
  });

  $scope.getDate = function (t) {
    var d = new Date(t * 1000);
    var date = d.toUTCString().split(" ");

    return date.slice(0, 4).join(" ");
  };

  $scope.checkUser = function () {
    var token = localStorage.token;
    var user = true;

    try {
      user = JSON.parse(localStorage.user);
    } catch (e) {}

    if (token) {
      $scope.token = token;
      $scope.user = user;
      $scope.getUserDetail();
      //console.log(user);
    } else {
      $scope.getUserDetail("session");
    }
  };

  $scope.getUserDetail = function (session) {
    var d = {
      action: "login",
    };

    if (session) {
      d.getUser = true;
    } else {
      d.token = $scope.token;
    }

    $scope.ajax(d).then(function (res) {
      if (res.status == "success") {
        $scope.user = res.user;
        localStorage.user = angular.toJson(res.user);
        localStorage.sub = res.user.subscription;
        localStorage.token = res.user.token;

        chrome.storage.local.set({ user: res.user });
      } else {
        localStorage.token = "";

        if (!session) {
          toastr.error(res.message);
        }
        $scope.user = false;
        chrome.storage.local.set({ user: "" });
      }
    });
  };

  $scope.login = function (event) {
    event.preventDefault();
    var f2 = $scope.f2;
    f2.action = "login";
    f2.loading = true;
    $scope.ajax(f2).then(function (res) {
      f2.loading = false;
      if (res.status == "success") {
        $scope.user = res.user;
        localStorage.token = $scope.user.token;
        localStorage.user = angular.toJson(res.user);
        localStorage.sub = res.user.subscription;

        chrome.storage.local.set({ user: res.user });
      } else {
        localStorage.token = "";
        chrome.storage.local.set({ user: "" });
        toastr.error(res.message);
      }
    });
  };

  $scope.register = function (event) {
    event.preventDefault();
    var f3 = $scope.f3;
    f3.register = true;
    f3.loading = true;
    f3.lname = "";
    // f3.name = f3.name.replace(/\s+/gi," ").trim();
    // f3.fname = f3.name.split(" ")[0];
    // f3.lname = f3.name.split(" ").slice(1).join(" ");

    $scope.ajax(f3).then(function (res) {
      f3.loading = false;
      if (res.status == "success") {
        $scope.user = res.user;
        localStorage.token = $scope.user.token;
        localStorage.user = angular.toJson(res.user);
        localStorage.sub = res.user.subscription;

        if (res.user.subscription) {
          $scope.s = { enabled: true };
          $scope.save();
        }

        chrome.tabs.create({
          url: $scope.baseurl + "?token=" + $scope.user.token,
        });
      } else {
        localStorage.token = "";
        toastr.error(res.message);
      }
    });
  };

  $scope.logout = function () {
    var d = {
      action: "logout",
      token: $scope.user.token,
    };

    $scope.ajax(d).then(function () {
      localStorage.token = "";
      $scope.user = "";
    });
  };

  $scope.checkUser();

  $scope.downloadCSV = function (data) {
    data = JSON.parse(angular.toJson(data));

    var csv = Papa.unparse(data);
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var link = document.createElement("a");

    var name = $scope.type + "_" + $scope.domain;

    var url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", name + ".csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  $("[ng-load]").removeAttr("ng-load");
});
