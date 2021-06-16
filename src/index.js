// "use strict";
import observer from "@cocreate/observer";
import "./style.css";

const EVENTS = ['mousemove touchmove', 'mousedown touchstart', 'mouseup touchend'];
const DIRECTIONS = ['left', 'right', 'top', 'bottom'];

const coCreateResize = {
    selector: '', //'.resize',
    resizers: [],
    resizeWidgets: [],

    init: function(handleObj) {
        for (var handleKey in handleObj)
            if (handleObj.hasOwnProperty(handleKey) && handleKey == 'selector')
                this.selector = handleObj[handleKey];

        this.resizers = document.querySelectorAll(this.selector);
        var _this = this;
        this.resizers.forEach(function(resize, idx) {
            let resizeWidget = new CoCreateResize(resize, handleObj);
            _this.resizeWidgets[idx] = resizeWidget;
        })
    },

    initElement: function(target) {
        let resizeWidget = new CoCreateResize(target, {
            dragLeft: "[data-resize='left']",
            dragRight: "[data-resize='right']",
            dragTop: "[data-resize='top']",
            dragBottom: "[data-resize='bottom']"
        });
        this.resizeWidgets[0] = resizeWidget;
    }
}

function CoCreateResize(resizer, options) {
    this.resizeWidget = resizer;
    this.cornerSize = 10;
    this.init(options);
}

