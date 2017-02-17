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

function activeIndexToView(index) {
  activeIndex = index;
  $entryContainer.empty();
  $.each(state[activeIndex], function(i, d) {
    var text = d;
    var $div = $('<div>', {'class': 'explore-entry', 'data-idx': i});
    $div.text(text);
    $entryContainer.append($div);
  });
}

function iterate(index) {
  var texts = state[activeIndex];
  $('.explore-entry-edit').replaceWith(function() {
    var $div = $('<div>', {'class': 'explore-entry', 'data-idx': texts.length - 1});
    $div.text($(this).val());
    return $div;
  });
  var copy = texts[index];
  texts.push(copy);
  var $textarea = $('<textarea>', {'class': 'explore-entry-edit'});
  $textarea.val(copy);
  $entryContainer.append($textarea);
  $textarea.prop('selectionStart', 0);
  $textarea.prop('selectionEnd', copy.length);
  $textarea.focus();
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
          state = paragraphs.map(function(n) {return [n];});
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
  // clear prompt
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

  $entryContainer = $('.explore-entry-container');
  loadState();
  stateToView();
  $('#jot-form').submit(function(e) {
    var val = $('.jot-form-text').val();
    if (val.length < 1) return;
    state.push({
      iterations: [val],
      selected: 0
    });
    $('.jot-form-text').val("");
    saveState();
    stateToView();
    return false;
  });
  $(document).on('click', '.jot-entry', function() {
    activeIndexToView($(this).attr('data-idx'));
    stateToView();
  });
  $(document).on('click', '.explore-entry', function() {
    iterate($(this).attr('data-idx'));
    return false;
  });
  $(document).on('focusout', '.explore-entry-edit', function() {
    var texts = state[activeIndex];
    var val =  $('.explore-entry-edit').val();
    if (val.length < 1) return;
    texts[texts.length - 1] = val;
    saveState();
  });
  $(document).on('keydown', '.explore-entry-edit', function(e) {
    var keyCode = e.keyCode || e.which; 
    if (keyCode == 9) {
      // tab
      e.preventDefault();
      var texts = state[activeIndex];
      iterate(texts.length - 1);
    }
  });
  $(document).on('keydown', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode == 27) {
      // esc
      $('.jot-form-text').focus();
    }
  })
});

// import prompt handler
function importPrompt() {
  var input = prompt("Please paste your text into this tiny box.");
  
  if (input != null) {
    console.log(input);
  }
}
