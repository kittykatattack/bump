class Bump {
  constructor(renderingEngine = PIXI) {
    if (renderingEngine === undefined) throw new Error("Please assign a rendering engine in the constructor before using pixiDust.js"); 

    //Find out which rendering engine is being used (the default is Pixi)
    this.renderer = "";

    //If the `renderingEngine` is Pixi, set up Pixi object aliases
    if (renderingEngine.ParticleContainer) {
      this.renderer = "pixi";
    }
  }

  addCollisionProperties(sprite) {

    //Add properties to Pixi sprites
    if (this.renderer === "pixi") {

      Object.defineProperties(sprite, {
        "gx": {
          value: function(){return sprite.getGlobalPosition().x},
          writable: true, enumerable: true, configurable: true
        },
        "gy": {
          value: function(){return sprite.getGlobalPosition().y},
          writable: true, enumerable: true, configurable: true
        },
        "centerX": {
          value: function(){return sprite.x + sprite.width / 2},
          writable: true, enumerable: true, configurable: true
        },
        "centerY": {
          value: function(){return sprite.y + sprite.height / 2},
          writable: true, enumerable: true, configurable: true
        },
        "halfWidth": {
          value: function(){return sprite.width / 2},
          writable: true, enumerable: true, configurable: true
        },
        "halfHeight": {
          value: function(){return sprite.height / 2},
          writable: true, enumerable: true, configurable: true
        }
      });
    }

    //Add a Boolean `_bumpPropertiesAdded` property to the sprite to flag it
    //as having these new properties
    sprite._bumpPropertiesAdded = true;
  }

  /*
  hitTestRectangle
  ----------------

  Use it to find out if two rectangular sprites are touching.
  Parameters: 
  a. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.
  b. A sprite object with `centerX`, `centerY`, `halfWidth` and `halfHeight` properties.

  */

  hitTestRectangle(r1, r2, global = false) {

    //Add collision properties
    if (!r1._bumpPropertiesAdded) this.addCollisionProperties(r1); 
    if (!r2._bumpPropertiesAdded) this.addCollisionProperties(r1); 

    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //A variable to determine whether there's a collision
    hit = false;

    //Calculate the distance vector
    if (global) {
      vx = (r1.gx + r1.halfWidth) - (r2.gx + r2.halfWidth);
      vy = (r1.gy + r1.halfHeight) - (r2.gy + r2.halfHeight);
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
}
