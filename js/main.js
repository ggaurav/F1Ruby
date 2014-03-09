var appStorageID = "python";
var blackList = ['java', 'php', 'javascript', 'cpp', 'ruby', 'scala', 'mysql', 'css', 'objectivec', 'bash']
var baseURL = null;
//"http://polar-reef-5994.herokuapp.com/eqSearch?t=math&q=";


function setSearch(value) {
     $("textarea").val(value);
     $.mobile.changePage($("#page1"), "slide", true, true);
     getResult(true);
}

function setHistorySearch(value) {
     $("textarea").val(value);
     $.mobile.changePage($("#page1"), "slide", true, true);
     getResult(false);
}

function goBack() {
     $.mobile.changePage($("#page1"), "slide", true, true);
}

$(document).ready(function() {
     if(typeof(Storage) == "undefined") {
          $("#history_content_page").html("<font color='red'>Local storage is not supported in your device</font>");
     }
     getAPIBaseUrl();
});

function getAPIBaseUrl(retry) {
     $.ajax({
          type: 'POST',
          url: 'http://lbwa.herokuapp.com/getAPIUrl',
          dataType: 'jsonp',
          timeout: 1000,
          error:function(resp){
               if(resp.statusText == 'timeout'){
                    showConnectionLostError(getAPIBaseUrl);
               }
          },
          success: function(resp) {
               if(retry){
                    $('<div>').simpledialog2({
                         mode: 'blank',
                         headerText: 'And we are back online :)',
                         headerClose: true,
                         showModal:false,
                         blankContent: "<p style='margin-left:5px;'>And we are back online :)</p>",
                    });
                    setTimeout(function(){
                         $(document).trigger('simpledialog', {'method':'close'});
                    },1000);
               }
               baseURL = 'http://' + resp.baseUrl + '/eqSearch?t=' + appStorageID + '&q=';
               $.mobile.changePage($("#page1"), "slide", true, true);
               loadMenuJSON();
          }
     });
}
function showConnectionLostError(callback){
     $('<div>').simpledialog2({
          mode: 'button',
          headerText: 'Data Connection Unavailable',
          headerClose: true,
          forceInput:true,
          buttonPrompt: 'Data connection is unavailable! Make sure it is available and then click retry!',
          buttons : {
               'Retry': {
                    click: function () { 
                         if(typeof callback == 'function') callback(true);
                    }
               },
          }
     });
}
function slideToHistoryPage() {
     var historyArray = JSON.parse(localStorage.getItem('appHistoryArray' + appStorageID));
     $('#results-data').empty();
     var historyListHTML = '';
     if(historyArray == null) {
          $('#results-data').append('<li><font color="red">No History records found in local storage</font></li>');
     } else {
          for(var i = historyArray.length - 1; i >= 0; i--) {
               var history = historyArray[i];
               $('#results-data').append('<li><a href="#" onclick="setHistorySearch(this.innerHTML)">' + history + '</a></li>');
          }
     }
     if($('#results-data').hasClass('ui-listview')) {
          $('#results-data').listview('refresh');
     } else {
          $('#results-data').trigger('create');
     }
     $.mobile.changePage($("#history_page"), "slide", true, true);
}

function slideToExamplePage() {
     $('#results-data').empty();
     $.mobile.changePage($("#example_page"), "slide", true, true);
}
function getCleanQuery(){
     var regex =  new RegExp("\\s(" + blackList.join('|') + ")","ig");
     var query = $("textarea").val().replace(regex,"");
     return encodeURIComponent(query + ' ' + appStorageID);
}
function getResult(inHistory) {
     var trimval = $("textarea").val().trim();
     if(trimval.length == 0) {
          $("#myPopupDiv").popup("open");
          return;
     }
     if(inHistory) {
          var historyArray = JSON.parse(localStorage.getItem('appHistoryArray' + appStorageID));
          if(typeof(historyArray) == "undefined" || historyArray == null) {
               historyArray = new Array();
          }
          historyArray.push($("#textarea").val());
          try {
               localStorage.setItem("appHistoryArray" + appStorageID, JSON.stringify(historyArray));
          } catch(e) {
               if(e == QUOTA_EXCEEDED_ERR) {
                    console.log('Quota exceeded!');
               }
          }
     }
     $("#result_div").html("");
     $.mobile.showPageLoadingMsg("a", "Loading Data... Pls Wait!!");
     $.ajax({
          type: 'GET',
          url: 'http://howdoi1.herokuapp.com/howdoi?q=' + getCleanQuery(),
          dataType: 'jsonp',
          success: function(json) {
               var status = json.status;
               $("#result_div").html("");
               if(status == "success" && json.data != '') {
                    $("#result_div").html(json.data);
               } else if(status == "error") {
                    $("#result_div").append("<p><h3>Invalid Input!! Could find anything for this..</h3></p>");
               } else {
                    $("#result_div").append("<p><h3>Invalid Input!! Could find anything for the given input :(</h3></p>");
               }
               $.mobile.hidePageLoadingMsg();
          },
          error: function(e) {
               $("#result_div").append("<p><h3>Something really bad thing happened :( Please try after some time!</h3></p>");
               console.log(e.message);
               $.mobile.hidePageLoadingMsg();
          }
     });
}

function loadMenuJSON() {
     $.getJSON("menu.json", function(data) {
          var category = "";
          var menuHTML = "";
          $("#menu_collapsible_set").empty();
          for(var i = 0; i < data.length; i++) {
               var title = data[i].title;
               var query = data[i].query;
               if(category == "" || category != title) {
                    category = title;
                    if(i != 0) {
                         menuHTML += "</ul></div>";
                    }
                    menuHTML += '<div data-role="collapsible" data-content-theme="c" data-theme="b"><h3>' + title + '</h3><ul data-role="listview">';
               }
               menuHTML += '<li><a href="#" onclick="setSearch(this.innerHTML)">' + query + '</a></li>';

          }
          if(data.length != 0) {
               menuHTML += "</ul></div>";
          }
          console.log(menuHTML);
          $("#menu_collapsible_set").html(menuHTML).trigger('create');
     });
}