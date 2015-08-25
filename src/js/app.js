;(function(global) {
  'use strict';
  /* global Handlebars, MetroidPasswords */

  // @todo add 'Start in Brinstar' option, which must set bits 64, 65 & 66 to 0 (should also be checked by default)
  /*
   * @todo LIST OF CALCULABLE BITS
   * =======================
   *
   *   - game age
   *     - slider for duration
   */

  $('.col-lg-3.fade').addClass('in');

  var HIDDEN = ['game_data', 'statue', 'unknown'];
  var HIDDEN_BITS = [72, 73, 75, 76, 77];

  var passwordTemplate = Handlebars.compile($('#tpl-password').html());
  var panelTemplate = Handlebars.compile($('#tpl-panel').html());

  function arrayChunk(array, chunks) {
    var lists = [];
    var chunkSize = Math.floor(array.length / chunks) || array.length;
    var remainder = array.length % chunks;

    while (array.length > remainder) {
      lists.push(array.splice(0, chunkSize));
    }

    while (remainder) {
      lists[--remainder] = lists[remainder] || [];
      lists[remainder].push(array.shift());
    }

    return lists;
  }

  Handlebars.registerHelper('columns', function(columns, items, options) {
    var lists = arrayChunk(items, columns);
    var html = '<div class="row-fluid">';
    var data;

    if (options.data) {
      data = Handlebars.createFrame(options.data);
    }

    lists.forEach(function(list) {
      html += '<div class="col-md-' + (12 / columns) +'">';

      list.forEach(function(item) {
        data.index = item.bit;
        html += options.fn(item, data);
      });

      html += '</div>';
    });

    html += '</div>';

    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper('letterise', function(str, options) {
    str = str ? str : '';

    return new Handlebars.SafeString([].reduce.call(str, function(html, chr) {
      var cssClass = '';

      if (/[^A-Z0-9]/.test(chr)) {
        cssClass = 'class="text-blue"';
      }

      return html + '<span ' + cssClass + '>' + chr + '</span>';
    }, ''));
  });

  function categorise(data) {
    var categories = {};
    var entry;

    for (var d = 0; d < data.bits.length; d++) {
      if (HIDDEN_BITS.indexOf(d) !== -1) {
        continue;
      }

      entry = $.extend({
        bit: d,
      }, data.bits[d]);

      categories[entry.category] = categories[entry.category] || [];

      categories[entry.category].push(entry);
    }

    HIDDEN.forEach(function(category) {
      delete categories[category];
    });

    return categories;
  }

  function render(categories) {
    var $collapse = $('#categories');

    $('#password').replaceWith(passwordTemplate());

    for (var c in categories) {
      if (c === 'start_location') {
        categories[c].push({
          desc: 'Start in Tourian',
          bit: '64,65',
          category: 'start_location'
        });
      }

      $collapse.append(panelTemplate({
        id: c,
        title: c.replace(/_/g, ' '),
        items: categories[c],
        exclusive: c === 'start_location'
      }));
    }
  }

  function getMissileCount() {
    return ($('#missile_containers').find(':checked').length * 5) +
        ($('[value="124"], [value="126"]').filter(':checked').length * 75);
  }

  function getSuitUpgrades() {
    return parseInt([6, 24, 74, 26, 0, 11, 78, 79].reverse().reduce(function(str, bitIndex) {
      return str + ($('[value="' + bitIndex + '"]').is(':checked') ? '1' : '0');
    }, ''), 2);
  }

  render(categorise(MetroidPasswords._data));

  $('#randomize').on('click', function() {
    $('.panel-body').find(':checkbox, :radio').each(function(i, box) {
      if (Math.random() > 0.5) {
        return $(box).trigger('click');
      }
    });
  });

  // Special case handlers
  $('[value="11"],[value="71"]').on('change', function(e) {

    // Figure out new sprite
    var clothing = $('[value="71"]').is(':checked') ? 'bikini' : 'suit',
      type = $('[value="11"]').is(':checked') ? 'varia' : 'normal';

    $('#samus')[0].className = 'sprite';

    $('#samus').addClass('sprite-' + clothing + '-' + type);
  });

  $('#energy_tanks :checkbox').on('change', function(e) {
    var count = $('#energy_tanks').find(':checkbox').filter(':checked').length;

    count = Math.min(6, count);

    $('#energy .tanks i')
      .addClass('invisible')
      .slice(6 - count)
        .removeClass('invisible')
    ;
  });

  $('#monsters :checkbox, #missile_containers :checkbox').on('change', function(e) {
    var count = getMissileCount();

    $('#missile-counter').text('000'.substring(count.toString().length) + count);
  });

  $('.panel-body').find(':checkbox, :radio').on('click', function(e) {
    var bits = [],
      bytes = new Uint8ClampedArray(16),
      index = 0,
      input,
      password;

    for (var b = 0; b < 128; b++) {
      input = $('[value="' + b +'"]');

      bits.push(input.length && input.is(':checked') ? 1 : 0);
    }

    $('[value*=","]').each(function(i, input) {
      var $input = $(input);

      if ($input.is(':checked')) {
        $input.val().split(',').forEach(function(bit) {
          bits[parseInt(bit, 10)] = 1;
        });
      }
    });

    /* Special case for when Ridley/Kraid killed - set next bit to the same
     * value to raise/lower the statue accordingly
     */
    bits[127] = bits[126];
    bits[125] = bits[124];

    while (bits.length) {
      bytes[index++] = parseInt(bits.splice(0, 8).reverse().join(''), 2);
    }

    // Calculate 'Samus has' byte
    bytes[9] = getSuitUpgrades();

    // Calculate missile count byte
    bytes[10] = getMissileCount();

    // console.log([].reduce.call(bytes, function(str, byte) {
    //   return str + ('00000000'.substring(byte.toString(2).length) + byte.toString(2));
    // }, ''));

    password = MetroidPasswords.encode(bytes);

    $('#password').replaceWith(passwordTemplate({
      pass: arrayChunk(password.split(''), 4)
    }));
  });

  $('.select-all').on('change', function(e) {
    $('#' + e.target.value).find(':checkbox').each(function(i, box) {
      var $box = $(box);
      if (e.target.checked) {

        if (!$box.is(':checked')) {
          $box.trigger('click');
        }
      } else {
        if ($box.is(':checked')) {
          $box.trigger('click');
        }
      }
    });
  });
})(this);
