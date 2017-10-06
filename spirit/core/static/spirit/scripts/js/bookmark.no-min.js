
/*
    A library to tell the server how far you have scrolled down.
    requires: modules, waypoints
 */

(function() {
  var Bookmark, Mark,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Mark = (function() {
    "This is shared among a set of bookmarks";
    Mark.prototype.defaults = {
      csrfToken: "csrf_token",
      target: "target url"
    };

    function Mark(options) {
      this.sendMark = bind(this.sendMark, this);
      this.canSend = bind(this.canSend, this);
      this.options = Object.assign({}, this.defaults, options);
      this.isSending = false;
      this.commentNumber = this._getCommentNumber();
      this.numberQueued = this.commentNumber;
    }

    Mark.prototype._getCommentNumber = function() {
      var commentNumber;
      commentNumber = window.location.hash.split("#c")[1];
      commentNumber = parseInt(commentNumber, 10);
      if (isNaN(commentNumber)) {
        commentNumber = 0;
      } else {
        commentNumber -= 1;
      }
      return commentNumber;
    };

    Mark.prototype.canSend = function(number) {
      Number.isInteger(number) || console.error('not a number');
      return number > this.commentNumber;
    };

    Mark.prototype.sendMark = function(number) {
      var form, headers;
      if (!this.canSend(number)) {
        return;
      }
      this.numberQueued = number;
      if (this.isSending) {
        return;
      }
      this.isSending = true;
      this.commentNumber = number;
      form = new FormData();
      form.append('csrfmiddlewaretoken', this.options.csrfToken);
      form.append('comment_number', String(number));
      headers = new Headers();
      headers.append("X-Requested-With", "XMLHttpRequest");
      return fetch(this.options.target, {
        method: "POST",
        headers: headers,
        credentials: 'same-origin',
        body: form
      }).then((function(_this) {
        return function(response) {
          _this.isSending = false;
          _this.sendMark(_this.numberQueued);
          return response.ok || console.log({
            status: response.status,
            statusText: response.statusText
          });
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          _this.isSending = false;
          _this.sendMark(_this.numberQueued);
          return console.log(error.message);
        };
      })(this));
    };

    return Mark;

  })();

  Bookmark = (function() {
    function Bookmark(el, mark) {
      this.onWaypoint = bind(this.onWaypoint, this);
      this._getNumber = bind(this._getNumber, this);
      this.el = el;
      this.mark = mark;
      this.number = this._getNumber();
      this.waypoint = new Waypoint({
        element: this.el,
        handler: this.onWaypoint,
        offset: '100%'
      });
    }

    Bookmark.prototype._getNumber = function() {
      var number;
      number = parseInt(this.el.dataset.number, 10);
      !isNaN(number) || console.error('comment number is NaN');
      return number;
    };

    Bookmark.prototype.onWaypoint = function() {
      this.mark.sendMark(this.number);
    };

    return Bookmark;

  })();

  stModules.bookmark = function(elms, options) {
    var mark;
    mark = new Mark(options);
    return Array.from(elms).map(function(elm) {
      return new Bookmark(elm, mark);
    });
  };

  stModules.Bookmark = Bookmark;

  stModules.Mark = Mark;

}).call(this);
