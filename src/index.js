// "use strict";
import observer from "@cocreate/observer";
import "./index.css";

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
            
            //this is for grid
            this.gridWidth = 0;
            this.gridHeight = 0;
            this.missingWidth = 0;
            this.missingHeight = 0;
            this.limitSpan = 0;
            this.widthSpan = 0;
            this.heightSpan = 0;
            this.originClassAttribute = this.resizeWidget.getAttribute('class');

            DIRECTIONS.map(d => {
                this.Drags[d] = this.resizeWidget.querySelector(handleObj['drag' + d.charAt(0).toUpperCase() + d.slice(1)]);
            })

            this.bindListeners();
            this.initResize();

            //this is just for grid system
            this.getGridProperty();
            window.addEventListener('resize', this.checkGridColumns);
        }
    },

    getGridProperty: function() {
        let compStyles = window.getComputedStyle(this.resizeWidget.parentNode);
        let currentCompStyles = window.getComputedStyle(this.resizeWidget);
        let gridColumns = compStyles.gridTemplateColumns;
        let height = compStyles.gridAutoRows;
        
        // console.log(compStyles)
        if(gridColumns !== 'none') {
            let width = gridColumns.split(' ');
            this.limitSpan = width.length;
            this.gridWidth = Number.parseFloat(width[0]) + Number.parseInt(compStyles.gridColumnGap);
            this.gridHeight = Number.parseInt(height) + Number.parseInt(compStyles.gridRowGap);
            this.missingWidth = Number.parseInt(currentCompStyles.paddingRight) + Number.parseInt(currentCompStyles.paddingLeft)
                                + Number.parseInt(currentCompStyles.marginRight) + Number.parseInt(currentCompStyles.marginLeft)
                                + Number.parseInt(currentCompStyles.borderRight) + Number.parseInt(currentCompStyles.borderLeft);
            this.missingHeight = Number.parseInt(currentCompStyles.paddingTop) + Number.parseInt(currentCompStyles.paddingBottom)
                                + Number.parseInt(currentCompStyles.marginTop) + Number.parseInt(currentCompStyles.marginBottom)
                                + Number.parseInt(currentCompStyles.borderTop) + Number.parseInt(currentCompStyles.borderBottom);
        }
    },

    checkGridColumns: function() {
        if(typeof this.resizeWidget !== 'undefined')
        {
            let gridColumns = window.getComputedStyle(this.resizeWidget.parentNode).gridTemplateColumns;
            let spans = gridColumns.split(' ');
            this.limitSpan = spans.length;
    
            if(this.resizeWidget.style['grid-column-end'])
            {
                let curSpan = this.resizeWidget.style['grid-column-end'].split(' ');
                this.resizeWidget.style['grid-column-end'] = 'span ' + Math.min(Number.parseInt(curSpan[1]), this.limitSpan)
            }
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
        this.resizeWidget.style.top = top + 'px';
        this.resizeWidget.style.height = height + 'px';
    },


    doBottomDrag: function(e) {
        let height = 0;

        if (e.touches)
            e = e.touches[0];

        height = this.startHeight + e.clientY - this.startY;

        if (height < 10)
            return;
        this.resizeWidget.style.height = height + 'px';

        //this is just for grid system
        if(this.gridHeight) {
            this.heightSpan = Math.ceil((height + this.missingHeight) / this.gridHeight);
            this.resizeWidget.style['grid-row-end'] = 'span ' + this.heightSpan;
        }
    },


    doLeftDrag: function(e) {
        let left, width;
        if (e.touches)
            e = e.touches[0];
        left = this.startLeft + e.clientX - this.startX;
        width = this.startWidth - e.clientX + this.startX;

        if (width < 10)
            return;
        this.resizeWidget.style.left = left + 'px';
        this.resizeWidget.style.width = width + 'px';
    },


    doRightDrag: function(e) {
        let width = 0;
        if (e.touches)
            e = e.touches[0];
        width = this.startWidth + e.clientX - this.startX;
        if (width < 10)
            return;
        this.resizeWidget.style.width = width + 'px';

        //this is just for grid system
        if(this.gridWidth) {
            let spans = Math.ceil((width + this.missingWidth) / this.gridWidth);
            this.widthSpan = (spans > this.limitSpan) ? this.limitSpan : spans
            this.resizeWidget.style['grid-column-end'] = 'span ' + this.widthSpan;
        }
    },

    detectGrid: function() {
        let compStyles = window.getComputedStyle(this.resizeWidget.parentNode)
        return (compStyles.display === 'grid') ? true : false;
    },

    stopDrag: function(e) {
        this.resizeWidget.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });

        //this is just for grid system
        if(this.detectGrid()) {
            this.resizeWidget.style.width = null;
            this.resizeWidget.style.height = null;

            if(this.widthSpan)  this.resizeWidget.setAttribute('class', this.originClassAttribute + ' grid-column-end:span_' + this.widthSpan)
            if(this.heightSpan) this.resizeWidget.setAttribute('class', this.originClassAttribute + ' grid-row-end:span_' + this.heightSpan)
        }

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
        if(!mutation.isRemoved)
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
