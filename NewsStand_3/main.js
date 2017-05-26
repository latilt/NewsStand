/* Observer */
function Event(sender) {
    this._sender = sender;
    this._listeners = [];
}

Event.prototype = {
    attach : function (listener) {
        this._listeners.push(listener);
    },
    notify : function (args) {
        var index;

        for (index = 0; index < this._listeners.length; index += 1) {
            this._listeners[index](this._sender, args);
        }
    }
}

/* Model */
function NewsModel(datas) {
  /* 뉴스데이터, 구독리스트, 현재페이지번호, 전체페이지수 */
  this._datas = datas;
  this._subscribedList = [];
  this._currentPageNumber = 0;
  this._totalPageNumber = 0;

  /* Model Observer 생성
   * 현재페이지번호가 변경됐을때, 뉴스데이터가 삭제됐을때, 구독리스트가 변경됐을때
   * 리스너들에게 전파한다.
   */
  this.currentPageNumberChanged = new Event(this);
  this.dataRemoved = new Event(this);
  this.subscribedChanged = new Event(this);
}

NewsModel.prototype = {
  /* 현재페이지번호 가져오기 */
  getCurrentPageNumber : function() {
    return this._currentPageNumber;
  },

  /* 현재페이지번호 저장하기, 현재페이지번호가 바꼈음을 전파한다 */
  setCurrentPageNumber : function(number) {
    this._currentPageNumber = number;
    this.currentPageNumberChanged.notify();
  },

  /* 전체페이지수 가져오기 */
  getTotalPageNumber : function() {
    return this._totalPageNumber;
  },

  /* 전체페이지수 저장하기 */
  setTotalPageNumber : function() {
    this._totalPageNumber = this._subscribedList.length;
  },

  /* 뉴스데이터 지우기, 뉴스데이터가 지워졌음을 전파한다 */
  removeData : function(number) {
    this.toggleSubscribedByTitle(this._subscribedList[number].title);
    this._subscribedList.splice(number, 1);
    this._currentPageNumber = 0;
    this._totalPageNumber--;
    this.dataRemoved.notify();
  },

  /* 뉴스데이터 전부 가져오기 */
  getDataAll : function() {
    return this._datas;
  },

  /* 숫자로 뉴스데이터 가져오기 */
  getDataByNumber : function(number) {
    return this._datas[this._subscribedList[number].index];
  },

  /* 타이틀에 해당하는 뉴스데이터 가져오기*/
  getDataIndexByTitle : function(title) {
    return this._subscribedList.findIndex(function(e) {
      return e.title === title;
    });
  },

  /* 뉴스데이터의 타이틀들 가져오기 */
  getDataTitles : function() {
    var titleArray = [];
    var key;
    for( key in this._subscribedList ) {
      if(this._subscribedList.hasOwnProperty(key)) {
        titleArray.push(this._subscribedList[key].title);
      }
    }

    return titleArray;
  },

  /* 구독버튼 토글 기능 */
  toggleSubscribedByTitle : function(title) {
    var targetObj = this._datas.find(function(e) {
      return e.title === title;
    });

    targetObj.subscribed = (targetObj.subscribed) ? false : true;
    this.subscribedChanged.notify({title : title});
  },

  /* 뉴스데이터를 가져오며 구독리스트 생성 */
  setSubscribedList : function() {
    this._subscribedList = [];
    this._datas.forEach(function(e,i) {
      if(e.subscribed) {
        this._subscribedList.push({title : e.title, index : i});
      }
    }, this);
  }
}

