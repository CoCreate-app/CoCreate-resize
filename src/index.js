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
        });
    },

    initElement: function(target) {
        let resizeWidget = new CoCreateResize(target, {
            dragLeft: "[resize='left']",
            dragRight: "[resize='right']",
            dragTop: "[resize='top']",
            dragBottom: "[resize='bottom']"
        });
        this.resizeWidgets[0] = resizeWidget;
    }
};

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
            this.isGrid = this.detectGrid();
            this.gridWidth = 0;
            this.gridHeight = 0;
            // this.missingWidth = 0;
            // this.missingHeight = 0;
            this.limitSpan = 0;
            this.widthSpan = 0;
            this.heightSpan = 0;
            this.originClassAttribute = this.resizeWidget.getAttribute('class');

            DIRECTIONS.map(d => {
                this.Drags[d] = this.resizeWidget.querySelector(handleObj['drag' + d.charAt(0).toUpperCase() + d.slice(1)]);
            });

            this.bindListeners();
            this.initResize();

            //this is just for grid system
            this.getGridProperty();
            window.addEventListener('resize', this.checkGridColumns.bind(this));
        }
    },

    getGridProperty: function() {
        if(!this.resizeWidget.parentNode) return;
        let compStyles = window.getComputedStyle(this.resizeWidget.parentNode);
        // let currentCompStyles = window.getComputedStyle(this.resizeWidget);
        let gridColumns = compStyles.gridTemplateColumns;
        let height = compStyles.gridAutoRows;
        
        // console.log(compStyles)
        if(gridColumns !== 'none') {
            let width = gridColumns.split(' ');
            this.limitSpan = width.length;
            this.gridColumnGap = Number.parseInt(compStyles.gridColumnGap);
            this.gridRowGap = Number.parseInt(compStyles.gridRowGap);
            this.gridWidth = Number.parseFloat(width[0]);
            this.gridHeight = Number.parseInt(height);
            // this.missingWidth = Number.parseInt(currentCompStyles.paddingRight) + Number.parseInt(currentCompStyles.paddingLeft)
            //                     + Number.parseInt(currentCompStyles.marginRight) + Number.parseInt(currentCompStyles.marginLeft)
            //                     + Number.parseInt(currentCompStyles.borderRight) + Number.parseInt(currentCompStyles.borderLeft);
            // this.missingHeight = Number.parseInt(currentCompStyles.paddingTop) + Number.parseInt(currentCompStyles.paddingBottom)
            //                     + Number.parseInt(currentCompStyles.marginTop) + Number.parseInt(currentCompStyles.marginBottom)
            //                     + Number.parseInt(currentCompStyles.borderTop) + Number.parseInt(currentCompStyles.borderBottom);
        }
    },

    checkGridColumns: function() {
        if(typeof this.resizeWidget !== 'undefined' && this.resizeWidget.parentNode)
        {
            let compStylesOfParent = window.getComputedStyle(this.resizeWidget.parentNode);
            let spans = 0;
            let gridColumns = compStylesOfParent.gridTemplateColumns.split(' ');
            let temp = gridColumns[0];
            gridColumns.map(v => {
                if(v == temp)   spans ++;
            });
            this.limitSpan = spans;
            if(this.resizeWidget.style['grid-column-end'])
            {
                let curClassAttributes = this.resizeWidget.getAttribute('class').split(' ');
                let prevColumnState = curClassAttributes[curClassAttributes.length - 1].split('_');
                let prevSpan = Number.parseInt(prevColumnState[1]);
                let curColumnState = this.resizeWidget.style['grid-column-end'].split(' ');
                let curSpan = Number.parseInt(curColumnState[1]);
                
                let span = 0;
                if(this.limitSpan >= prevSpan)   span = prevSpan;
                else if(prevSpan > this.limitSpan) span = this.limitSpan;
                else span = Math.min(curSpan, this.limitSpan);

                this.resizeWidget.style['grid-column-end'] = 'span ' + span;
            }
        }
    },

    initResize: function() {
        DIRECTIONS.map(d => { if (this.Drags[d]) this.addListenerMulti(this.Drags[d], EVENTS[0], this.checkCorners[d]); });
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

    //this is just for grid system
    setRowEnd: function(height) {
        if(this.gridHeight) {
            this.heightSpan = Math.ceil((height - (this.heightSpan - 1) * this.gridRowGap) / this.gridHeight );
            // this.heightSpan = Math.ceil((height + this.missingHeight) / this.gridHeight);
            this.resizeWidget.style['grid-row-end'] = 'span ' + this.heightSpan;
        }
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
        let compStyles = window.getComputedStyle(this.resizeWidget);
        this.resizeWidget.style.bottom = compStyles.bottom;
        this.resizeWidget.style.top = null;
        this.resizeWidget.style.height = height + 'px';

        this.setRowEnd(height);
    },


    doBottomDrag: function(e) {
        let height = 0;

        if (e.touches)
            e = e.touches[0];

        height = this.startHeight + e.clientY - this.startY;

        if (height < 10)
            return;
        // this.resizeWidget.style.height = height + 'px';
        let compStyles = window.getComputedStyle(this.resizeWidget);
        this.resizeWidget.style.top = compStyles.top;
        this.resizeWidget.style.bottom = null;
        this.resizeWidget.style.height = height + 'px';
        this.setRowEnd(height);
    },

    //this is just for grid system
    setColumnEnd: function(width) {
        if(this.gridWidth) {
            let spans = Math.ceil((width - (this.widthSpan - 1) * this.gridColumnGap) / this.gridWidth);
            this.widthSpan = (spans > this.limitSpan) ? this.limitSpan : spans;
            this.resizeWidget.style['grid-column-end'] = 'span ' + this.widthSpan;
        }
    },

    doLeftDrag: function(e) {
        let left, width;
        if (e.touches)
            e = e.touches[0];
        left = this.startLeft + e.clientX - this.startX;
        console.log('left', left)
        width = this.startWidth - e.clientX + this.startX;

        if (width < 10)
            return;
        if (!this.isGrid)
            this.resizeWidget.style.left = left + 'px';
        // let compStyles = window.getComputedStyle(this.resizeWidget);
        // this.resizeWidget.style.right = compStyles.right;
        // this.resizeWidget.style.left = null;
        this.resizeWidget.style.width = width + 'px';

        this.setColumnEnd(width);
    },


    doRightDrag: function(e) {
        let width = 0;
        if (e.touches)
            e = e.touches[0];
        width = this.startWidth + e.clientX - this.startX;
        if (width < 10)
            return;
        
        let compStyles = window.getComputedStyle(this.resizeWidget);
        this.resizeWidget.style.left = compStyles.left;
        this.resizeWidget.style.right = null;
        this.resizeWidget.style.width = width + 'px';

        this.setColumnEnd(width);
    },

    detectGrid: function() {
        let compStyles = window.getComputedStyle(this.resizeWidget.parentNode);
        let isGrid = (compStyles.display === 'grid') ? true : false;
        this.isGrid = isGrid;
        return isGrid
    },

    stopDrag: function(e) {
        document.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });

        //this is just for grid system
        if(this.detectGrid()) {
            this.resizeWidget.style.width = null;
            this.resizeWidget.style.height = null;
            this.resizeWidget.style.left = null;
            this.resizeWidget.style.top = null;

            if(this.widthSpan)  this.resizeWidget.setAttribute('class', this.originClassAttribute + ' grid-column-end:span_' + this.widthSpan);
            if(this.heightSpan) this.resizeWidget.setAttribute('class', this.originClassAttribute + ' grid-row-end:span_' + this.heightSpan);
        }

        DIRECTIONS.map(d => { this.removeListenerMulti(document.documentElement, EVENTS[0], this.doDrags[d]) });
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
        if (!elem) return;
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
            element.addEventListener(events[i], listener, { passive: false });
        }
    },

    // Remove multiiple events from a listener
    removeListenerMulti: function(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.removeEventListener(events[i], listener, { passive: false });
        }
    },

    // style="pointer-events:none" for iframe when drag event starts
    processIframe: function() {
        document.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });
    }
};

observer.init({
    name: 'CoCreateResize',
    observe: ['addedNodes'],
    selector: "[resizable]:not([resizable='false'])",
    callback: function(mutation) {
        coCreateResize.initElement(mutation.target);

    }
});

coCreateResize.init({
    selector: "[resizable]:not([resizable='false'])",
    dragLeft: "[resize='left']",
    dragRight: "[resize='right']",
    dragTop: "[resize='top']",
    dragBottom: "[resize='bottom']",
});
export default coCreateResize;
