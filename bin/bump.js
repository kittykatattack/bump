"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bump = (function () {
  function Bump() {
    var renderingEngine = arguments[0] === undefined ? PIXI : arguments[0];

    _classCallCheck(this, Bump);

    if (renderingEngine === undefined) throw new Error("Please assign a rendering engine in the constructor before using bump.js");

    //Find out which rendering engine is being used (the default is Pixi)
    this.renderer = "";

    //If the `renderingEngine` is Pixi, set up Pixi object aliases
    if (renderingEngine.ParticleContainer && renderingEngine.Sprite) {
      this.renderer = "pixi";
    }
  }

  _createClass(Bump, [{
    key: "addCollisionProperties",
    value: function addCollisionProperties(sprite) {

      //Add properties to Pixi sprites
      if (this.renderer === "pixi") {

        Object.defineProperties(sprite, {
          "gx": {
            get: function get() {
              return sprite.getGlobalPosition().x;
            },
            enumerable: true, configurable: true
          },
          "gy": {
            get: function get() {
              return sprite.getGlobalPosition().y;
            },
            enumerable: true, configurable: true
          },
          "centerX": {
            get: function get() {
              return sprite.x + sprite.width / 2;
            },
            enumerable: true, configurable: true
          },
          "centerY": {
            get: function get() {
              return sprite.y + sprite.height / 2;
            },
            enumerable: true, configurable: true
          },
          "halfWidth": {
            get: function get() {
              return sprite.width / 2;
            },
            enumerable: true, configurable: true
          },
          "halfHeight": {
            get: function get() {
              return sprite.height / 2;
            },
            enumerable: true, configurable: true
          }
        });

        if (sprite.circular) {
          Object.defineProperty(sprite, "radius", {
            get: function get() {
              return sprite.width / 2;
            },
            enumerable: true, configurable: true
          });
        }
      }

      //Add a Boolean `_bumpPropertiesAdded` property to the sprite to flag it
      //as having these new properties
      sprite._bumpPropertiesAdded = true;
    }
  }, {
    key: "hitTestPoint",

    /*
    hitTestPoint
    ------------
     Use it to find out if a point is touching a circlular or rectangular sprite.
    Parameters: 
    a. An object with `x` and `y` properties.
    b. A sprite object with `x`, `y`, `centerX` and `centerY` properties.
    If the sprite has a `radius` property, the function will interpret
    the shape as a circle.
    */

    value: function hitTestPoint(point, sprite) {

      //Add collision properties
      if (!sprite._bumpPropertiesAdded) this.addCollisionProperties(sprite);

      var shape = undefined,
          left = undefined,
          right = undefined,
          top = undefined,
          bottom = undefined,
          vx = undefined,
          vy = undefined,
          magnitude = undefined,
          hit = undefined;

      //Find out if the sprite is rectangular or circular depending
      //on whether it has a `radius` property
      if (sprite.radius) {
        shape = "circle";
      } else {
        shape = "rectangle";
      }

      //Rectangle
      if (shape === "rectangle") {

        //Get the position of the sprite's edges
        left = sprite.x;
        right = sprite.x + sprite.width;
        top = sprite.y;
        bottom = sprite.y + sprite.height;

        //Find out if the point is intersecting the rectangle
        hit = point.x > left && point.x < right && point.y > top && point.y < bottom;
      }

      //Circle
      if (shape === "circle") {
        //Find the distance between the point and the
        //center of the circle
        vx = point.x - sprite.centerX, vy = point.y - sprite.centerY, magnitude = Math.sqrt(vx * vx + vy * vy);

        //The point is intersecting the circle if the magnitude
        //(distance) is less than the circle's radius
        hit = magnitude < sprite.radius;
      }

      //`hit` will be either `true` or `false`
      return hit;
    }
  }, {
    key: "hitTestCircle",

    /*
    hitTestCircle
    -------------
     Use it to find out if two circular sprites are touching.
    Parameters: 
    a. A sprite object with `centerX`, `centerY` and `radius` properties.
    b. A sprite object with `centerX`, `centerY` and `radius`.
    */

    value: function hitTestCircle(c1, c2) {
      var global = arguments[2] === undefined ? false : arguments[2];

      //Add collision properties
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);
      if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2);

      var vx = undefined,
          vy = undefined,
          magnitude = undefined,
          combinedRadii = undefined,
          hit = undefined;

      //Calculate the vector between the circles’ center points
      if (global) {
        //Use global coordinates
        vx = c2.gx + c2.radius - (c1.gx + c1.radius);
        vy = c2.gy + c2.radius - (c1.gy + c1.radius);
      } else {
        //Use local coordinates
        vx = c2.centerX - c1.centerX;
        vy = c2.centerY - c1.centerY;
      }

      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      magnitude = Math.sqrt(vx * vx + vy * vy);

      //Add together the circles' total radii
      combinedRadii = c1.radius + c2.radius;

      //Set `hit` to `true` if the distance between the circles is
      //less than their `combinedRadii`
      hit = magnitude < combinedRadii;

      //`hit` will be either `true` or `false`
      return hit;
    }
  }, {
    key: "circleCollision",

    /*
    circleCollision
    ---------------
     Use it to prevent a moving circular sprite from overlapping and optionally
    bouncing off a non-moving circular sprite.
    Parameters: 
    a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
    b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
    c. Optional: true or false to indicate whether or not the first sprite
    should bounce off the second sprite.
    The sprites can contain an optional mass property that should be greater than 1.
     */

    value: function circleCollision(c1, c2) {
      var bounce = arguments[2] === undefined ? false : arguments[2];
      var global = arguments[3] === undefined ? false : arguments[3];

      //Add collision properties
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);
      if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2);

      var magnitude = undefined,
          combinedRadii = undefined,
          overlap = undefined,
          vx = undefined,
          vy = undefined,
          dx = undefined,
          dy = undefined,
          s = {},
          hit = false;

      //Calculate the vector between the circles’ center points

      if (global) {
        //Use global coordinates
        vx = c2.gx + c2.radius - (c1.gx + c1.radius);
        vy = c2.gy + c2.radius - (c1.gy + c1.radius);
      } else {
        //Use local coordinates
        vx = c2.centerX - c1.centerX;
        vy = c2.centerY - c1.centerY;
      }

      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      magnitude = Math.sqrt(vx * vx + vy * vy);

      //Add together the circles' combined half-widths
      combinedRadii = c1.radius + c2.radius;

      //Figure out if there's a collision
      if (magnitude < combinedRadii) {

        //Yes, a collision is happening
        hit = true;

        //Find the amount of overlap between the circles
        overlap = combinedRadii - magnitude;

        //Add some "quantum padding". This adds a tiny amount of space
        //between the circles to reduce their surface tension and make
        //them more slippery. "0.3" is a good place to start but you might
        //need to modify this slightly depending on the exact behaviour
        //you want. Too little and the balls will feel sticky, too much
        //and they could start to jitter if they're jammed together
        var quantumPadding = 0.3;
        overlap += quantumPadding;

        //Normalize the vector
        //These numbers tell us the direction of the collision
        dx = vx / magnitude;
        dy = vy / magnitude;

        //Move circle 1 out of the collision by multiplying
        //the overlap with the normalized vector and subtract it from
        //circle 1's position
        c1.x -= overlap * dx;
        c1.y -= overlap * dy;

        //Bounce
        if (bounce) {
          //Create a collision vector object, `s` to represent the bounce "surface".
          //Find the bounce surface's x and y properties
          //(This represents the normal of the distance vector between the circles)
          s.x = vy;
          s.y = -vx;

          //Bounce c1 off the surface
          bounceOffSurface(c1, s);
        }
      }
      return hit;
    }
  }, {
    key: "movingCircleCollision",

    /*
    movingCircleCollision
    ---------------------
     Use it to make two moving circles bounce off each other.
    Parameters: 
    a. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
    b. A sprite object with `x`, `y` `centerX`, `centerY` and `radius` properties.
    The sprites can contain an optional mass property that should be greater than 1.
     */

    value: function movingCircleCollision(c1, c2) {
      var global = arguments[2] === undefined ? false : arguments[2];

      //Add collision properties
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);
      if (!c2._bumpPropertiesAdded) this.addCollisionProperties(c2);

      var combinedRadii = undefined,
          overlap = undefined,
          xSide = undefined,
          ySide = undefined,

      //`s` refers to the distance vector between the circles
      s = {},
          p1A = {},
          p1B = {},
          p2A = {},
          p2B = {},
          hit = false;

      //Apply mass, if the circles have mass properties
      c1.mass = c1.mass || 1;
      c2.mass = c2.mass || 1;

      //Calculate the vector between the circles’ center points
      if (global) {
        //Use global coordinates
        s.vx = c2.gx + c2.radius - (c1.gx + c1.radius);
        s.vy = c2.gy + c2.radius - (c1.gy + c1.radius);
      } else {
        //Use local coordinates
        s.vx = c2.centerX - c1.centerX;
        s.vy = c2.centerY - c1.centerY;
      }

      //Find the distance between the circles by calculating
      //the vector's magnitude (how long the vector is)
      s.magnitude = Math.sqrt(s.vx * s.vx + s.vy * s.vy);

      //Add together the circles' combined half-widths
      combinedRadii = c1.radius + c2.radius;

      //Figure out if there's a collision
      if (s.magnitude < combinedRadii) {

        //Yes, a collision is happening
        hit = true;

        //Find the amount of overlap between the circles
        overlap = combinedRadii - s.magnitude;

        //Add some "quantum padding" to the overlap
        overlap += 0.3;

        //Normalize the vector.
        //These numbers tell us the direction of the collision
        s.dx = s.vx / s.magnitude;
        s.dy = s.vy / s.magnitude;

        //Find the collision vector.
        //Divide it in half to share between the circles, and make it absolute
        s.vxHalf = Math.abs(s.dx * overlap / 2);
        s.vyHalf = Math.abs(s.dy * overlap / 2);

        //Find the side that the collision is occurring on
        c1.x > c2.x ? xSide = 1 : xSide = -1;
        c1.y > c2.y ? ySide = 1 : ySide = -1;

        //Move c1 out of the collision by multiplying
        //the overlap with the normalized vector and adding it to
        //the circles' positions
        c1.x = c1.x + s.vxHalf * xSide;
        c1.y = c1.y + s.vyHalf * ySide;

        //Move c2 out of the collision
        c2.x = c2.x + s.vxHalf * -xSide;
        c2.y = c2.y + s.vyHalf * -ySide;

        //1. Calculate the collision surface's properties

        //Find the surface vector's left normal
        s.lx = s.vy;
        s.ly = -s.vx;

        //2. Bounce c1 off the surface (s)

        //Find the dot product between c1 and the surface
        var dp1 = c1.vx * s.dx + c1.vy * s.dy;

        //Project c1's velocity onto the collision surface
        p1A.x = dp1 * s.dx;
        p1A.y = dp1 * s.dy;

        //Find the dot product of c1 and the surface's left normal (s.lx and s.ly)
        var dp2 = c1.vx * (s.lx / s.magnitude) + c1.vy * (s.ly / s.magnitude);

        //Project the c1's velocity onto the surface's left normal
        p1B.x = dp2 * (s.lx / s.magnitude);
        p1B.y = dp2 * (s.ly / s.magnitude);

        //3. Bounce c2 off the surface (s)

        //Find the dot product between c2 and the surface
        var dp3 = c2.vx * s.dx + c2.vy * s.dy;

        //Project c2's velocity onto the collision surface
        p2A.x = dp3 * s.dx;
        p2A.y = dp3 * s.dy;

        //Find the dot product of c2 and the surface's left normal (s.lx and s.ly)
        var dp4 = c2.vx * (s.lx / s.magnitude) + c2.vy * (s.ly / s.magnitude);

        //Project c2's velocity onto the surface's left normal
        p2B.x = dp4 * (s.lx / s.magnitude);
        p2B.y = dp4 * (s.ly / s.magnitude);

        //4. Calculate the bounce vectors

        //Bounce c1
        //using p1B and p2A
        c1.bounce = {};
        c1.bounce.x = p1B.x + p2A.x;
        c1.bounce.y = p1B.y + p2A.y;

        //Bounce c2
        //using p1A and p2B
        c2.bounce = {};
        c2.bounce.x = p1A.x + p2B.x;
        c2.bounce.y = p1A.y + p2B.y;

        //Add the bounce vector to the circles' velocity
        //and add mass if the circle has a mass property
        c1.vx = c1.bounce.x / c1.mass;
        c1.vy = c1.bounce.y / c1.mass;
        c2.vx = c2.bounce.x / c2.mass;
        c2.vy = c2.bounce.y / c2.mass;
      }
      return hit;
    }
  }, {
    key: "multipleCircleCollision",

    /*
    multipleCircleCollision
    -----------------------
     Checks all the circles in an array for a collision against
    all the other circles in an array, using `movingCircleCollision` (above)
    */

    value: function multipleCircleCollision(arrayOfCircles) {
      var global = arguments[1] === undefined ? false : arguments[1];

      for (var i = 0; i < arrayOfCircles.length; i++) {

        //The first circle to use in the collision check
        var c1 = arrayOfCircles[i];
        for (var j = i + 1; j < arrayOfCircles.length; j++) {

          //The second circle to use in the collision check
          var c2 = arrayOfCircles[j];

          //Check for a collision and bounce the circles apart if
          //they collide. Use an optional `mass` property on the sprite
          //to affect the bounciness of each marble
          this.movingCircleCollision(c1, c2, global);
        }
      }
    }
  }, {
    key: "rectangleCollision",

    /*
    rectangleCollision
    ------------------
     Use it to prevent two rectangular sprites from overlapping. 
    Optionally, make the first rectangle bounce off the second rectangle.
    Parameters: 
    a. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    b. A sprite object with `x`, `y` `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    c. Optional: true or false to indicate whether or not the first sprite
    should bounce off the second sprite.
    */

    value: function rectangleCollision(r1, r2) {
      var bounce = arguments[2] === undefined ? false : arguments[2];
      var global = arguments[3] === undefined ? true : arguments[3];

      //Add collision properties
      if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1);
      if (!r2._bumpPropertiesAdded) this.addCollisionProperties(r2);

      var collision = undefined,
          combinedHalfWidths = undefined,
          combinedHalfHeights = undefined,
          overlapX = undefined,
          overlapY = undefined,
          vx = undefined,
          vy = undefined;

      //Calculate the distance vector
      if (global) {
        vx = r1.gx + r1.halfWidth - (r2.gx + r2.halfWidth);
        vy = r1.gy + r1.halfHeight - (r2.gy + r2.halfHeight);
      } else {
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;
      }

      //Figure out the combined half-widths and half-heights
      combinedHalfWidths = r1.halfWidth + r2.halfWidth;
      combinedHalfHeights = r1.halfHeight + r2.halfHeight;

      //Check whether vx is less than the combined half widths
      if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occurring!
        //Check whether vy is less than the combined half heights
        if (Math.abs(vy) < combinedHalfHeights) {

          //A collision has occurred! This is good!
          //Find out the size of the overlap on both the X and Y axes
          overlapX = combinedHalfWidths - Math.abs(vx);
          overlapY = combinedHalfHeights - Math.abs(vy);

          //The collision has occurred on the axis with the
          //*smallest* amount of overlap. Let's figure out which
          //axis that is

          if (overlapX >= overlapY) {
            //The collision is happening on the X axis
            //But on which side? vy can tell us

            if (vy > 0) {
              collision = "top";
              //Move the rectangle out of the collision
              r1.y = r1.y + overlapY;
            } else {
              collision = "bottom";
              //Move the rectangle out of the collision
              r1.y = r1.y - overlapY;
            }

            //Bounce
            if (bounce) {
              r1.vy *= -1;

              /*Alternative
              //Find the bounce surface's vx and vy properties
              var s = {};
              s.vx = r2.x - r2.x + r2.width;
              s.vy = 0;
               //Bounce r1 off the surface
              //bounceOffSurface(r1, s);
              */
            }
          } else {
            //The collision is happening on the Y axis
            //But on which side? vx can tell us

            if (vx > 0) {
              collision = "left";
              //Move the rectangle out of the collision
              r1.x = r1.x + overlapX;
            } else {
              collision = "right";
              //Move the rectangle out of the collision
              r1.x = r1.x - overlapX;
            }

            //Bounce
            if (bounce) {
              r1.vx *= -1;

              /*Alternative
              //Find the bounce surface's vx and vy properties
              var s = {};
              s.vx = 0;
              s.vy = r2.y - r2.y + r2.height;
               //Bounce r1 off the surface
              bounceOffSurface(r1, s);
              */
            }
          }
        } else {}
      } else {}

      //Return the collision string. it will be either "top", "right",
      //"bottom", or "left" depending on which side of r1 is touching r2.
      return collision;
    }
  }, {
    key: "hitTestRectangle",

    /*
    hitTestRectangle
    ----------------
     Use it to find out if two rectangular sprites are touching.
    Parameters: 
    a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     */

    value: function hitTestRectangle(r1, r2) {
      var global = arguments[2] === undefined ? false : arguments[2];

      //Add collision properties
      if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1);
      if (!r2._bumpPropertiesAdded) this.addCollisionProperties(r2);

      var hit = undefined,
          combinedHalfWidths = undefined,
          combinedHalfHeights = undefined,
          vx = undefined,
          vy = undefined;

      //A variable to determine whether there's a collision
      hit = false;

      //Calculate the distance vector
      if (global) {
        vx = r1.gx + r1.halfWidth - (r2.gx + r2.halfWidth);
        vy = r1.gy + r1.halfHeight - (r2.gy + r2.halfHeight);
      } else {
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;
      }

      //Figure out the combined half-widths and half-heights
      combinedHalfWidths = r1.halfWidth + r2.halfWidth;
      combinedHalfHeights = r1.halfHeight + r2.halfHeight;

      //Check for a collision on the x axis
      if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occuring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {

          //There's definitely a collision happening
          hit = true;
        } else {

          //There's no collision on the y axis
          hit = false;
        }
      } else {

        //There's no collision on the x axis
        hit = false;
      }

      //`hit` will be either `true` or `false`
      return hit;
    }
  }, {
    key: "hitTestCircleRectangle",

    /*
    hitTestCircleRectangle
    ----------------
     Use it to find out if a circular shape is touching a rectangular shape
    Parameters: 
    a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     */

    value: function hitTestCircleRectangle(c1, r1) {
      var global = arguments[2] === undefined ? false : arguments[2];

      //Add collision properties
      if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1);
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);

      var region = undefined,
          collision = undefined,
          c1x = undefined,
          c1y = undefined,
          r1x = undefined,
          r1y = undefined;

      //Use either global or local coordinates
      if (global) {
        c1x = c1.gx;
        c1y = c1.gy;
        r1x = r1.gx;
        r1y = r1.gy;
      } else {
        c1x = c1.x;
        c1y = c1.y;
        r1x = r1.x;
        r1y = r1.y;
      }

      //Is the circle above the rectangle's top edge?
      if (c1y < r1y - r1.halfHeight) {

        //If it is, we need to check whether it's in the
        //top left, top center or top right
        //(Increasing the size of the region by 2 pixels slightly weights
        //the text in favor of a rectangle vs. rectangle collision test.
        //This gives a more natural looking result with corner collisions
        //when physics is added)
        if (c1x < r1x - 1 - r1.halfWidth) {
          region = "topLeft";
        } else if (c1x > r1x + 1 + r1.halfWidth) {
          region = "topRight";
        } else {
          region = "topMiddle";
        }
      }

      //The circle isn't above the top edge, so it might be
      //below the bottom edge
      else if (c1y > r1y + r1.halfHeight) {

        //If it is, we need to check whether it's in the bottom left,
        //bottom center, or bottom right
        if (c1x < r1x - 1 - r1.halfWidth) {
          region = "bottomLeft";
        } else if (c1x > r1x + 1 + r1.halfWidth) {
          region = "bottomRight";
        } else {
          region = "bottomMiddle";
        }
      }

      //The circle isn't above the top edge or below the bottom edge,
      //so it must be on the left or right side
      else {
        if (c1x < r1x - r1.halfWidth) {
          region = "leftMiddle";
        } else {
          region = "rightMiddle";
        }
      }

      //Is this the circle touching the flat sides
      //of the rectangle?
      if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

        //Yes, it is, so do a standard rectangle vs. rectangle collision test
        collision = hitTestRectangle(c1, r1, global);
      }

      //The circle is touching one of the corners, so do a
      //circle vs. point collision test
      else {
        var point = {};

        switch (region) {
          case "topLeft":
            point.x = r1x;
            point.y = r1y;
            break;

          case "topRight":
            point.x = r1x + r1.width;
            point.y = r1y;
            break;

          case "bottomLeft":
            point.x = r1x;
            point.y = r1y + r1.height;
            break;

          case "bottomRight":
            point.x = r1x + r1.width;
            point.y = r1y + r1.height;
        }

        //Check for a collision between the circle and the point
        collision = hitTestCirclePoint(c1, point, global);
      }

      //Return the result of the collision.
      //The return value will be `undefined` if there's no collision
      if (collision) {
        return region;
      } else {
        return collision;
      }
    }
  }, {
    key: "hitTestCirclePoint",

    /*
    hitTestCirclePoint
    ------------------
     Use it to find out if a circular shape is touching a point
    Parameters: 
    a. A sprite object with `centerX`, `centerY`, and `radius` properties.
    b. A point object with `x` and `y` properties.
     */

    value: function hitTestCirclePoint(c1, point) {
      var global = arguments[2] === undefined ? false : arguments[2];

      //Add collision properties
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);

      //A point is just a circle with a diameter of
      //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
      //Collision test. Just supply the point with the properties
      //it needs
      point.diameter = 1;
      point.radius = 0.5;
      point.centerX = point.x;
      point.centerY = point.y;
      point.gx = point.x;
      point.gy = point.y;
      return hitTestCircle(c1, point, global);
    }
  }, {
    key: "circleRectangleCollision",

    /*
    circleRectangleCollision
    ------------------------
     Use it to bounce a circular shape off a rectangular shape
    Parameters: 
    a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
    b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
     */

    value: function circleRectangleCollision(c1, r1) {
      var bounce = arguments[2] === undefined ? false : arguments[2];
      var global = arguments[3] === undefined ? false : arguments[3];

      //Add collision properties
      if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1);
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);

      var region = undefined,
          collision = undefined,
          c1x = undefined,
          c1y = undefined,
          r1x = undefined,
          r1y = undefined;

      //Use either the global or local coordinates
      if (global) {
        c1x = c1.gx;
        c1y = c1.gy;
        r1x = r1.gx;
        r1y = r1.gy;
      } else {
        c1x = c1.x;
        c1y = c1.y;
        r1x = r1.x;
        r1y = r1.y;
      }

      //Is the circle above the rectangle's top edge?
      if (c1y < r1y - r1.halfHeight) {
        //If it is, we need to check whether it's in the
        //top left, top center or top right
        if (c1x < r1x - 1 - r1.halfWidth) {
          region = "topLeft";
        } else if (c1x > r1x + 1 + r1.halfWidth) {
          region = "topRight";
        } else {
          region = "topMiddle";
        }
      }

      //The circle isn't above the top edge, so it might be
      //below the bottom edge
      else if (c1y > r1y + r1.halfHeight) {
        //If it is, we need to check whether it's in the bottom left,
        //bottom center, or bottom right
        if (c1x < r1x - 1 - r1.halfWidth) {
          region = "bottomLeft";
        } else if (c1x > r1x + 1 + r1.halfWidth) {
          region = "bottomRight";
        } else {
          region = "bottomMiddle";
        }
      }

      //The circle isn't above the top edge or below the bottom edge,
      //so it must be on the left or right side
      else {
        if (c1x < r1x - r1.halfWidth) {
          region = "leftMiddle";
        } else {
          region = "rightMiddle";
        }
      }

      //Is this the circle touching the flat sides
      //of the rectangle?
      if (region === "topMiddle" || region === "bottomMiddle" || region === "leftMiddle" || region === "rightMiddle") {

        //Yes, it is, so do a standard rectangle vs. rectangle collision test
        collision = rectangleCollision(c1, r1, bounce, global);
      }

      //The circle is touching one of the corners, so do a
      //circle vs. point collision test
      else {
        var point = {};

        switch (region) {
          case "topLeft":
            point.x = r1x;
            point.y = r1y;
            break;

          case "topRight":
            point.x = r1x + r1.width;
            point.y = r1y;
            break;

          case "bottomLeft":
            point.x = r1x;
            point.y = r1y + r1.height;
            break;

          case "bottomRight":
            point.x = r1x + r1.width;
            point.y = r1y + r1.height;
        }

        //Check for a collision between the circle and the point
        collision = circlePointCollision(c1, point, bounce, global);
      }

      if (collision) {
        return region;
      } else {
        return collision;
      }
    }
  }, {
    key: "circlePointCollision",

    /*
    circlePointCollision
    --------------------
     Use it to boucnce a circle off a point.
    Parameters: 
    a. A sprite object with `centerX`, `centerY`, and `radius` properties.
    b. A point object with `x` and `y` properties.
     */

    value: function circlePointCollision(c1, point) {
      var bounce = arguments[2] === undefined ? false : arguments[2];
      var global = arguments[3] === undefined ? false : arguments[3];

      //Add collision properties
      if (!c1._bumpPropertiesAdded) this.addCollisionProperties(c1);

      //A point is just a circle with a diameter of
      //1 pixel, so we can cheat. All we need to do is an ordinary circle vs. circle
      //Collision test. Just supply the point with the properties
      //it needs
      point.diameter = 1;
      point.radius = 0.5;
      point.centerX = point.x;
      point.centerY = point.y;
      point.gx = point.x;
      point.gy = point.y;
      return circleCollision(c1, point, bounce, global);
    }
  }, {
    key: "bounceOffSurface",

    /*
    bounceOffSurface
    ----------------
     Use this to bounce an object off another object.
    Parameters: 
    a. An object with `v.x` and `v.y` properties. This represents the object that is colliding
    with a surface.
    b. An object with `x` and `y` properties. This represents the surface that the object
    is colliding into.
    The first object can optionally have a mass property that's greater than 1. The mass will
    be used to dampen the bounce effect.
    */

    value: function bounceOffSurface(o, s) {

      //Add collision properties
      if (!o._bumpPropertiesAdded) this.addCollisionProperties(o);

      var dp1 = undefined,
          dp2 = undefined,
          p1 = {},
          p2 = {},
          bounce = {},
          mass = o.mass || 1;

      //1. Calculate the collision surface's properties
      //Find the surface vector's left normal
      s.lx = s.y;
      s.ly = -s.x;

      //Find its magnitude
      s.magnitude = Math.sqrt(s.x * s.x + s.y * s.y);

      //Find its normalized values
      s.dx = s.x / s.magnitude;
      s.dy = s.y / s.magnitude;

      //2. Bounce the object (o) off the surface (s)

      //Find the dot product between the object and the surface
      dp1 = o.vx * s.dx + o.vy * s.dy;

      //Project the object's velocity onto the collision surface
      p1.vx = dp1 * s.dx;
      p1.vy = dp1 * s.dy;

      //Find the dot product of the object and the surface's left normal (s.lx and s.ly)
      dp2 = o.vx * (s.lx / s.magnitude) + o.vy * (s.ly / s.magnitude);

      //Project the object's velocity onto the surface's left normal
      p2.vx = dp2 * (s.lx / s.magnitude);
      p2.vy = dp2 * (s.ly / s.magnitude);

      //Reverse the projection on the surface's left normal
      p2.vx *= -1;
      p2.vy *= -1;

      //Add up the projections to create a new bounce vector
      bounce.x = p1.vx + p2.vx;
      bounce.y = p1.vy + p2.vy;

      //Assign the bounce vector to the object's velocity
      //with optional mass to dampen the effect
      o.vx = bounce.x / mass;
      o.vy = bounce.y / mass;
    }
  }, {
    key: "contain",

    /*
    contain
    -------
    `contain` can be used to contain a sprite with `x` and
    `y` properties inside a rectangular area.
     The `contain` function takes two arguments: a sprite with `x` and `y`
    properties, and an object literal with `x`, `y`, `width` and `height` properties.
    ```js
    contain(anySprite, {x: 0, y: 0, width: 512, height: 512});
    ```
    The code above will contain the sprite's position inside the 512 by
    512 pixel area defined by the object. For example, you could contain
    the a sprite inside a 512 by 512 area like this:
     If the sprite bumps into any of the containing object's boundaries,
    the `contain` function will return a value that tells you which side
    the sprite bumped into: “left”, “top”, “right” or “bottom”. Here's how
    you could keep the sprite contained and also find out which boundary
    it hit:
    ```js
    //Contain the sprite and find the collision value
    let collision = contain(anySprite, {x: 0, y: 0, width: 512, height: 512});
     //If there's a collision, display the boundary that the collision happened on
    if(collision) {
      if collision.has("left") console.log("The sprite hit the left");  
      if collision.has("top") console.log("The sprite hit the top");  
      if collision.has("right") console.log("The sprite hit the right");  
      if collision.has("bottom") console.log("The sprite hit the bottom");  
    }
    ```
    If the sprite doesn't hit a boundary, the value of
    `collision` will be `undefined`. 
    */

    value: function contain(sprite, container) {

      //Create a set called `collision` to keep track of the
      //boundaries with which the sprite is colliding
      var collision = new Set();

      //Left
      if (sprite.x < container.x) {
        sprite.x = container.x;
        collision.add("left");
      }

      //Top
      if (sprite.y < container.y) {
        sprite.y = container.y;
        collision.add("top");
      }

      //Right
      if (sprite.x + sprite.width > container.width) {
        sprite.x = container.width - sprite.width;
        collision.add("right");
      }

      //Bottom
      if (sprite.y + sprite.height > container.height) {
        sprite.y = container.height - sprite.height;
        collision.add("bottom");
      }

      //If there were no collisions, set `collision` to `undefined`
      if (collision.size === 0) collision = undefined;

      //Return the `collision` value
      return collision;
    }
  }, {
    key: "hit",

    /*
    hit
    ---
    A convenient universal collision function to test for collisions
    between rectangles, circles, and points.
    */

    value: function hit(a, b, react, bounce, global) {
      if (react === undefined) react = false;
      if (bounce === undefined) bounce = false;
      var extra = arguments[5] === undefined ? undefined : arguments[5];

      //Local references to bump's collision methods
      var hitTestPoint = this.hitTestPoint.bind(this),
          hitTestRectangle = this.hitTestRectangle.bind(this),
          hitTestCircle = this.hitTestCircle.bind(this),
          movingCircleCollision = this.movingCircleCollision.bind(this),
          circleCollision = this.circleCollision.bind(this),
          hitTestCircleRectangle = this.hitTestCircleRectangle.bind(this),
          circleRectangleCollision = this.circleRectangleCollision.bind(this);

      var collision = undefined,
          aIsASprite = a.parent !== undefined,
          bIsASprite = b.parent !== undefined;

      //Check to make sure one of the arguments isn't an array
      if (aIsASprite && b instanceof Array || bIsASprite && a instanceof Array) {
        //If it is, check for a collision between a sprite and an array
        spriteVsArray();
      } else {
        //If one of the arguments isn't an array, find out what type of
        //collision check to run
        collision = findCollisionType(a, b);
        if (collision && extra) extra(collision);
      }

      //Return the result of the collision.
      //It will be `undefined` if there's no collision and `true` if
      //there is a collision. `rectangleCollision` sets `collsision` to
      //"top", "bottom", "left" or "right" depeneding on which side the
      //collision is occuring on
      return collision;

      function findCollisionType(a, b) {
        //Are `a` and `b` both sprites?
        //(We have to check again if this function was called from
        //`spriteVsArray`)
        var aIsASprite = a.parent !== undefined;
        var bIsASprite = b.parent !== undefined;

        if (aIsASprite && bIsASprite) {
          //Yes, but what kind of sprites?
          if (a.diameter && b.diameter) {
            //They're circles
            return circleVsCircle(a, b);
          } else if (a.diameter && !b.diameter) {
            //The first one is a circle and the second is a rectangle
            return circleVsRectangle(a, b);
          } else {
            //They're rectangles
            return rectangleVsRectangle(a, b);
          }
        }
        //They're not both sprites, so what are they?
        //Is `a` not a sprite and does it have x and y properties?
        else if (bIsASprite && !(a.x === undefined) && !(a.y === undefined)) {
          //Yes, so this is a point vs. sprite collision test
          return hitTestPoint(a, b);
        } else {
          //The user is trying to test some incompatible objects
          throw new Error("I'm sorry, " + a + " and " + b + " cannot be use together in a collision test.'");
        }
      }

      function spriteVsArray() {
        //If `a` happens to be the array, flip it around so that it becomes `b`
        if (a instanceof Array) {
          var _ref = [_b, _a];
          var _a = _ref[0];
          var _b = _ref[1];
        }
        //Loop through the array in reverse
        for (var i = b.length - 1; i >= 0; i--) {
          var sprite = b[i];
          collision = findCollisionType(a, sprite);
          if (collision && extra) extra(collision, sprite);
        }
      }

      function circleVsCircle(a, b) {
        //If the circles shouldn't react to the collision,
        //just test to see if they're touching
        if (!react) {
          return hitTestCircle(a, b);
        }
        //Yes, the circles should react to the collision
        else {
          //Are they both moving?
          if (a.vx + a.vy !== 0 && b.vx + b.vy !== 0) {
            //Yes, they are both moving
            //(moving circle collisions always bounce apart so there's
            //no need for the third, `bounce`, argument)
            return movingCircleCollision(a, b, global);
          } else {
            //No, they're not both moving
            return circleCollision(a, b, bounce, global);
          }
        }
      }

      function rectangleVsRectangle(a, b) {
        //If the rectangles shouldn't react to the collision, just
        //test to see if they're touching
        if (!react) {
          return hitTestRectangle(a, b, global);
        } else {
          return rectangleCollision(a, b, bounce, global);
        }
      }

      function circleVsRectangle(a, b) {
        //If the rectangles shouldn't react to the collision, just
        //test to see if they're touching
        if (!react) {
          return hitTestCircleRectangle(a, b, global);
        } else {
          return circleRectangleCollision(a, b, bounce, global);
        }
      }
    }
  }]);

  return Bump;
})();

//No collision

//No collision
//# sourceMappingURL=bump.js.map