CoCreateResize.prototype = {
    init: function(handleObj) {
        if (this.resizeWidget) {
            this.initDrags = [];
            this.checkCorners = [];
            this.doDrags = [];
            this.Drags = [];
            this.gridWidth = 0;

            DIRECTIONS.map(d => {
                this.Drags[d] = this.resizeWidget.querySelector(handleObj['drag' + d.charAt(0).toUpperCase() + d.slice(1)]);
            })

            this.bindListeners();
            this.initResize();
            this.getGridProperty();
        }
    },

    getGridProperty: function() {
        let compStyles = window.getComputedStyle(this.resizeWidget.parentNode);
        let gridColumns = compStyles.gridTemplateColumns;
        
        if(gridColumns !== 'none') {
            let [width] = gridColumns.split(' ');
            this.gridWidth = Number.parseFloat(width)
        }
    },

    initResize: function() {
        DIRECTIONS.map(d => { if (this.Drags[d]) this.addListenerMulti(this.Drags[d], EVENTS[0], this.checkCorners[d]); })
    },

    checkDragImplementation: function(e, from, to, offset, fcur, scur) {
        if (e.touches)
            e = e.touches[0];

        this.removeListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[from]);
        this.removeListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[to]);
        this.addListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[from]);

        if (offset < this.cornerSize && this.Drags[to]) {
            this.Drags[from].style.cursor = fcur;
            this.addListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[to]);
        }
        else {
            this.Drags[from].style.cursor = scur;
        }
    },

    initDrag: function(e, idx) {
        let selector = document.defaultView.getComputedStyle(this.resizeWidget);
        this.processIframe();

        if (idx == 'top' || idx == 'bottom') {
            this.startTop = parseInt(selector.top, 10);
            this.startHeight = parseInt(selector.height, 10);

            if (e.touches)
                this.startY = e.touches[0].clientY;
            else
                this.startY = e.clientY;
        }
        else {
            this.startLeft = parseInt(selector.left, 10);
            this.startWidth = parseInt(selector.width, 10);

            if (e.touches)
                this.startX = e.touches[0].clientX;
            else
                this.startX = e.clientX;
        }

        this.addListenerMulti(document.documentElement, EVENTS[0], this.doDrags[idx]);
        this.addListenerMulti(document.documentElement, EVENTS[2], this.stopDrag);
    },

    initTopDrag: function(e) {
        this.initDrag(e, 'top');
    },
    initBottomDrag: function(e) {
        this.initDrag(e, 'bottom');
    },
    initLeftDrag: function(e) {
        this.initDrag(e, 'left');
    },
    initRightDrag: function(e) {
        this.initDrag(e, 'right');
    },
    doTopDrag: function(e) {
        let top, height;

        if (e.touches)
            e = e.touches[0];
        top = this.startTop + e.clientY - this.startY;
        height = this.startHeight - e.clientY + this.startY;

        if (top < 10 || height < 10)
            return;
        // this.resizeWidget.style.top = top + 'px';
        // this.resizeWidget.style.height = height + 'px';
    },


    doBottomDrag: function(e) {
        let height = 0;

        if (e.touches)
            e = e.touches[0];

        height = this.startHeight + e.clientY - this.startY;

        if (height < 10)
            return;
        // this.resizeWidget.style.height = height + 'px';
    },


    doLeftDrag: function(e) {
        let left, width;
        if (e.touches)
            e = e.touches[0];
        left = this.startLeft + e.clientX - this.startX;
        width = this.startWidth - e.clientX + this.startX;

        if (width < 10)
            return;
        // this.resizeWidget.style.left = left + 'px';
        // this.resizeWidget.style.width = width + 'px';
        this.resizeWidget.style['grid-column-end'] = 'span ' + Number.parseInt(width / this.gridWidth);

    },


    doRightDrag: function(e) {
        let width = 0;
        if (e.touches)
            e = e.touches[0];
        width = this.startWidth + e.clientX - this.startX;
        if (width < 10)
            return;
        // this.resizeWidget.style.width = width + 'px';
        this.resizeWidget.style['grid-column-end'] = 'span ' + Number.parseInt(width / this.gridWidth);
    },

    stopDrag: function(e) {
        this.resizeWidget.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });

        DIRECTIONS.map(d => { this.removeListenerMulti(document.documentElement, EVENTS[0], this.doDrags[d]); })
        this.removeListenerMulti(document.documentElement, EVENTS[2], this.stopDrag);
    },
    checkLeftDragTopCorner: function(e) {
        const offset = e.clientY - this.getDistance(this.Drags['left'], true) + document.documentElement.scrollTop;
        this.checkDragImplementation(e, 'left', 'top', offset, 'se-resize', 'e-resize');
    },
    checkTopDragRightCorner: function(e) {
        const offset = this.getDistance(this.Drags['right'], false) - e.clientX - document.documentElement.scrollLeft;
        this.checkDragImplementation(e, 'top', 'right', offset, 'ne-resize', 's-resize');
    },
    checkBottomDragLeftCorner: function(e) {
        const offset = e.clientX - this.getDistance(this.Drags['bottom'], false) + document.documentElement.scrollLeft;
        this.checkDragImplementation(e, 'bottom', 'left', offset, 'ne-resize', 's-resize');
    },
    checkRightDragBottomCorner: function(e) {
        const offset = this.getDistance(this.Drags['bottom'], true) - e.clientY - document.documentElement.scrollTop;
        this.checkDragImplementation(e, 'right', 'bottom', offset, 'se-resize', 'e-resize');
    },

    bindListeners: function() {
        this.doDrags['left'] = this.doLeftDrag.bind(this);
        this.doDrags['top'] = this.doTopDrag.bind(this);
        this.doDrags['right'] = this.doRightDrag.bind(this);
        this.doDrags['bottom'] = this.doBottomDrag.bind(this);

        this.stopDrag = this.stopDrag.bind(this);

        this.checkCorners['left'] = this.checkLeftDragTopCorner.bind(this);
        this.checkCorners['top'] = this.checkTopDragRightCorner.bind(this);
        this.checkCorners['bottom'] = this.checkBottomDragLeftCorner.bind(this);
        this.checkCorners['right'] = this.checkRightDragBottomCorner.bind(this);

        this.initDrags['top'] = this.initTopDrag.bind(this);
        this.initDrags['left'] = this.initLeftDrag.bind(this);
        this.initDrags['bottom'] = this.initBottomDrag.bind(this);
        this.initDrags['right'] = this.initRightDrag.bind(this);

    },

    getDistance: function(elem, flag) {
        var location = 0;
        if (elem.offsetParent) {
            do {
                location += (flag) ? elem.offsetTop : elem.offsetLeft;
                elem = elem.offsetParent;
            } while (elem);
        }
        return location >= 0 ? location : 0;
    },

    // Bind multiiple events to a listener
    addListenerMulti: function(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.addEventListener(events[i], listener, false);
        }
    },

    // Remove multiiple events from a listener
    removeListenerMulti: function(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.removeEventListener(events[i], listener, false);
        }
    },

    // style="pointer-events:none" for iframe when drag event starts
    processIframe: function() {
        this.resizeWidget.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = 'none';
        });
    }
}

observer.init({
    name: 'CoCreateResize',
    observe: ['subtree', 'childList'],
    include: '.resize',
    callback: function(mutation) {
        coCreateResize.initElement(mutation.target);
        if(mutation.type === "childList")
        {
            mutation.target.querySelectorAll("*").forEach((el) => {
                coCreateResize.initElement(el);
            });
        }
    }
})

coCreateResize.init({
    selector: ".resize",
    dragLeft: "[data-resize='left']",
    dragRight: "[data-resize='right']",
    dragTop: "[data-resize='top']",
    dragBottom: "[data-resize='bottom']",
});
export default coCreateResize;
