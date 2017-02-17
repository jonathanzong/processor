var STORAGE_KEY = 'processor-data-lalala';
var PARAGRAPH_RE = /(\n|^).*?(?=\n|$)/g;
var state = [];
var activeIndex = -1;
var $entryContainer;

/*
state = [
  {
    iterations: ["example"],
    selected: 0
  },
];
*/

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function stateToView() {
  var $container = $('.jot-entry-container');
  $container.empty();
  // populate
  $.each(state, function(i, d) {
    var $div = $('<div>', {'class': 'jot-entry', 'data-idx': i});
    $.each(d.iterations, function(_i, text) {
      var $iterdiv = $('<div>', {'class': 'jot-entry-iteration', 'data-idx': _i});
      $iterdiv.text(text);
      if (_i == d.selected) {
        $iterdiv.addClass('selected');
      }
      $div.append($iterdiv);
    });
    if (i == activeIndex) {
      $div.addClass('active');
    }
    $container.append($div);
    $div.flickity({
      initialIndex: d.selected
    });
    $div.on( 'select.flickity', function() {
      d.selected = $(this).data('flickity').selectedIndex;
      saveState();
    })
  });
  // update menu
  if (state.length) {
    $('.jot-form-header-emptymenu').addClass('hidden');
    $('.jot-form-header-menu').removeClass('hidden');
  }
  else {
    $('.jot-form-header-emptymenu').removeClass('hidden');
    $('.jot-form-header-menu').addClass('hidden'); 
  }
}

function iterate($carousel, data) {
  var copiedText = data.iterations[data.selected];
  data.iterations.push(copiedText);
  var i = data.iterations.length - 1;
  var $iterdiv = $('<div>', {'class': 'jot-entry-iteration', 'data-idx': i});
  var $textarea = $('<textarea>');
  $textarea.val(copiedText);
  $iterdiv.append($textarea);
  $carousel.flickity( 'append', $iterdiv );
  autosize($textarea);
  $carousel.flickity('resize');
  $carousel.flickity( 'select', i);
  $textarea.prop('selectionStart', 0);
  $textarea.prop('selectionEnd', copiedText.length);
  $textarea.focus();
  // focus out to finish editing
  $textarea.one('focusout', function() {
    var text = $textarea.val();
    data.iterations[i] = text;
    $textarea.remove();
    $iterdiv.text(text);
    $carousel.flickity('resize');
  });
}

$(document).ready(function() {
  // initialize ui things

  autosize($('textarea'));
  // import prompt
  $('.jot-form-import').click(function() {
    $('#import-dialog').dialog({
      modal: true,
      buttons: {
        Cancel: function() {
          $( this ).dialog( "close" );
        },
        Ok: function() {
          var text = $('.import-text').val();
          var paragraphs = text.match(PARAGRAPH_RE)
                               .map(function(n) { return n.trim(); })
                               .filter(function(n){ return n.length; }); 
          state = paragraphs.map(function(n) {
            return {
              iterations: [n],
              selected: 0
            };
          });
          console.log(state);
          saveState();
          stateToView();
          $( this ).dialog( "close" );
        }
      }
    });
  });
  // clear prompt
  $('.jot-form-clear').click(function() {
    $('#clear-dialog').dialog({
      modal: true,
      buttons: {
        Clear: function() {
          state = [];
          saveState();
          stateToView();
          $( this ).dialog( "close" );
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      }
    });
  });
  // copy prompt
  $('.jot-form-copy').click(function() {
    // copy
    var $temp = $("<textarea>");
    $("body").append($temp);
    var str = "";
    $.each(state, function(i) {
      $.each(state[i], function(j, d) {
        str += d + '\n\n';
      });
    });
    $temp.val(str.trim()).select();
    document.execCommand("copy");
    $temp.remove();
    //
    $('#copy-dialog').dialog({
      modal: true,
      buttons: {
        Ok: function() {
          $( this ).dialog( "close" );
        }
      }
    });
  });
  // cmd+enter to submit form
  $('.jot-form-text').keydown(function(e) {
    if ($(this).val().trim().length == 0) return;
    if(e.keyCode == 13 && e.metaKey) {
      $('#jot-form').submit();
      var $container = $('.jot-entry-container');
      $container.animate({"scrollTop": $container[0].scrollHeight}, 100);
    }
  });
  // tooltip
  $('.jot-form-text').tooltip({
    position: { my: "left center", at: "right center" },
    disabled: true
  });
  $('.jot-form-text').on("mouseenter mouseleave", function (e) {
    e.stopImmediatePropagation();
  });
  // show tooltip to teach keyboard shortcut
  var tooltipTimeout;
  $('.jot-form-text').keyup(function(e) {
    var $this = $(this);
    $this.tooltip('close').tooltip('disable');
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(function() {
      if ($this.val().trim().length > 0) {
        $this.tooltip('enable').tooltip('open');
      }
    }, 2500);
  });

  // init from storage
  loadState();
  stateToView();
  // jot form submit handler
  $('#jot-form').submit(function(e) {
    var val = $('.jot-form-text').val();
    if (val.length < 1) return;
    state.push({
      iterations: [val],
      selected: 0
    });
    $('.jot-form-text').val("");
    saveState();
    stateToView(); // TODO inefficient
    return false;
  });
  $(document).on('click', '.jot-entry', function() {
    $('.jot-entry').removeClass('active');
    $(this).addClass('active');
    activeIndex = $(this).attr('data-idx');
    // activeIndexToView($(this).attr('data-idx'));
    // stateToView();
  });
  $(document).on('keydown', '.jot-entry', function(e) {
    var keyCode = e.keyCode || e.which; 
    if (keyCode == 9) {
      // tab
      e.preventDefault();
      if (activeIndex > -1) {
        iterate($(this), state[activeIndex]);
      }
    }
  });
  // esc to focus the jot text box
  $(document).on('keydown', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == 27) {
      // esc
      $('.jot-entry').removeClass('active');
      activeIndex = -1;
      $('.jot-form-text').focus();
    }
  });
  // click outside to deselect a jot
  $(document).click(function(event) { 
    if(!$(event.target).closest('.jot-entry').length) {
      $('.jot-entry').removeClass('active');
      activeIndex = -1;
    }
  });
});