/* View */
function NewsView(model, elements) {
  this._model = model;
  this._elements = elements;
  this.template = document.querySelector("#newsTemplate").innerHTML;

  /* View Observer 생성 */
  this.leftButtonClicked = new Event(this);
  this.rightButtonClicked = new Event(this);
  this.pressButtonClicked = new Event(this);
  this.myNewsButtonClicked = new Event(this);
  this.listTitleClicked = new Event(this);
  this.delButtonClicked = new Event(this);
  this.pressListClicked = new Event(this);

  var _this = this;

  /* Model Observer 구독, Model의 데이터 변경에 따라 View를 재구성한다 */
  /* Model의 현재페이지번호가 변경되면 View의 현재페이지번호를 변경하고 해당하는 번호의 뉴스콘텐츠를 보여준다 */
  this._model.currentPageNumberChanged.attach(function() {
    _this.changeCurrentPageNumber();
    _this.changeNewsContent();
  });
  /* Model의 뉴스데이터가 삭제되면 뉴스리스트, 뉴스콘텐츠, 현재페이지번호, 전체페이지수가 변경된다 */
  this._model.dataRemoved.attach(function() {
    _this.changeNewsList();
    _this.changeNewsContent();
    _this.changeCurrentPageNumber();
    _this.changeTotalPageNumber();
  });
  /* 구독리스트가 변경되면 구독표시가 변경된다 */
  this._model.subscribedChanged.attach(function(sender, args) {
    _this.togglePressSubscribed(args.title);
  });

  /* EvnetListener */
  /* header eventlistener */
  this._elements.header.querySelector(".left > a").addEventListener("click", function(evt) {
    _this.leftButtonClicked.notify();
  });
  this._elements.header.querySelector(".right > a").addEventListener("click", function(evt) {
    _this.rightButtonClicked.notify();
  });
  this._elements.header.querySelector(".press").addEventListener("click", function(evt) {
    _this.pressButtonClicked.notify();
  });
  this._elements.header.querySelector(".myNews").addEventListener("click", function(evt) {
    _this.myNewsButtonClicked.notify();
  });
  /* nav eventlistener */
  this._elements.nav.addEventListener("click", function(evt) {
    if(evt.target.tagName !== "LI") return;
    _this.listTitleClicked.notify({title : evt.target.innerText});
  });
  /* content eventlistener */
  this._elements.content.addEventListener("click", function(evt) {
    if(evt.target.tagName !== "BUTTON" && evt.target.tagName !== "A") return;
    _this.delButtonClicked.notify({title : evt.target.closest(".title").querySelector(".newsName").innerText})
  });
  /* mainPress eventlistener */
  this._elements.mainPress.addEventListener("click", function(evt) {
    if(evt.target.tagName !== "IMG") return;
    _this.pressListClicked.notify({title : evt.target.id});
  })
}

NewsView.prototype = {
  /* 현재페이지번호 변경 */
  changeCurrentPageNumber : function() {
    var currentPageNumber = this._model.getCurrentPageNumber();
    this._elements.header.querySelector(".current").innerText = currentPageNumber + 1;
  },

  /* 전체페이지수 변경 */
  changeTotalPageNumber : function() {
    var totalPageNumber = this._model.getTotalPageNumber();
    this._elements.header.querySelector(".total").innerText = totalPageNumber;
  },

  /* MainPress 화면 토글 */
  toggleMainPressDisplay : function(display) {
    this._elements.mainPress.style.display = (display === "block") ? "block" : "none";
  },

  /* 뉴스데이터에 따라 MainPress 화면 구축 */
  changeMainPress : function() {
    var newsArray = this._model.getDataAll();
    var pressList = "";

    newsArray.forEach(function(e) {
      pressList = pressList + "<li><img id='" + e.title + "' src='" + e.imgurl + "' style='border-color:" + ((e.subscribed) ? "red" : "black") + "'/></li>"
    });

    this._elements.mainPress.querySelector("ul").innerHTML = pressList;
  },

  /* 구독여부 토글 기능 */
  togglePressSubscribed : function(title) {
    var target = this._elements.mainPress.querySelector("#"+title);
    var color = target.style.borderColor;
    target.style.borderColor = (color === "red") ? "black" : "red";
  },

  /* MainArea 화면 토글*/
  toggleMainAreaDisplay : function(display) {
    this._elements.mainArea.style.display = (display === "block") ? "block" : "none";
  },

  /* 뉴스리스트 영역 변경 */
  changeNewsList : function() {
    var titleArray = this._model.getDataTitles();

    this._elements.nav.innerHTML = "<li>" + titleArray.join("</li><li>") + "</li>";
  },

  /* 뉴스콘텐츠 영역 변경 */
  changeNewsContent : function() {
    var currentPageNumber = this._model.getCurrentPageNumber();
    var newsObj = this._model.getDataByNumber(currentPageNumber);
    var newContent = this.template.replace("{title}", newsObj.title).replace("{imgurl}", newsObj.imgurl).replace("{newsList}", "<li>" + newsObj.newslist.join("</li><li>") + "</li>");

    this._elements.content.innerHTML = newContent;
  },

  /* MainArea 화면일때는 노출, MainPress 화면일때는 숨김 */
  togglePaging : function(display) {
    this._elements.header.querySelector(".paging").style.display = (display === "block") ? "block" : "none";
  },

  /* MainArea 화면일때는 노출, MainPress 화면일때는 숨김 */
  toggleButton : function(display) {
    this._elements.header.querySelector(".btn").style.display = (display === "block") ? "block" : "none";
  },

  /* 초기 실행 */
  init : function() {
    this._model.setSubscribedList();
    this._model.setTotalPageNumber();
    this.changeMainPress();
  }
}

