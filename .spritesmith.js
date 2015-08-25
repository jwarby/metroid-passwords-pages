'use strict';

module.exports = {
  src: './src/sprite/*.{png,gif,jpg}',
  destImage: './public/sprite/sprites.png',
  destCSS: './public/css/sprites.css',
  cssOpts: {
    cssClass: function(item) {
      return '.sprite-' + item.name;
    }
  },
  padding: 2
};
