"use strict";
class Elem {
    constructor(svg, tag) {
        this.elem = document.createElementNS(svg.namespaceURI, tag);
        svg.appendChild(this.elem);
    }
    attr(name, value) {
        if (typeof value === 'undefined') {
            return this.elem.getAttribute(name);
        }
        this.elem.setAttribute(name, value.toString());
        return this;
    }
    observe(event) {
        return Observable.fromEvent(this.elem, event);
    }
    destroy(svg) {
        svg.removeChild(this.elem);
    }
}
//# sourceMappingURL=svgelement.js.map