/* Controller */
function NewsController(model, view) {
  this._model = model;
  this._view = view;

  var _this = this;

  /* View Observer 구독, 사용자의 행동에 따른 이벤트를 핸들링한다 */
  this._view.leftButtonClicked.attach(function() {
    _this.clickLeftButton();
  });
  this._view.rightButtonClicked.attach(function() {
    _this.clickRightButton();
  });
  this._view.pressButtonClicked.attach(function() {
    _this.clickPressButton();
  });
  this._view.myNewsButtonClicked.attach(function() {
    _this.clickMyNewsButton();
  });
  this._view.listTitleClicked.attach(function(sender, args) {
    _this.clickListTitle(args.title);
  });
  this._view.delButtonClicked.attach(function() {
    _this.clickDelButton();
  });
  this._view.pressListClicked.attach(function(sneder, args) {
    _this.clickPressList(args.title);
  });
}

NewsController.prototype = {
  /* 왼쪽화살표 버튼이 클릭되었을때 */
  clickLeftButton : function() {
    var currentPageNumber = this._model.getCurrentPageNumber();
    var totalPageNumber = this._model.getTotalPageNumber();
    currentPageNumber--;
    if(currentPageNumber < 0) {
      currentPageNumber = totalPageNumber - 1;
    }

    this._model.setCurrentPageNumber(currentPageNumber);
  },

  /* 오른쪽화살표 버튼이 클릭되었을때 */
  clickRightButton : function() {
    var currentPageNumber = this._model.getCurrentPageNumber();
    var totalPageNumber = this._model.getTotalPageNumber();
    currentPageNumber++;
    if(currentPageNumber >= totalPageNumber) {
      currentPageNumber = 0;
    }

    this._model.setCurrentPageNumber(currentPageNumber);
  },

  /* 신문사 버튼을 클릭했을때 */
  clickPressButton : function() {
    this._view.toggleMainPressDisplay("block");
    this._view.toggleMainAreaDisplay();
    this._view.togglePaging();
    this._view.toggleButton();
    this._view.changeMainPress();
  },

  /* 뉴스 영역을 클릭했을때 */
  clickMyNewsButton : function() {

    this._view.toggleMainPressDisplay();
    this._view.toggleMainAreaDisplay("block");
    this._view.togglePaging("block");
    this._view.toggleButton("block");

    this._model.setSubscribedList();
    this._view.changeNewsList();

    this._model.setTotalPageNumber();
    this._view.changeTotalPageNumber();
    var targetPageNumber = 0;
    this._model.setCurrentPageNumber(targetPageNumber);
  },

  /* MainPress 화면에서 신문사를 클릭했을때 */
  clickPressList : function(title) {
    this._model.toggleSubscribedByTitle(title);
  },

  /* 뉴스리스트에서 타이틀을 클릭했을때 */
  clickListTitle : function(title) {
    var targetPageNumber = this._model.getDataIndexByTitle(title);

    this._model.setCurrentPageNumber(targetPageNumber);
  },

  /* 삭제버튼을 클릭했을때 */
  clickDelButton : function() {
    var targetPageNumber = this._model.getCurrentPageNumber();

    this._model.removeData(targetPageNumber);
  }
}

/* DOM이 로딩이 된후 자바스크립트 실행 */
document.addEventListener("DOMContentLoaded", function() {
  /* View의 EventListener 연결을 위해 querySelector 사용 */
  var header = document.querySelector("header");
  var mainArea = document.querySelector(".mainArea");
  var mainPress = document.querySelector(".mainPress");
  var nav = mainArea.querySelector("nav > ul");
  var content = document.querySelector(".content");

  /* Model, View, Controller 연결 */
  ajax.sending(newsURL, function(res) {
    var json = JSON.parse(res.target.response);

    var myModel = new NewsModel(json);
    var myView = new NewsView(myModel, {header : header, mainArea : mainArea, content : content, mainPress : mainPress, nav : nav});
    var myController = new NewsController(myModel, myView);

    myView.init();
  });
});
