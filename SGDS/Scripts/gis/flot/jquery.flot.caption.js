/**
 * description here
 */

(function ($) {
  var options = {
    caption: {
      show: true,
      text: false,
      margin: 5,     // int or array with margin [top-bottom, left-right],
                     // [top, left-right, bottom], [top, right, bottom, left]
      position: "nc" // caption position ("ne", "nw", "nc", "se", "sw", "sc")
    }
  };
  var captionOffset = {left: 0, top: 0, bottom: 0},
      captionWidth = 0;

  /**
   * Initialize
   */
  function init(plot) {
    plot.hooks.preprocessOffset.push(preprocessOffset);
    plot.hooks.draw.push(draw);
  }

  /**
   * Parse margin
   */
  function parseStyle(m) {
    var mp = [];
    if (m[0] == null) m = [m,m,m,m]; // top, right, bottom, left
    else {
      for (i in m) {
        mp.push(m[i]);
      }
      m = mp;
    }
    mp = [];
    switch (m.length) {
      case 1:
        mp = [m[0],m[0],m[0],m[0]];
        break;
      case 2:
        mp = [m[0],m[1],m[0],m[1]];
        break;
      case 3:
        mp = [m[0],m[1],m[2],m[1]];
        break;
      default:
        mp = [m[0],m[1],m[2],m[3]];
    }
    return mp;
  }

  /**
   * Implementation of hooks.preprocessOffset
   */
  function preprocessOffset(plot, offset) {
    var o = plot.getOptions().caption;
    if (!o.show || !o.text) return;
    var m = parseStyle(o.margin);
    // fill caption offset values
    captionOffset.left = offset.left;
    captionOffset.top = offset.top;
    captionWidth = plot.getCanvas().width - m[1] - m[3] - offset.left - offset.right;

    var caption = makeDummyCaption(m, o.text).appendTo(plot.getPlaceholder());
    switch (o.position) {
      case 'nw':
      case 'ne':
      case 'nc':
        offset.top += $(caption).outerHeight() + m[0] + m[2];
        break;

      case 'sw':
      case 'se':
      case 'sc':
        captionOffset.bottom = offset.bottom;
        offset.bottom += $(caption).outerHeight() + m[0] + m[2];
        break;
    }
  }

  /**
   * Draw caption. Implementation of hooks.draw
   */
  function draw(plot, ctx) {
    var o = plot.getOptions().caption;
    $('div.caption', plot.getPlaceholder()).remove();
    if (!o.show || !o.text) return;

    var css = {};
    switch (o.position) {
      case 'nw':
        css = {'text-align': 'left', top: captionOffset.top};
        break;
      case 'nc':
        css = {'text-align': 'center', top: captionOffset.top};
        break;
      case 'ne':
        css = {'text-align': 'right', top: captionOffset.top};
        break;

      case 'sw':
        css = {'text-align': 'left', bottom: captionOffset.bottom};
        break;
      case 'sc':
        css = {'text-align': 'center', bottom: captionOffset.bottom};
        break;
      case 'se':
        css = {'text-align': 'right', bottom: captionOffset.bottom};
        break;
    }

    var caption = $('div.caption-text', plot.getPlaceholder());
    css = $.extend(css, {width: captionWidth, left: captionOffset.left});
    $(caption).css(css);
    // add to caption element
    $('<div class="caption"></div>').append(caption).appendTo(plot.getPlaceholder());
  }

  /**
   * Make dummy caption
   */
  function makeDummyCaption(m, t) {
    var margin = m[0] + 'px ' + m[1] + 'px ' + m[2] + 'px ' + m[3] + 'px';
    return $('<div></div>').addClass('caption-text')
      .css({margin: margin, position: 'absolute', left: '-10000px'})
      .html(t);
  }

  $.plot.plugins.push({
    init: init,
    options: options,
    name: 'caption',
    version: '0.1'
  });
})(jQuery);