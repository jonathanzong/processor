var STORAGE_KEY = 'processor-data-lalala';
var PARAGRAPH_RE = /(\n|^).*?(?=\n|$)/g;
var sheet = document.createStyleSheet();
var state = [];
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
  $.each(state, function(i, d) {
    d.iterations = d.iterations.filter(function(n){ return n.trim().length > 0; }); 
  });
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
      $div.append($iterdiv);
    });
    $container.append($div);
    $div.flickity({
      initialIndex: d.selected,
      pageDots: false,
      draggable: false
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

function iterate($jotEntry) {
  var data = state[$jotEntry.attr('data-idx')];
  var copiedText = data.iterations[data.selected];
  data.iterations.push(copiedText);
  var i = data.iterations.length - 1;
  var $iterdiv = $('<div>', {'class': 'jot-entry-iteration', 'data-idx': i});
  $iterdiv.text(copiedText);
  $jotEntry.flickity( 'append', $iterdiv );
  makeIterationEditable($iterdiv, true);
}

function makeIterationEditable($iterdiv, selectAll) {
  if ($iterdiv.attr('contenteditable')) return;
  $iterdiv.attr('contenteditable', 'true');
  var $jotEntry = $iterdiv.parents('.jot-entry');
  $jotEntry.flickity( 'select', $iterdiv.attr('data-idx'));
  if (selectAll) {
    $iterdiv.prop('selectionStart', 0);
    $iterdiv.prop('selectionEnd', text.length);
  }
  $iterdiv.focus();
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
    $.each(state, function(i, d) {
      str += d.iterations[d.selected] + '\n\n';
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

  // jot form submit handler
  $('#jot-form').submit(function(e) {
    var val = $('.jot-form-text').val();
    if (val.length < 1) return;
    state.push({
      iterations: [val],
      selected: 0
    });
    $('.jot-form-text').val('');
    autosize.update($('.jot-form-text'));
    saveState();
    stateToView(); // TODO inefficient
    return false;
  });
  // click handler to choose active jot entry
  $(document).on('click', '.jot-entry', function() {
    var $this = $(this);
    if (!$this.hasClass('active')) {
      sheet.clearRules();
      var oldActive = $('.jot-entry.active');
      oldActive.removeClass('active');
      oldActive.flickity('resize');
      var pos = getFixedPos($this[0]);
      var iter_width = $this.find('.jot-entry-iteration').width();
      sheet.addRule('.jot-entry.active', 'position: fixed; z-index: 999; left: 0px; top: '+pos.top+'px; background: #DADDE0;');
      sheet.addRule('.jot-entry.active .jot-entry-iteration', 'width: '+iter_width+'px;');
      sheet.addRule('.jot-entry-scroll', 'overflow-y: hidden;');
      sheet.addRule('.flickity-prev-next-button', 'bottom: -30px;');
      $this.addClass('active');
      $(document).tooltip('enable');
      $this.flickity('resize');
      // make selected editable
      var $iterdiv = $($this.data('flickity').selectedElement);
      makeIterationEditable($iterdiv);
    }
    else {
      $(document).tooltip('disable');
    }
  });
  // click selected iteration of active jot entry to edit
  $(document).on('click', '.jot-entry.active .jot-entry-iteration.is-selected', function() {
    // make selected editable
    makeIterationEditable($(this));
  })
  // focus out to finish editing
  $(document).on('focusout', '.jot-entry-iteration[contenteditable]', function() {
    var $this = $(this);
    var text = $this.text();
    var $jotEntry = $this.parents('.jot-entry');
    var data = state[$jotEntry.attr('data-idx')];
    data.iterations[$this.attr('data-idx')] = text;
    if (text.trim().length == 0) {
      $jotEntry.flickity( 'remove', $this );
      $jotEntry.flickity( 'previous' );
    }
    $this.removeAttr('contenteditable');
    saveState();
  });
  // tab to iterate tooltip
  $(document).tooltip({
    items: '.jot-entry.active',
    content: 'tab to iterate',
    position: { my: "left center", at: "right center" },
    disabled: true
  });
  // tab to iterate handler
  $(document).on('keydown', '.jot-entry', function(e) {
    var keyCode = e.keyCode || e.which; 
    if (keyCode == 9) {
      // tab
      e.preventDefault();
      if ($(this).hasClass('active')) {
        $(this).focus();
        iterate($(this));
      }
    }
  });
  $(document).on('keydown', '.jot-entry.active', function(e) {
    if (e.keyCode == 37 && e.metaKey) {
      // cmd + left
      $(this).flickity('previous');
    }
    else if (e.keyCode == 39 && e.metaKey) {
      // cmd + right
      $(this).flickity('next');
    }
    else if (e.keyCode == 8 || e.keyCode == 46) {
      // delete || backspace
      if ($('.jot-entry.active[contenteditable]').length == 0) {
        $(this).remove();
      }
    }
  });
  // esc to focus the jot text box
  $(document).on('keydown', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == 27) {
      // esc
      if ($('.jot-entry.active[contenteditable]').length == 0) {
        var oldActive = $('.jot-entry.active');
        sheet.clearRules();
        oldActive.removeClass('active');
        oldActive.flickity('resize');
        $('.jot-form-text').focus();
      }
      else {
        $('.jot-entry.active').focus();
      }
    }
  });
  // click outside to deselect a jot
  $(document).click(function(event) { 
    if(!$(event.target).closest('.jot-entry').length) {
      if ($('.jot-entry.active[contenteditable]').length == 0) {
        var oldActive = $('.jot-entry.active');
        sheet.clearRules();
        oldActive.removeClass('active');
        oldActive.flickity('resize');
      }
    }
  });

  // init from storage
  loadState();
  stateToView();
});

