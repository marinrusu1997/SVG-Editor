document.addEventListener("DOMContentLoaded", function () {
    const shapesSelection = document.querySelector("#shapes");
    const textInput = document.querySelector("#textInput");
    const fillCollorSelection = document.querySelector("#fillCollor");
    const strokeCollorSelection = document.querySelector("#strokeCollor");
    const strokeTypeSelection = document.querySelector("#strokes");
    const opacitySelection = document.querySelector("#opacity");
    const svg = document.querySelector("svg");

    const shapesCollectionCssSelector = "#shapes-collection";
    const shapesCollection = document.querySelector(shapesCollectionCssSelector);

    const shapesSelectionMap = new Map();

    const DashedStrokeStylePosition = 1;

    const RectangleSelectionPosition = 0;
    const ElipseSelectionPosition = 1;
    const LineSelectionPosition = 2;
    const TextSelectionPosition = 3;
    const PolygonSelectionPosition = 4;
    const StarSelectionPosition = 5;

    const MOUSE_LEFT = 1;
    const MOUSE_RIGHT = 3;

    const SelectedItemCSSClass = "selected-item";

    const ShapeTypes = ['rect', 'ellipse', 'line', 'text', 'polygon'];

    const successSound = new Audio("./media/success.mp3");
    const errorSound = new Audio("./media/error.mp3");
    const updateSound = new Audio("./media/update.mp3");
    const deleteSound = new Audio("./media/delete.mp3");

    let X = 0, Y = 0;
    let currentSelectedShape = null;
    let IsShapeDrawing = false;

    document.onselectstart = new Function("return false");


    function isDashedStrokeStyleSelected() {
        if (strokeTypeSelection.value == DashedStrokeStylePosition)
            return true;
        return false;
    }

    function setDefaultGlobalStyles(model) {
        model.style.fill = fillCollorSelection.value;
        model.style.fillOpacity = opacitySelection.value;
        model.style.stroke = strokeCollorSelection.value;
        model.style.strokeOpacity = 1;
        model.style.strokeWidth = 2;
        if (isDashedStrokeStyleSelected())
            model.style.strokeDasharray = "3,3";
        model.textContent = textInput.value;
        model.setAttribute("font-size", 50);
        model.setAttribute("font-family", textInput.style.fontFamily);
        return model;
    }

    function hide(model) {
        model.style.display = "none";
    }

    function unselectAll() {
        ShapeTypes.forEach(function (type) {
            $(shapesCollectionCssSelector + " " + type).removeClass(SelectedItemCSSClass);
        });
        currentSelectedShape = null;
    }

    function tryTranslateCurrentSelectedShape(MouseX, MouseY) {
        if (currentSelectedShape != null) {
            currentSelectedShape.setSelfXYRCoordinates(currentSelectedShape, MouseX, MouseY, currentSelectedShape.mySavedRadius);
            successSound.play();
        } else
            errorSound.play();
    }

    function makeSelectable(prototype, setXYRCoordinates, radius) {
        $(prototype).mousedown(function (e) {
            if (e.which == MOUSE_RIGHT) {
                unselectAll();
                currentSelectedShape = this;
                currentSelectedShape['setSelfXYRCoordinates'] = setXYRCoordinates;
                currentSelectedShape['mySavedRadius'] = radius;
                $(currentSelectedShape).addClass(SelectedItemCSSClass);
            }
        });
        return prototype;
    }

    $.contextMenu({
        selector: 'svg',
        items: {
            "update": {
                name: "Update",
                icon: "edit",
                callback: function (key, opt) {
                    if (currentSelectedShape != null) {
                        setDefaultGlobalStyles(currentSelectedShape);
                        currentSelectedShape = null;
                        updateSound.play();
                    } else
                        errorSound.play();
                }
            },
            "delete": {
                name: "Delete",
                icon: "delete",
                callback: function (key, opt) {
                    if (currentSelectedShape != null) {
                        currentSelectedShape.remove();
                        currentSelectedShape = null;
                        deleteSound.play();
                    } else
                        errorSound.play();
                }
            },
            "sep1": "---------",
            "quit": {
                name: "Quit",
                icon: function () {
                    return 'context-menu-icon context-menu-icon-quit';
                },
                callback: function (key, opt) {
                    return;
                }
            }
        }
    });


    shapesSelectionMap.set(shapesSelection.options[RectangleSelectionPosition].value,
        {
            ['model']: document.createElementNS("http://www.w3.org/2000/svg", "rect"),
            ['radius']:0,
            ['setXYRCoordinates']: function (model, x, y,r) {
                model.setAttribute("x", x);
                model.setAttribute("y", y);
            },
            ['show']: function () {
                this.model.style.display = "inline";
                setDefaultGlobalStyles(this.model);
            },
            ['updateCoordinates']: function (model, MouseX, MouseY) {
                model.setAttribute("x", Math.min(X, MouseX));
                model.setAttribute("y", Math.min(Y, MouseY));
                model.setAttribute("width", Math.abs(MouseX - X));
                model.setAttribute("height", Math.abs(MouseY - Y));
            },
            ['getProtype']: function (MouseX, MouseY) {
                let prototype = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                setDefaultGlobalStyles(prototype);
                this.updateCoordinates(prototype, MouseX, MouseY);

                return prototype;
            }
        });
    shapesSelectionMap.set(shapesSelection.options[ElipseSelectionPosition].value,
        {
            ['model']: document.createElementNS("http://www.w3.org/2000/svg", "ellipse"),
            ['radius']: 0,
            ['setXYRCoordinates']: function (model, x, y,r) {
                model.setAttribute("cx", x);
                model.setAttribute("cy", y);
            },
            ['show']: function () {
                this.model.style.display = "inline";
                setDefaultGlobalStyles(this.model);
            },
            ['updateCoordinates']: function (model, MouseX, MouseY) {
                model.setAttribute("cx", Math.min(X, MouseX));
                model.setAttribute("cy", Math.min(Y, MouseY));
                model.setAttribute("rx", Math.abs(MouseX - X));
                model.setAttribute("ry", Math.abs(MouseY - Y));
            },
            ['getProtype']: function (MouseX, MouseY) {
                let prototype = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                setDefaultGlobalStyles(prototype);
                this.updateCoordinates(prototype, MouseX, MouseY);
                return prototype;
            }
        });
    shapesSelectionMap.set(shapesSelection.options[LineSelectionPosition].value,
        {
            ['model']: document.createElementNS("http://www.w3.org/2000/svg", "line"),
            ['radius']: 0,
            ['setXYRCoordinates']: function (model, x, y,r) {
                let xOffset = $(model).attr("x2") - $(model).attr("x1");
                let yOffset = $(model).attr("y2") - $(model).attr("y1");
                let x2 = x + xOffset;
                let y2 = y + yOffset;

                model.setAttribute("x1", x);
                model.setAttribute("y1", y);
                model.setAttribute("x2", x2);
                model.setAttribute("y2", y2);
            },
            ['show']: function () {
                this.model.style.display = "inline";
                setDefaultGlobalStyles(this.model);
            },
            ['updateCoordinates']: function (model, MouseX, MouseY) {
                model.setAttribute("x1", X);
                model.setAttribute("y1", Y);
                model.setAttribute("x2", MouseX);
                model.setAttribute("y2", MouseY);
            },
            ['getProtype']: function (MouseX, MouseY) {
                let prototype = document.createElementNS("http://www.w3.org/2000/svg", "line");
                setDefaultGlobalStyles(prototype);
                this.updateCoordinates(prototype, MouseX, MouseY);
                return prototype;
            }
        });
    shapesSelectionMap.set(shapesSelection.options[TextSelectionPosition].value,
        {
            ['model']: document.createElementNS("http://www.w3.org/2000/svg", "text"),
            ['radius']: 0,
            ['setXYRCoordinates']: function (model, x, y,r) {
                model.setAttribute("x", x);
                model.setAttribute("y", y);
            },
            ['show']: function () {
                this.model.style.display = "inline";
                setDefaultGlobalStyles(this.model);
            },
            ['updateCoordinates']: function (model, MouseX, MouseY) {
                let hypotenuse = Math.hypot(MouseX - X, MouseY - Y);
                let adjacent = Math.sqrt(Math.pow((X - MouseX), 2) + 0);
                let radian = Math.acos(adjacent / hypotenuse) * (180 / Math.PI);

                if (MouseX >= X && MouseY <= Y) // IV
                    radian = 360 - radian;
                if (MouseX <= X && MouseY <= Y) // III
                    radian = 360 - 90 - (90 - radian);
                if (MouseX <= X && MouseY >= Y) // II
                    radian = 90 + (90 - radian);

                let transformation = "";
                if (!isNaN(radian))
                    transformation = "rotate(" + radian + "," + X + "," + Y + ")";

                model.style.fontSize = hypotenuse;

                model.setAttribute("x", X);
                model.setAttribute("y", Y);
                model.setAttribute("transform", transformation);
            },
            ['getProtype']: function (MouseX, MouseY) {
                let prototype = document.createElementNS("http://www.w3.org/2000/svg", "text");
                setDefaultGlobalStyles(prototype);

                prototype.textContent = textInput.value;
                prototype.setAttribute("font-size", 50);
                prototype.setAttribute("font-family", textInput.style.fontFamily);
                this.updateCoordinates(prototype, MouseX, MouseY);

                return prototype;
            }
        })
    shapesSelectionMap.set(shapesSelection.options[PolygonSelectionPosition].value, {
        ['model']: document.createElementNS("http://www.w3.org/2000/svg", "polygon"),
        ['X']: 0,
        ['Y']: 0,
        ['radius']: 0,
        ['centered']: false,
        ['setXYRCoordinates']: function (model, x, y, r) {
            let points = [];
            let n = 5;
            for (let i = 0; i < n; i++) {
                points.push([x + r * Math.sin(2 * Math.PI * i / n),
                y + r * Math.cos(2 * Math.PI * i / n)]);
            }
            $(model).attr("points", Math.abs(points[3][0]) + "," + Math.abs(points[3][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[4][0]) + "," + Math.abs(points[4][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[0][0]) + "," + Math.abs(points[0][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[1][0]) + "," + Math.abs(points[1][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[2][0]) + "," + Math.abs(points[2][1]) + " ");
        },
        ['show']: function () {
            this.model.style.display = "inline";
            setDefaultGlobalStyles(this.model);          
        },
        ['updateCoordinates']: function (model, MouseX, MouseY) {
            if (!this.centered) {
                this.X = MouseX;
                this.Y = MouseY;
                this.centered = true;
            }
            let points = [];
            let r = Math.sqrt(Math.pow((this.X - MouseX), 2) + Math.pow((this.Y - MouseY), 2));
            let n = 5;
            for (let i = 0; i < n; i++) {
                points.push([this.X + r * Math.sin(2 * Math.PI * i / n),
                this.Y + r * Math.cos(2 * Math.PI * i / n)]);
            }
            $(this.model).attr("points", Math.abs(points[3][0]) + "," + Math.abs(points[3][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[4][0]) + "," + Math.abs(points[4][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[0][0]) + "," + Math.abs(points[0][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[1][0]) + "," + Math.abs(points[1][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[2][0]) + "," + Math.abs(points[2][1]) + " ");

        },
        ['getProtype']: function (MouseX, MouseY) {
            let prototype = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            setDefaultGlobalStyles(prototype);

            $(prototype).attr("points", $(this.model).attr("points"));
            $(this.model).attr("points", "");
            this.radius = Math.sqrt(Math.pow((this.X - MouseX), 2) + Math.pow((this.Y - MouseY), 2));
            this.centered = false;

            return prototype;
        }
    });
    shapesSelectionMap.set(shapesSelection.options[StarSelectionPosition].value, {
        ['model']: document.createElementNS("http://www.w3.org/2000/svg", "polygon"),
        ['X']: 0,
        ['Y']: 0,
        ['radius']: 0,
        ['centered']: false,
        ['setXYRCoordinates']: function (model, x, y, r) {
            let points = [];
            let n = 5;
            for (let i = 0; i < n; i++) {
                points.push([x + r * Math.sin(2 * Math.PI * i / n),
                y + r * Math.cos(2 * Math.PI * i / n)]);
            }
            $(model).attr("points", Math.abs(points[0][0]) + "," + Math.abs(points[0][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[3][0]) + "," + Math.abs(points[3][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[1][0]) + "," + Math.abs(points[1][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[4][0]) + "," + Math.abs(points[4][1]) + " ");
            $(model).attr("points", $(model).attr("points") + Math.abs(points[2][0]) + "," + Math.abs(points[2][1]) + " ");
        },
        ['show']: function () {
            this.model.style.display = "inline";
            setDefaultGlobalStyles(this.model);
        },
        ['updateCoordinates']: function (model, MouseX, MouseY) {
            if (!this.centered) {
                this.X = MouseX;
                this.Y = MouseY;
                this.centered = true;
            }
            let points = [];
            let r = Math.sqrt(Math.pow((this.X - MouseX), 2) + Math.pow((this.Y - MouseY), 2));
            let n = 5;
            for (let i = 0; i < n; i++) {
                points.push([this.X + r * Math.sin(2 * Math.PI * i / n),
                this.Y + r * Math.cos(2 * Math.PI * i / n)]);
            }
            $(this.model).attr("points", Math.abs(points[0][0]) + "," + Math.abs(points[0][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[3][0]) + "," + Math.abs(points[3][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[1][0]) + "," + Math.abs(points[1][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[4][0]) + "," + Math.abs(points[4][1]) + " ");
            $(this.model).attr("points", $(this.model).attr("points") + Math.abs(points[2][0]) + "," + Math.abs(points[2][1]) + " ");

        },
        ['getProtype']: function (MouseX, MouseY) {
            let prototype = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            setDefaultGlobalStyles(prototype);

            $(prototype).attr("points", $(this.model).attr("points"));
            $(this.model).attr("points", "");
            this.radius = Math.sqrt(Math.pow((this.X - MouseX), 2) + Math.pow((this.Y - MouseY), 2));
            this.centered = false;

            return prototype;
        }
    });

    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[RectangleSelectionPosition].value).model);
    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[ElipseSelectionPosition].value).model);
    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[LineSelectionPosition].value).model);
    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[TextSelectionPosition].value).model);
    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[PolygonSelectionPosition].value).model);
    svg.appendChild(shapesSelectionMap.get(shapesSelection.options[StarSelectionPosition].value).model);

    svg.addEventListener("mousedown", function (e) {     
        X = e.clientX - svg.getBoundingClientRect().left;
        Y = e.clientY - svg.getBoundingClientRect().top;
        if (e.which == MOUSE_LEFT) {
            let ModelObject = shapesSelectionMap.get(shapesSelection.value);
            unselectAll();     
            ModelObject.show();
            ModelObject.updateCoordinates(ModelObject.model, X, Y);
            IsShapeDrawing = true;
        }
    });

    svg.addEventListener("mouseup", function (e) {
        var MouseX = e.clientX - svg.getBoundingClientRect().left;
        var MouseY = e.clientY - svg.getBoundingClientRect().top;
        if (e.which == MOUSE_LEFT) {
            let ModelObject = shapesSelectionMap.get(shapesSelection.value);     
            hide(ModelObject.model);
            shapesCollection.appendChild(makeSelectable(ModelObject.getProtype(MouseX, MouseY), ModelObject.setXYRCoordinates, ModelObject.radius));
            successSound.play();
            IsShapeDrawing = false;
        } else if (e.which == MOUSE_RIGHT) {
            tryTranslateCurrentSelectedShape(MouseX, MouseY);
        }
    });

    svg.addEventListener("mousemove", function (e) {
        if (IsShapeDrawing) {
            let ModelObject = shapesSelectionMap.get(shapesSelection.value);
            var MouseX = e.clientX - svg.getBoundingClientRect().left;
            var MouseY = e.clientY - svg.getBoundingClientRect().top;
            ModelObject.updateCoordinates(ModelObject.model, MouseX, MouseY);
        }
    });
});