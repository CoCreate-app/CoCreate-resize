// component implementation:
// 1. it should have programming api as well as html or attribute api
// 2. Includes semantic
import "./style.css";

function CoCreateResize(resizeWidget) {
    this.resizeWidget = resizeWidget;
    this.topDragger = this.resizeWidget.querySelector("[data-resize_handle='top']");
    this.bottomDragger = this.resizeWidget.querySelector("[data-resize_handle='bottom']");
    this.leftDragger = this.resizeWidget.querySelector("[data-resize_handle='left']");
    this.rightDragger = this.resizeWidget.querySelector("[data-resize_handle='right']");

    var _this = this;
    this.topDragger.addEventListener('mousedown', _this.initTopDrag.bind(event, _this), false);
    this.bottomDragger.addEventListener('mousedown', _this.initBottomDrag.bind(event, _this), false);
    this.leftDragger.addEventListener('mousedown', _this.initLeftDrag.bind(event, _this), false);
    this.rightDragger.addEventListener('mousedown', _this.initRightDrag.bind(event, _this), false);

    this.topBind = false;
    this.bottomBind = false;
    this.leftBind = false;
    this.rightBind = false;
}

CoCreateResize.prototype = {
    initTopDrag: function(_this, e) {
        _this.startTop = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).top, 10);
        _this.startHeight = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).height, 10);
        _this.startY = e.clientY;

        if (!_this.topBind) {
            _this.doTopDrag = _this.doTopDrag.bind(event, _this);
            _this.stopDrag = _this.stopDrag.bind(event, _this);
            _this.topBind = true;
        }

        document.documentElement.addEventListener('mousemove', _this.doTopDrag, false);
        document.documentElement.addEventListener('mouseup', _this.stopDrag, false);
    },

    doTopDrag: function(_this, e) {
        let top = _this.startTop + e.clientY - _this.startY;
        let height = _this.startHeight - e.clientY + _this.startY;
        if (top < 10 || height < 10)
            return;
        _this.resizeWidget.style.top = top + 'px';
        _this.resizeWidget.style.height = height + 'px';
    },

    initBottomDrag: function(_this, e) {
        _this.startTop = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).top, 10);
        _this.startHeight = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).height, 10);
        _this.startY = e.clientY;

        if (!_this.bottomBind) {
            _this.doBottomDrag = _this.doBottomDrag.bind(event, _this);
            _this.stopDrag = _this.stopDrag.bind(event, _this)
            _this.bottomBind = true;
        }

        document.documentElement.addEventListener('mousemove', _this.doBottomDrag, false);
        document.documentElement.addEventListener('mouseup', _this.stopDrag, false);
    },

    doBottomDrag: function(_this, e) {
        let height = _this.startHeight + e.clientY - _this.startY;
        if (height < 10)
            return;
        _this.resizeWidget.style.height = height + 'px';
    },

    initLeftDrag: function(_this, e) {
        _this.startLeft = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).left, 10);
        _this.startWidth = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).width, 10);
        _this.startX = e.clientX;

        if (!_this.leftBind) {
            _this.doLeftDrag = _this.doLeftDrag.bind(event, _this);
            _this.stopDrag = _this.stopDrag.bind(event, _this)
            _this.leftBind = true;
        }

        document.documentElement.addEventListener('mousemove', _this.doLeftDrag, false);
        document.documentElement.addEventListener('mouseup', _this.stopDrag, false);
    },

    doLeftDrag: function(_this, e) {
        let left = _this.startLeft + e.clientX - _this.startX;
        let width = _this.startWidth - e.clientX + _this.startX;
        if (width < 10)
            return;
        _this.resizeWidget.style.left = left + 'px';
        _this.resizeWidget.style.width = width + 'px';
    },

    initRightDrag: function(_this, e) {
        //startLeft = parseInt(document.defaultView.getComputedStyle(this.resizeWidget).left, 10);
        _this.startWidth = parseInt(document.defaultView.getComputedStyle(_this.resizeWidget).width, 10);
        _this.startX = e.clientX;

        if (!_this.rightBind) {
            _this.doRightDrag = _this.doRightDrag.bind(event, _this);
            _this.stopDrag = _this.stopDrag.bind(event, _this)
            _this.rightBind = true;
        }

        document.documentElement.addEventListener('mousemove', _this.doRightDrag, false);
        document.documentElement.addEventListener('mouseup', _this.stopDrag, false);
    },

    doRightDrag: function(_this, e) {
        let width = _this.startWidth + e.clientX - _this.startX;
        if (width < 10)
            return;
        _this.resizeWidget.style.width = width + 'px';
    },

    stopDrag: function(_this, e) {
        document.documentElement.removeEventListener('mousemove', _this.doTopDrag, false);
        document.documentElement.removeEventListener('mousemove', _this.doBottomDrag, false);
        document.documentElement.removeEventListener('mousemove', _this.doLeftDrag, false);
        document.documentElement.removeEventListener('mousemove', _this.doRightDrag, false);
        document.documentElement.removeEventListener('mouseup', _this.stopDrag, false);
    }
}

export default CoCreateResize;