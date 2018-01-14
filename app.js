/**
 *  ______  __      ______  __    __  ______  ______  ______  __  __   __  ______  __  __  __  __  _____
 * /\  __ \/\ \    /\  ___\/\ "-./  \/\  __ \/\  == \/\__  _\/\ \/\ "-.\ \/\  == \/\ \/\ \/\ \/\ \/\  __-.
 * \ \ \/\ \ \ \___\ \  __\\ \ \-./\ \ \  __ \ \  __<\/_/\ \/\ \ \ \ \-.  \ \  __<\ \ \_\ \ \ \_\ \ \ \/\ \
 *  \ \_____\ \_____\ \_____\ \_\ \ \_\ \_\ \_\ \_\ \_\ \ \_\ \ \_\ \_\\"\_\ \_\ \_\ \_____\ \_____\ \____-
 *   \/_____/\/_____/\/_____/\/_/  \/_/\/_/\/_/\/_/ /_/  \/_/  \/_/\/_/ \/_/\/_/ /_/\/_____/\/_____/\/____/
 *
 */

Object.prototype.copy = function () {
    var res = {};
    for(var id in this){
        if(this.hasOwnProperty(id)){
            res[id] = this[id];
        }
    }
    return res;
};
Object.prototype.extend = function (sources) {
    if (Array.isArray(sources)) {
        for (var i = sources.length-1; i >= 0; i--) {
            this.extend(sources[i]);
        }
    } else {
        for (var k in sources) {
            if (sources.hasOwnProperty(k)) {
                var res = sources[k];
                if(this[k]) {
                    res = (function (id) {
                        var old = this[id],
                            neew = sources[id];
                        return function () {
                            old.apply(this,arguments);
                            return neew.apply(this,arguments);
                        };
                    }).call(this,k);
                }
                this[k] = res;
            }
        }
    }
};
Math.calc = {
    geometry: {
        distance: function (pt1, pt2) {
            return Math.sqrt((pt1.x - pt2.x)*(pt1.x - pt2.x)+(pt1.y - pt2.y)*(pt1.y - pt2.y));
        },
        median: function (pt1, pt2) {
            return { x: (pt1.x + pt2.x) / 2, y: (pt1.y + pt2.y) / 2 };
        },
        gradient: function (pt1, pt2) {
            return (pt2.y - pt1.y)/(pt2.x - pt1.x);
        },
        point: {
            draw: function (pt,ctx,size,color) {
                var s = size || 4;
                ctx.save();
                ctx.strokeStyle = color || "white";
                ctx.translate(pt.x,pt.y);
                ctx.beginPath();
                ctx.moveTo(-s,-s);
                ctx.lineTo(s,s);
                ctx.moveTo(-s,s);
                ctx.lineTo(s,-s);
                ctx.stroke();
                ctx.restore();
            }
        },
        vector: {
            fromTo: function (pt1, pt2) {
                return {x:pt2.x - pt1.x,y:pt2.y-pt1.y};
            },
            length: function (vec) {
                return Math.sqrt(vec.x*vec.x+vec.y*vec.y);
            },
            dot: function (vec1, vec2) {
                return vec1.x * vec2.x + vec2.y * vec2.y;
            },
            normal: function (vec) {
                return { x: -vec.y, y: vec.x };
            },
            direction: function (vec) {
                var length = Math.calc.geometry.vector.length(vec);
                return { x: vec.x/length, y: vec.y/length };
            }
        },
        area: {
            triangle: {
                threePoints: function (pt1, pt2, pt3) {
                    return Math.calc.geometry.area.triangle.twoVectors(Math.calc.geometry.vector.fromTo(pt1, pt2),Math.calc.geometry.vector.fromTo(pt1, pt3));
                },
                twoVectors: function (vec1, vec2) {
                    return Math.abs(0.5 * ((vec1.x * vec2.y) - (vec1.y * vec2.x)));
                }
            }
        },
        circle: {
            fromThreePoints: function (pt1, pt2, pt3) {
                var m1 = Math.calc.geometry.median(pt1,pt2),
                    m2 = Math.calc.geometry.median(pt1,pt3),
                    g1 = -1/Math.calc.geometry.gradient(pt1,pt2),
                    g2 = -1/Math.calc.geometry.gradient(pt1,pt3),
                    center = { x:0, y:0 };

                if(!isFinite(g1) && !isFinite(g2)){
                    return false;
                } else if(!isFinite(g1)) {
                    center.x = m1.x;
                    center.y = (g2*(center.x - m2.x)) + m2.y;
                } else if(!isFinite(g2)) {
                    center.x = m2.x;
                    center.y = (g1*(center.x - m1.x)) + m1.y;
                } else {
                    center.x = ((g1 * m1.x) - (g2 * m2.x) - m1.y + m2.y) / (g1 - g2);
                    center.y = ((g1 * g2 * (m1.x - m2.x)) + g1 * m2.y - g2 * m1.y) / (g1 - g2);
                }

                return {
                    center: center,
                    radius: Math.calc.geometry.distance(center,pt1)
                };
            },
            withinTriangle: function (pt1, pt2, pt3) {
                var A = pt1, B = pt2, C = pt3;

                var AB = Math.calc.geometry.vector.fromTo(A,B),
                    AC = Math.calc.geometry.vector.fromTo(A,C),
                    BC = Math.calc.geometry.vector.fromTo(B,C);

                var dir = {
                    ab: Math.calc.geometry.vector.direction(AB),
                    ac: Math.calc.geometry.vector.direction(AC),
                    bc: Math.calc.geometry.vector.direction(BC)
                };

                var bisect = {
                    m1: { x: (dir.ab.x + dir.ac.x)/2, y: (dir.ab.y + dir.ac.y)/2 }, //Bisected angle between ab and ac
                    m2: { x: ((-dir.ab.x) + dir.bc.x)/2, y: ((-dir.ab.y) + dir.bc.y)/2 } //Bisected angle between ba and bc
                };
                var u = ((bisect.m1.x*(A.y - B.y) + bisect.m1.y*(B.x - A.x)))/((bisect.m2.y*bisect.m1.x)-(bisect.m2.x*bisect.m1.y));
                return { center: { x: B.x + u * bisect.m2.x, y: B.y + u * bisect.m2.y }, radius: ((AB.x*AC.y)-(AB.y*AC.x))/(Math.calc.geometry.vector.length(AB)+Math.calc.geometry.vector.length(AC)+Math.calc.geometry.vector.length(BC)) };
            }
        },
        collision: {
            point: {
                rect: function (pt, rect) {
                    return !(pt.x < rect.x || pt.y < rect.y || pt.x > rect.x + rect.width || pt.y > rect.y + rect.height);
                },
                path: function (tmp_ctx, pt, path, global, rotation, scale) {
                    tmp_ctx.clearRect(0, 0, tmp_ctx.canvas.width, tmp_ctx.canvas.height);
                    tmp_ctx.save();
                    tmp_ctx.beginPath();
                    if(scale) tmp_ctx.scale(scale.x,scale.y);
                    if(global) tmp_ctx.translate(global.x, global.y);
                    if(rotation) tmp_ctx.rotate(rotation);
                    for (var i = 0; i < path.length; i++) {
                        if (i == 0) tmp_ctx.moveTo(path[i].x, path[i].y);
                        else tmp_ctx.lineTo(path[i].x, path[i].y);
                    }
                    tmp_ctx.lineTo(path[0].x,path[0].y);
                    var res = tmp_ctx.isPointInPath(pt.x, pt.y);
                    tmp_ctx.restore();
                    return res;
                },
                circle: function (pt, circle) {
                    return ((pt.x - circle.center.x)*(pt.x - circle.center.x)+(pt.y - circle.center.y)*(pt.y - circle.center.y) <= circle.radius*circle.radius);
                }
            },
            circle: {
                line: function (circle, pt1, pt2, distPt1Pt2) {
                    return (((circle.center.x - pt1.x) * (pt2.y * pt1.y) - (circle.center.y - pt1.y) * (pt2.x - pt2.y)) / (distPt1Pt2 ? distPt1Pt2 : Math.calc.geometry.distance(pt1,pt2))) <= circle.radius;
                },
                rect: {
                    accurate: function (circle, rect) {
                        return (Math.calc.geometry.collision.point.rect({x:circle.center.x,y:circle.center.y},rect)
                        || Math.calc.geometry.collision.circle.line(circle,{x:rect.x,y:rect.y},{x:rect.x+rect.width,y:rect.y},rect.width)
                        || Math.calc.geometry.collision.circle.line(circle,{x:rect.x,y:rect.y},{x:rect.x,y:rect.y+rect.height},rect.width)
                        || Math.calc.geometry.collision.circle.line(circle,{x:rect.x,y:rect.y+rect.height},{x:rect.x+rect.width,y:rect.y+rect.height},rect.height)
                        || Math.calc.geometry.collision.circle.line(circle,{x:rect.x+rect.width,y:rect.y},{x:rect.x+rect.width,y:rect.y+rect.height},rect.height));

                    },
                    sloppy: function (circle, rect) {
                        return !(rect.x > circle.center.x + circle.radius
                        || rect.y > circle.center.y + circle.radius
                        || rect.x + rect.width < circle.center.x - circle.radius
                        || rect.y + rect.height < circle.center.y - circle.radius);
                    }
                }
            }
        }
    },
    color: {
        random: function () {
            var rand_hex = '#' + ((1-Math.random()) * 0xFFFFFF << 0).toString(16);
            return (Math.calc.color.validHEX(rand_hex) ? rand_hex : Math.calc.color.random());
        },
        validHEX: function (hex) {
            return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex);
        }
    },
    input: {
        mouse: {
            getPos: function (e, canvas) {
                var rect = canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
                    y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
                };
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {

    var DEBUG = false;

    function LOG(x) {
        if(DEBUG) console.log(x);
    }

    var CONST = {
        METEOR: {
            SHOWER: {
                SPAWNTIME: 1
            },
            SPEED: {
                ROTATION: {
                    MIDDLE: 0,
                    IRREGULARITY: 0.5
                },
                MIDDLE: 80,
                IRREGULARITY: 20
            },
            VECTORAMOUNT: {
                MIDDLE: 15,
                IRREGULARITY: 4
            },
            RADIUS: {
                MIDDLE: 50,
                IRREGULARITY: 15
            },
            SHRAPNEL: {
                SPEED: {
                    ROTATION: {
                        MIDDLE: 0,
                        IRREGULARITY: 0.2
                    },
                    LIMIT: 600, //p/s -> piksler per sekund
                    COEF: 4
                }
            }
        }
    };


    //All the classes are defined bellow
    function DrawableObject(x, y) {
        this.global = { x: x || 0, y: y || 0 };
        this.color = {
            stroke: "white",
            fill: "black"
        };
        this.local = {};
        this.rotation = 0;
        this.scale = { x: 1, y: 1 };
        this.stroke = true;
        this.lineWidth = 2;
        this.fill = true;
        this.isOutOfBounds = false;
        this.isAlive = true;
        this.events = {
            "onupdate": false,
            "ondraw": false
        };
    }

    DrawableObject.prototype.update = function (dt) {
        if(this.events['onupdate']) this.events['onupdate'].call(this,dt);
    };

    DrawableObject.prototype.draw = function (ctx) {
        if(this.events['ondraw']) this.events['ondraw'].call(this,ctx);
    };

    DrawableObject.prototype.prepAndDraw = function (ctx,callback) {
        ctx.save();
        ctx.scale(this.scale.x,this.scale.y);
        ctx.translate(this.global.x,this.global.y);
        ctx.rotate(this.rotation);
        if(this.fill) ctx.fillStyle = this.color.fill;
        if(this.stroke) {
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = this.color.stroke;
        }
        if(callback) callback.call(this,ctx);
        ctx.restore();
    };


    function MovableObject(x, y) {
        DrawableObject.call(this,x,y);
        this.speed = { x: 0, y: 0, rotation: 0 };
    }

    MovableObject.prototype.update = function (dt) {
        this.global.x += this.speed.x * dt;
        this.global.y += this.speed.y * dt;
        this.rotation += this.speed.rotation * dt;
    };

    MovableObject.prototype.extend(DrawableObject.prototype);
    
    
    function Text(x,y,text,color) {
        DrawableObject.call(this,x,y);
        this.text = text;
        if(color) {
            this.color.stroke = color;
            this.color.fill = color;
        }
        this.local.x = 0;
        this.local.y = 0;
        this.font = {
            size: 16,
            family: "Arial"
        };
        this.textAlign = "start";
        this.textBaseline = "top";
        this.stroke = false;
    }

    Text.prototype.draw = function (ctx) {
        this.prepAndDraw(ctx,function (ctx) {
            ctx.font = this.font.size + 'px ' + this.font.family;
            ctx.textAlign = this.textAlign;
            ctx.textBaseline = this.textBaseline;
            if(this.fill) ctx.fillText(this.text,this.local.x,this.local.y);
            if(this.stroke) ctx.strokeText(this.text,this.local.x,this.local.y);
        });
    };

    Text.prototype.extend(DrawableObject.prototype);


    function Polygon(x, y, pt1, pt2, pt3, moveCenter) {
        MovableObject.call(this,x,y);
        this.vertices = [pt1, pt2, pt3];
        this.area = Math.calc.geometry.area.triangle.threePoints(pt1,pt2,pt3);

        var circleWithin = Math.calc.geometry.circle.withinTriangle(pt1,pt2,pt3);
        this.farthestVertexDistance = Math.max(
            Math.calc.geometry.distance(circleWithin.center,pt1),
            Math.calc.geometry.distance(circleWithin.center,pt2),
            Math.calc.geometry.distance(circleWithin.center,pt3)
        );
        this.circleAround = new Circle(this.global.x,this.global.y,circleWithin.center,this.farthestVertexDistance);

        if(moveCenter){
            this.global.x += this.circleAround.local.center.x;
            this.global.y += this.circleAround.local.center.y;

            for(var i = 0; i < this.vertices.length; i++){
                this.vertices[i].x -= this.circleAround.local.center.x;
                this.vertices[i].y -= this.circleAround.local.center.y;
            }
            this.circleAround.global.x = this.global.x;
            this.circleAround.global.y = this.global.y;
            this.circleAround.local.center.x = 0;
            this.circleAround.local.center.y = 0;
        }
    }

    Polygon.prototype.update = function (dt) {
        if(DEBUG){
            this.circleAround.global.x = this.global.x;
            this.circleAround.global.y = this.global.y;
        }
    };

    Polygon.prototype.draw = function (ctx) {
        this.prepAndDraw(ctx,function (ctx) {
            ctx.beginPath();
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            ctx.lineTo(this.vertices[1].x, this.vertices[1].y);
            ctx.lineTo(this.vertices[2].x, this.vertices[2].y);
            ctx.closePath();
            if(this.stroke) ctx.stroke();
            if(this.fill) ctx.fill();
        });
        if(DEBUG) this.circleAround.draw(ctx);
        //if(DEBUG) calc.geometry.point.draw(this.global,ctx,4,"yellow");
    };

    Polygon.prototype.extend(MovableObject.prototype);


    function Circle(x, y, center, radius, color) {
        DrawableObject.call(this,x,y);
        this.local.center = center ;
        this.radius = radius;
        if(color) {
            this.color.stroke = color;
            this.color.fill = color;
        }
        this.fill = false;
    }

    Circle.prototype.draw = function (ctx) {
        this.prepAndDraw(ctx,function (ctx) {
            ctx.beginPath();
            ctx.arc(this.local.center.x,this.local.center.y,this.radius,0,2*Math.PI);
            ctx.strokeStyle = this.color;
            ctx.fillStyle = this.color;
            if(this.stroke) ctx.stroke();
            if(this.fill) ctx.fill();
        });
        if(DEBUG) Math.calc.geometry.point.draw({x:this.global.x,y:this.global.y},ctx);
    };

    Circle.prototype.extend(DrawableObject.prototype);


    function Rectangle(x, y, pt1, pt2, color) {
        DrawableObject.call(this,x,y);
        this.local = { pt1: pt1, pt2: pt2 };
        this.width = Math.abs(pt2.x - pt1.x);
        this.height = Math.abs(pt2.y - pt1.y);
        this.fill = false;
        if(color) {
            this.color.stroke = color;
            this.color.fill = color;
        }
    }

    Rectangle.prototype.draw = function (ctx) {
        this.prepAndDraw(ctx,function (ctx) {
            if(this.fill) ctx.fillRect(this.local.pt1.x,this.local.pt1.y,this.width,this.height);
            if(this.stroke) ctx.strokeRect(this.local.pt1.x,this.local.pt1.y,this.width,this.height);
        });
    };

    Rectangle.prototype.extend(DrawableObject.prototype);


    function Meteor(x, y, r, va, ir) {
        MovableObject.call(this,x,y);
        this.outline = [];
        this.polygons = [];
        this.isExploded = false;
        this.hasJustSpawned = true;
        this.area = 0;

        var circleLeft = 2 * Math.PI, verticesLeft = va, tmp, longestR = 0, currentR;
        for (var i = 0; i < va; i++) {
            var d = (verticesLeft < 2 ? (circleLeft / verticesLeft) : (circleLeft / verticesLeft) * (Math.random() * 1.5 + 0.5));

            currentR = r + (((Math.random() * 2) - 1) * ir);

            this.outline[i] = {
                x: currentR * Math.cos(d + (2 * Math.PI - circleLeft)),
                y: currentR * Math.sin(d + (2 * Math.PI - circleLeft))
            };

            if(i > 0) this.area += Math.calc.geometry.area.triangle.twoVectors(this.outline[i-1],this.outline[i]);

            if((tmp = Math.abs(currentR)) > longestR) longestR = tmp;

            circleLeft -= d;
            verticesLeft--;
        }
        this.circleAround = new Circle(this.global.x,this.global.y,{x:0,y:0},longestR);
    }

    Meteor.prototype.explode = function (origin_global) {
        this.isExploded = true;
        var origin_local = {x: origin_global.x - this.global.x || 0, y: origin_global.y - this.global.y || 0};
        for (var i = 1; i < this.outline.length; ++i) {
            var current = this.polygons[i-1] = new Polygon(this.global.x,this.global.y,{x:origin_local.x,y:origin_local.y},this.outline[i-1].copy(),this.outline[i].copy(),true);
            current.color.stroke = this.color.stroke;
            current.color.fill = this.color.fill;

            var dir_m = Math.calc.geometry.vector.direction(Math.calc.geometry.median(current.vertices[1], current.vertices[2])),
                rel = this.area/current.area;
            var speed = rel * CONST.METEOR.SHRAPNEL.SPEED.COEF;
            if(speed > CONST.METEOR.SHRAPNEL.SPEED.LIMIT) speed = CONST.METEOR.SHRAPNEL.SPEED.LIMIT;
            current.speed.x = dir_m.x*speed;
            current.speed.y = dir_m.y*speed;
            current.speed.rotation = CONST.METEOR.SHRAPNEL.SPEED.ROTATION.MIDDLE + (CONST.METEOR.SHRAPNEL.SPEED.ROTATION.IRREGULARITY*((Math.random()*2)-1));
        }
        this.speed.rotation = 0;
        this.speed.x *= 0.3;
        this.speed.y *= 0.3;
    };

    Meteor.prototype.update = function (dt) {
        this.circleAround.global.x = this.global.x;
        this.circleAround.global.y = this.global.y;

        if(this.isExploded) {
            for (var i = 0; i < this.polygons.length; ++i) {
                this.polygons[i].update(dt);
            }
        } else {
            if (!Math.calc.geometry.collision.circle.rect.sloppy({
                    center:{
                        x:this.circleAround.global.x+this.circleAround.local.center.x,
                        y:this.circleAround.global.y+this.circleAround.local.center.y
                    },
                    radius:this.circleAround.radius
                },{x:0,y:0,width:App.width,height:App.height})) {
                this.isOutOfBounds = true;
                if (!this.hasJustSpawned) this.isAlive = false;
            } else {
                this.hasJustSpawned = false;
                this.isOutOfBounds = false;
            }
        }
    };

    Meteor.prototype.draw = function (ctx) {
        if(!this.isOutOfBounds) {
            if(this.isExploded){
                for (var i = 0; i < this.polygons.length; i++) {
                    this.polygons[i].draw(ctx);
                }
            } else {
                this.prepAndDraw(ctx,function (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(this.outline[0].x, this.outline[0].y);
                    for (var i = 1; i < this.outline.length; i++) ctx.lineTo(this.outline[i].x, this.outline[i].y);
                    ctx.closePath();
                    if (this.fill) ctx.fill();
                    if (this.stroke) ctx.stroke();
                });
            }
            if(DEBUG) this.circleAround.draw(ctx);
            if(DEBUG) Math.calc.geometry.point.draw({x:this.global.x,y:this.global.y},ctx);
        }
    };

    Meteor.prototype.collision = {
        point: function (pt) {
            if(Math.calc.geometry.collision.point.circle(pt,{
                    center:{
                    x:this.circleAround.global.x+this.circleAround.local.center.x,
                    y:this.circleAround.global.y+this.circleAround.local.center.y
                },
                radius: this.circleAround.radius}))
                if(Math.calc.geometry.collision.point.path(ctxs.tmp,pt,this.outline,this.global,this.rotation,this.scale))
                    return true;

            return false;
        }
    };

    Meteor.prototype.extend(MovableObject.prototype);


    function UI() {
        this.unclickable = [];
        this.clickable = [];
    }

    UI.prototype.addObject = function (atLayer,clickable,name,object) {
        var arr = (clickable ? this.clickable : this.unclickable);
        if(!arr[atLayer]) arr[atLayer] = {};
        arr[atLayer][name] = object;
    };

    UI.prototype.getObject = function (name,clickable,atLayer) {
        var i,id,longest = Math.max(this.clickable.length,this.unclickable.length);
        if(atLayer >= longest) return false;
        for(i = atLayer || 0; i < longest; i++){
            if(clickable === true && this.clickable[i]) {
                for (id in this.clickable[i]) {
                    if(this.clickable[i].hasOwnProperty(id)) if(name == id) return this.clickable[i][id];
                }
            }
            if(clickable === false && this.unclickable[i]){
                for (id in this.unclickable[i]) {
                    if(this.unclickable[i].hasOwnProperty(id)) if(name == id) return this.unclickable[i][id];
                }
            }
        }
        return false;
    };

    UI.prototype.update = function (dt) {
        var i,id,longest = Math.max(this.clickable.length,this.unclickable.length);
        for(i = 0; i < longest; i++){
            if(this.clickable[i]) {
                for (id in this.clickable[i]) {
                    if(this.clickable[i].hasOwnProperty(id)) if(this.clickable[i][id].update) this.clickable[i][id].update(dt);
                }
            }
            if(this.unclickable[i]){
                for (id in this.unclickable[i]) {
                    if(this.unclickable[i].hasOwnProperty(id)) if(this.unclickable[i][id].update) this.unclickable[i][id].update(dt);
                }
            }
        }
    };

    UI.prototype.draw = function (ctx) {
        var i,id,longest = Math.max(this.clickable.length,this.unclickable.length);
        for(i = longest-1; i >= 0; i--){
            if(this.clickable[i]) {
                for (id in this.clickable[i]) {
                    if(this.clickable[i].hasOwnProperty(id)) if(this.clickable[i][id].draw) this.clickable[i][id].draw(ctx);
                }
            }
            if(this.unclickable[i]){
                for (id in this.unclickable[i]) {
                    if(this.unclickable[i].hasOwnProperty(id)) if(this.unclickable[i][id].draw) this.unclickable[i][id].draw(ctx);
                }
            }
        }
    };



    //Game code
    var clock = {
        totalTime: 0,
        lastTime: Date.now(),
        currentTime: Date.now(),
        multiplicator: 1,
        delta: 0,
        update: function () {
            this.currentTime = Date.now();
            this.delta = ((this.currentTime - this.lastTime) / 1000) * this.multiplicator;
            this.totalTime += this.delta;
            this.lastTime = this.currentTime;
        }
    };

    var canvases = {
            foreground: document.getElementById('foreground'),
            background: document.getElementById('background'),
            UI: document.getElementById('UI'),
            tmp: document.createElement('canvas')
        },
        ctxs = {
            foreground: canvases.foreground.getContext('2d'),
            background: canvases.background.getContext('2d'),
            UI: canvases.UI.getContext('2d'),
            tmp: canvases.tmp.getContext('2d')
        };

    var global_events_last_tick = [];

    var global_events = {
        'onclick': function (e) {
            App.state.events['onclick'](e);
        },
        'onkeyup': function (e) {
            if(e.keyCode == 80) {
                if (clock.multiplicator > 0) clock.multiplicator = 0;
                else clock.multiplicator = 1;
            }
        },
        'changeState': function (e) {
            if(e.timeout){
                setTimeout(function () {
                    global_events_last_tick.push({event:{state:e.state},callback:'changeState'});
                },e.timeout);
            } else {
                App.state = e.state;
                App.state.init();
            }
        }
    };

    document.onclick = function (e) {
        global_events_last_tick.push({event:e,callback:'onclick'});
    };
    document.onkeyup = function (e) {
        global_events_last_tick.push({event:e,callback:'onkeyup'});
    };


    var MeteorShower = {
        spawnTime: CONST.METEOR.SHOWER.SPAWNTIME,
        timeSinceLastSpawn: CONST.METEOR.SHOWER.SPAWNTIME,
        meteorLimit: 999,
        meteors: [],
        spawn: function () {
            this.timeSinceLastSpawn = 0;
            var maxR = CONST.METEOR.RADIUS.MIDDLE+CONST.METEOR.RADIUS.IRREGULARITY,
                xOrY = Math.floor(Math.random()*2),
                dir = 1-(2*Math.floor(Math.random()*2));

            var pos = { x: (xOrY == 0 ? (dir == 1 ? -maxR : App.width+maxR) : maxR+Math.random()*(App.width-2*maxR)), y: (xOrY == 0 ? maxR+Math.random()*(App.height-2*maxR) : (dir == 1 ? -maxR : App.height+maxR)) };

            var current = this.meteors[this.meteors.length] = new Meteor(pos.x, pos.y, CONST.METEOR.RADIUS.MIDDLE, CONST.METEOR.VECTORAMOUNT.MIDDLE+(CONST.METEOR.VECTORAMOUNT.IRREGULARITY*(2*Math.random()-1)), CONST.METEOR.RADIUS.IRREGULARITY);

            current.speed.x = (xOrY == 0 ? dir*(CONST.METEOR.SPEED.MIDDLE + (CONST.METEOR.SPEED.IRREGULARITY*(2*Math.random()-1))) : 0);
            current.speed.y = (xOrY == 0 ? 0 : dir*(CONST.METEOR.SPEED.MIDDLE + (CONST.METEOR.SPEED.IRREGULARITY*(2*Math.random()-1))));
            current.speed.rotation = CONST.METEOR.SPEED.ROTATION.MIDDLE + (CONST.METEOR.SPEED.ROTATION.IRREGULARITY*((Math.random()*2)-1));
            current.color.stroke = Math.calc.color.random();
        },
        update: function (dt) {
            for (var i = 0; i < this.meteors.length; i++) {
                this.meteors[i].update(dt);
                if(!this.meteors[i].isAlive) {
                    this.meteors.splice(i,1);
                }
            }
            if (this.timeSinceLastSpawn > this.spawnTime && this.meteors.length < this.meteorLimit) this.spawn();
            this.timeSinceLastSpawn += dt;
        },
        draw: function (ctx) {
            for (var i = 0; i < MeteorShower.meteors.length; i++) {
                MeteorShower.meteors[i].draw(ctx);
            }
        }
    };

    var State = {
        MENU: {
            events_last_tick: [],
            events: {
                'onclick': function (e) {
                    var mousePos = Math.calc.input.mouse.getPos(e,canvases.UI),layer;
                    for(var i = 0; i < State.MENU.UI.clickable.length; i++){
                        layer = State.MENU.UI.clickable[i];
                        for(var id in layer) {
                            if(layer.hasOwnProperty(id)) {
                                if (layer[id].collision.point.call(layer[id],mousePos)) {
                                    layer[id].events['onclick'](mousePos);
                                }
                            }
                        }
                    }
                }
            },
            UI: new UI(),
            init: function () {
                this.UI.addObject(0,false,'headline',new Text(0,0,"Meteor Shower","white"));
                this.UI.addObject(10,false,'overlay',new Rectangle(0,0,{x:0,y:0},{x:600,y:600},'rgba(0,0,0,0.6)'));
                this.UI.addObject(0,true,'play_button',new Meteor(0,0,100,13,20));
                this.UI.addObject(0,false,'play_button_text',new Text(0,0,"PLAY","white"));

                var overlay = this.UI.getObject('overlay',false,10);
                overlay.fill = true;
                overlay.stroke = false;
                overlay.events['onupdate'] = function (dt) {
                    this.width = App.width;
                    this.height = App.height;
                };

                var headline = this.UI.getObject('headline',false,0);
                headline.textAlign = "center";
                headline.textBaseline = "middle";
                headline.font.size = 60;
                headline.color.fill = (function () {
                    var grd = ctxs.tmp.createLinearGradient(-300, 0, 50, 400);
                    grd.addColorStop(0, 'rgba(255, 0, 0, 0)');
                    grd.addColorStop(0.168, 'rgba(255, 0, 0, 1)');
                    grd.addColorStop(0.297, 'rgba(255, 252, 0, 1)');
                    grd.addColorStop(0.407, 'rgba(1, 180, 57, 1)');
                    grd.addColorStop(0.538, 'rgba(0, 234, 255, 1)');
                    grd.addColorStop(0.667, 'rgba(0, 3, 144, 1)');
                    grd.addColorStop(0.849, 'rgba(255, 0, 198, 1)');
                    grd.addColorStop(1, 'rgba(255, 0, 198, 0)');
                    return grd;
                })();
                headline.events['onupdate'] = function (dt) {
                    this.global.x = App.width/2;
                    this.global.y = App.height/3;
                };

                var play_button = this.UI.getObject('play_button',true,0);
                play_button.color.stroke = (function () {
                    var grd = ctxs.tmp.createLinearGradient(-300, 0, 50, 400);
                    grd.addColorStop(0, 'rgba(255, 0, 0, 0)');
                    grd.addColorStop(0.168, 'rgba(255, 0, 0, 1)');
                    grd.addColorStop(0.297, 'rgba(255, 252, 0, 1)');
                    grd.addColorStop(0.407, 'rgba(1, 180, 57, 1)');
                    grd.addColorStop(0.538, 'rgba(0, 234, 255, 1)');
                    grd.addColorStop(0.667, 'rgba(0, 3, 144, 1)');
                    grd.addColorStop(0.849, 'rgba(255, 0, 198, 1)');
                    grd.addColorStop(1, 'rgba(255, 0, 198, 0)');
                    return grd;
                })();
                play_button.events['onupdate'] = function (dt) {
                    this.global.x = App.width/2;
                    this.global.y = App.height*2/3;
                };
                play_button.events['onclick'] = function (e) {
                    this.explode(Math.calc.input.mouse.getPos(e,canvases.UI));
                    global_events_last_tick.push({event:{state:State.INGAME,timeout:1000},callback:'changeState'});
                }.bind(play_button);

                var play_button_text = this.UI.getObject('play_button_text',false,0);
                play_button_text.textAlign = "center";
                play_button_text.textBaseline = "middle";
                play_button_text.font.size = 50;
                play_button_text.color.fill = (function () {
                    var grd = ctxs.tmp.createLinearGradient(-150, 50, 200, 0);
                    grd.addColorStop(0, 'rgba(255, 0, 0, 0)');
                    grd.addColorStop(0.168, 'rgba(255, 0, 0, 1)');
                    grd.addColorStop(0.297, 'rgba(255, 252, 0, 1)');
                    grd.addColorStop(0.407, 'rgba(1, 180, 57, 1)');
                    grd.addColorStop(0.538, 'rgba(0, 234, 255, 1)');
                    grd.addColorStop(0.667, 'rgba(0, 3, 144, 1)');
                    grd.addColorStop(0.849, 'rgba(255, 0, 198, 1)');
                    grd.addColorStop(1, 'rgba(255, 0, 198, 0)');
                    return grd;
                })();
                play_button_text.events['onupdate'] = function (dt) {
                    this.global.x = App.width/2;
                    this.global.y = App.height*2/3;
                };
            },
            handleInput: function () {
                var arr = this.events_last_tick, len = arr.length;
                for(var i = 0; i < len; i++){
                    var handler = this.events[arr[i].callback];
                    if(handler) handler(arr[i].event);
                }
                this.events_last_tick = [];
            },
            update: function (dt) {
                this.UI.update(dt);
                MeteorShower.update(dt);
            },
            draw: function () {
                ctxs.foreground.clearRect(0, 0, canvases.foreground.width, canvases.foreground.height);
                ctxs.UI.clearRect(0,0,canvases.UI.width,canvases.UI.height);
                this.UI.draw(ctxs.UI);
                MeteorShower.draw(ctxs.foreground);
            }
        },
        INGAME: {
            events_last_tick: [],
            events: {
                'onclick': function (e) {
                    var mousePos = Math.calc.input.mouse.getPos(e,canvases.foreground), current;
                    for(var i = MeteorShower.meteors.length-1; i >= 0; i--){
                        current = MeteorShower.meteors[i];
                        if(!current.isExploded) {
                            if(current.collision.point.call(current,mousePos)){
                                current.explode(mousePos);
                                this['gainedPoints']({points:Math.floor(current.area/100)});
                                break;
                            }
                        }
                    }
                },
                'gainedPoints': function (e) {
                    State.INGAME.player.score += e.points;
                    State.INGAME.player.textObject.text = "Score: "+State.INGAME.player.score;
                }
            },
            UI: new UI(),
            init: function () {
                this.player = {
                    score: 0,
                    textObject: new Text(10,10,"Score: 0","white")
                };
                this.UI.addObject(0,false,'score_text',this.player.textObject);
                this.player.textObject.font.size = 30;
            },
            handleInput: function () {
                var arr = this.events_last_tick, len = arr.length;
                for(var i = 0; i < len; i++){
                    var handler = this.events[arr[i].callback];
                    if(handler) handler(arr[i].event);
                }
                this.events_last_tick = [];
            },
            update: function (dt) {
                this.UI.update(dt);
                MeteorShower.update(dt);
            },
            draw: function () {
                ctxs.foreground.clearRect(0, 0, canvases.foreground.width, canvases.foreground.height);
                ctxs.UI.clearRect(0,0,canvases.UI.width,canvases.UI.height);
                MeteorShower.draw(ctxs.foreground);
                this.UI.draw(ctxs.UI);
            }
        }
    };

    var App = {
        state: State.MENU,
        width: 0,
        height: 0,
        init: function () {
            this.state.init();
        },
        handleInput: function () {
            for(var i = 0; i < global_events_last_tick.length; i++){
                var handler = global_events[global_events_last_tick[i].callback];
                if(handler) handler(global_events_last_tick[i].event);
            }
            global_events_last_tick = [];
            this.state.handleInput();
        },
        updateSize: function () {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        },
        update: function () {
            clock.update();
            this.state.update(clock.delta);
            this.updateSize();
            for (var name in canvases) {
                if (canvases.hasOwnProperty(name)) {
                    canvases[name].width = App.width;
                    canvases[name].height = App.height;
                }
            }
        },
        draw: function () {
            this.state.draw();
        },
        run: function () {
            this.handleInput();
            this.update();
            this.draw();
            requestAnimationFrame(this.run.bind(this));
        }
    };
    

    App.init();
    App.run();
});
