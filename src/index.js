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
        let gridColumns = compStyles.gridTemplateColumns;
        let height = compStyles.gridAutoRows;
        
        if(gridColumns !== 'none') {
            let width = gridColumns.split(' ');
            this.limitSpan = width.length;
            this.gridColumnGap = Number.parseInt(compStyles.gridColumnGap);
            this.gridRowGap = Number.parseInt(compStyles.gridRowGap);
            this.gridWidth = Number.parseFloat(width[0]);
            this.gridHeight = Number.parseInt(height);
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
        DIRECTIONS.map(d => { 
            if (this.Drags[d]) 
                this.addListenerMulti(this.Drags[d], EVENTS[0], this.checkCorners[d]); 
            console.log('checkCorner', this.checkCorners[d])
            console.log('drags', this.Drags[d])
        });
    },

    checkDragImplementation: function(e, from, to, offset, fcur, scur) {
        if (e.touches)
            e = e.touches[0];
        let other;
        if (to == 'top')
            other = 'bottom'
        else if (to == 'bottom')
            other = 'top'
        else if (to == 'left')
            other = 'right'
        else if (to == 'right')
            other = 'left'
        this.removeListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[from]);
        this.removeListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[to]);
        this.removeListenerMulti(this.Drags[from], EVENTS[1], this.initDrags[other]);
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
        e.preventDefault();

        if (!this.resizeWidget.hasAttribute('resizing')){
            this.resizeWidget.setAttribute('resizing', '')
        }

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
        console.log('resize-top')
    },
    initBottomDrag: function(e) {
        this.initDrag(e, 'bottom');
        console.log('resize-bottom')
    },
    initLeftDrag: function(e) {
        this.initDrag(e, 'left');
        console.log('resize-left')

    },
    initRightDrag: function(e) {
        this.initDrag(e, 'right');
        console.log('resize-right')
    },

    //this is just for grid system
    setRowEnd: function(height) {
        if(this.gridHeight) {
            this.heightSpan = Math.ceil((height - (this.heightSpan - 1) * this.gridRowGap) / this.gridHeight );
            this.resizeWidget.style['grid-row-end'] = 'span ' + this.heightSpan;
            this.collaborate({rowEnd: this.heightSpan})
        }
    },

    doTopDrag: function(e) {
        let top, height;

        if (e.touches)
            e = e.touches[0];
        top = this.startTop + e.clientY - this.startY;
        height = this.startHeight - e.clientY + this.startY;

        if (height < 10)
            return;
        if (!this.isGrid) {
            this.resizeWidget.style.top = top + 'px';
            this.collaborate({top, height})
        }
        this.resizeWidget.style.height = height + 'px';
        this.setRowEnd(height);
    },


    doBottomDrag: function(e) {
        let height;

        if (e.touches)
            e = e.touches[0];

        height = this.startHeight + e.clientY - this.startY;

        if (height < 10)
            return;
        if (!this.isGrid)
            this.collaborate({height})
    
        this.resizeWidget.style.height = height + 'px';
        this.setRowEnd(height);
    },

    //this is just for grid system
    setColumnEnd: function(width) {
        if(this.gridWidth) {
            let spans = Math.ceil((width - (this.widthSpan - 1) * this.gridColumnGap) / this.gridWidth);
            this.widthSpan = (spans > this.limitSpan) ? this.limitSpan : spans;
            this.resizeWidget.style['grid-column-end'] = 'span ' + this.widthSpan;
            this.collaborate({columnEnd: this.widthSpan})
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
        if (!this.isGrid) {
            this.resizeWidget.style.left = left + 'px';
            this.collaborate({left, width})
        }

        this.resizeWidget.style.width = width + 'px';
        this.setColumnEnd(width);
    },


    doRightDrag: function(e) {
        let width;
        if (e.touches)
            e = e.touches[0];
        width = this.startWidth + e.clientX - this.startX;
        if (width < 10)
            return;

        if (!this.isGrid)
            this.collaborate({width})
    
        this.resizeWidget.style.width = width + 'px';
        this.setColumnEnd(width);
    },

    detectGrid: function() {
        let isGrid = false;
        if (this.resizeWidget.parentNode) {
            let compStyles = window.getComputedStyle(this.resizeWidget.parentNode);
            isGrid = (compStyles.display === 'grid');
        }
        this.isGrid = isGrid;
        return isGrid;
    },

    stopDrag: function(e) {
        document.querySelectorAll('iframe').forEach(function(item) {
            item.style.pointerEvents = null;
        });
        if (this.resizeWidget.hasAttribute('resizing')){
            this.resizeWidget.removeAttribute('resizing', '')
        }

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
    checkLeftCorners: function(e) {
        let offset = e.clientY - this.getDistance(this.Drags['left'], true) + document.documentElement.scrollTop;
        if (offset > 10) {
            offset = this.getDistance(this.Drags['left'], true) + this.Drags['left'].clientHeight - e.clientY - document.documentElement.scrollTop;
            this.checkDragImplementation(e, 'left', 'bottom', offset, 'ne-resize', 'e-resize');
        } else {
            this.checkDragImplementation(e, 'left', 'top', offset, 'se-resize', 'e-resize');
        }
    },
    checkTopCorners: function(e) {
        let offset = e.clientX - this.getDistance(this.Drags['top'], false) + document.documentElement.scrollTop;
        if (offset > 10) {
            offset = this.getDistance(this.Drags['top'], false) + this.Drags['top'].clientWidth - e.clientX - document.documentElement.scrollLeft;
            this.checkDragImplementation(e, 'top', 'right', offset, 'ne-resize', 's-resize');
        } else {
            this.checkDragImplementation(e, 'top', 'left', offset, 'se-resize', 's-resize');
        }
    },
    checkBottomCorners: function(e) {
        let offset = e.clientX - this.getDistance(this.Drags['bottom'], false) + document.documentElement.scrollTop;
        if (offset > 10) {
            offset = this.getDistance(this.Drags['bottom'], false) + this.Drags['bottom'].clientWidth - e.clientX - document.documentElement.scrollLeft;
            this.checkDragImplementation(e, 'bottom', 'right', offset, 'se-resize', 's-resize');
        } else {
            this.checkDragImplementation(e, 'bottom', 'left', offset, 'ne-resize', 's-resize');
        }
    },
    checkRightCorners: function(e) {
        let offset = e.clientY - this.getDistance(this.Drags['right'], true) + document.documentElement.scrollTop;
        if (offset > 10) {
            offset = this.getDistance(this.Drags['right'], true) + this.Drags['right'].clientHeight - e.clientY - document.documentElement.scrollTop;
            this.checkDragImplementation(e, 'right', 'bottom', offset, 'se-resize', 'e-resize');
        } else {
            this.checkDragImplementation(e, 'right', 'top', offset, 'ne-resize', 'e-resize');
        }
    },

    bindListeners: function() {
        this.doDrags['left'] = this.doLeftDrag.bind(this);
        this.doDrags['top'] = this.doTopDrag.bind(this);
        this.doDrags['right'] = this.doRightDrag.bind(this);
        this.doDrags['bottom'] = this.doBottomDrag.bind(this);

        this.stopDrag = this.stopDrag.bind(this);

        this.checkCorners['left'] = this.checkLeftCorners.bind(this);
        this.checkCorners['top'] = this.checkTopCorners.bind(this);
        this.checkCorners['bottom'] = this.checkBottomCorners.bind(this);
        this.checkCorners['right'] = this.checkRightCorners.bind(this);

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
    },

    collaborate: function({left, top, width, height, rowEnd, columnEnd}) {
        if (window.CoCreate && window.CoCreate.text) {
            let domTextEditor = this.resizeWidget.closest('[contenteditable]');
            if (domTextEditor){
                if (left)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'left', value: left + 'px' 
                    })
                if (top)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'top', value: top + 'px' 
                    })
                if (width)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'width', value: width + 'px' 
                    })
                if (height)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'height', value: height + 'px' 
                    })
                if (rowEnd)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'grid-row-end', value: 'span ' + rowEnd 
                    })
                if (columnEnd)
                    CoCreate.text.setStyle({ 
                        domTextEditor, target: this.resizeWidget, property: 'grid-column-end', value: 'span ' + columnEnd 
                    })
            }
        }
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
