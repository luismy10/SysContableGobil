export class Tree {

    constructor(element) {
        const openedClass = 'fa-minus-square';
        const closedClass = 'fa-plus-square';

        let three = document.querySelector(element);
        three.classList.add("tree");

        let button = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('i')
        });

        button.forEach(function (elem) {
            elem.classList.add('branch');
            elem.querySelector('i').addEventListener("click", function () {
                if (elem.childNodes[0].classList.contains(openedClass)) {
                    elem.childNodes[0].classList.replace(openedClass, closedClass);
                } else {
                    elem.childNodes[0].classList.replace(closedClass, openedClass);
                }

                elem.querySelector('ul').childNodes.forEach(function (li) {
                    if (li.classList.contains('display-block')) {
                        li.classList.replace("display-block", "display-none");
                    } else {
                        li.classList.replace("display-none", "display-block");
                    }

                    if (li.querySelector('ul') === null) {
                        if (li.querySelector('input').classList.contains('display-initial')) {
                            li.querySelector('input').classList.replace("display-initial", "display-none");
                        } else {
                            li.querySelector('input').classList.replace("display-none", "display-initial");
                        }
                    }
                })

                if (elem.querySelector('input').classList.contains('display-initial')) {
                    elem.querySelector('input').classList.replace("display-initial", "display-none");
                } else {
                    elem.querySelector('input').classList.replace("display-none", "display-initial");
                }
            });
        });

        let li = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('ul')
        });

        li.forEach(function (elem) {
            elem.querySelector('ul').childNodes.forEach(function (li) {
                li.classList.add("display-none");
            })
        });

        let input = [].filter.call(three.querySelectorAll('li'), function (elem) {
            return elem.querySelector('input')
        });

        input.forEach(function (elem) {
            if (elem.parentNode.parentNode.tagName === 'DIV' && elem.querySelector('ul') === null) {
                elem.querySelector('input').classList.add("display-initial");
            } else {
                elem.querySelector('input').classList.add("display-none");
            }
        });
    }

}

export class TreeTable {

    constructor(element) {

        this.openedClass = 'fa-minus-square';
        this.closedClass = 'fa-plus-square';

        this.three = document.querySelector(element);

        let button = [].filter.call(this.three.querySelectorAll('tr'), function (elem) {
            return elem.querySelector('i').getAttribute("data-idbtn") !== null;
        });

        button.forEach((elem) => {
            if (elem.querySelector('i').getAttribute("data-idbtn") !== null) {
                elem.querySelector('i').addEventListener("click", (event) => {
                    this.closeTr(elem, true)
                });
            }
        });

        let tr = [].filter.call(this.three.querySelectorAll('tr'), function (elem) {
            return elem.getAttribute("data-idrow") !== "0";
        });

        tr.forEach(function (elem) {
            elem.classList.add("display-none")
        });
    }

    closeTr(elem, stopNone) {
        if (elem.querySelector('i').classList.contains(this.openedClass) && stopNone) {
            elem.querySelector('i').classList.replace(this.openedClass, this.closedClass)
        } else {
            if (!stopNone) {
                elem.querySelector('i').classList.replace(this.openedClass, this.closedClass)
            } else {
                elem.querySelector('i').classList.replace(this.closedClass, this.openedClass)
            }
        }

        let tr = [].filter.call(this.three.querySelectorAll('tr'), function (elemtr) {
            return elemtr.getAttribute("data-subidtr");
        });

        tr.forEach((elemv) => {
            if (elemv.getAttribute("data-subidtr") === elem.getAttribute("data-idtr")) {
                if (elemv.classList.contains("display-none") && stopNone) {
                    elemv.classList.replace("display-none", "display-table-row");
                } else {
                    elemv.classList.replace("display-table-row", "display-none");
                    this.closeTr(elemv, false);
                }
            }
        });
    }

}
