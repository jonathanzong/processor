var STORAGE_KEY = 'processor-data-lalala';
var PARAGRAPH_RE = /(\n|^).*?(?=\n|$)/g;
var state = [];
var activeIndex = -1;
var $entryContainer;

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function stateToView() {
  var $container = $('.jot-entry-container');
  $container.empty();
  $.each(state, function(i, d) {
    var text = d[0];
    var $div = $('<div>', {'class': 'jot-entry', 'data-idx': i});
    $div.text(text);
    if (i == activeIndex) {
      $div.addClass('active');
    }
    $container.prepend($div);
  });
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
    $('#dialog-message').dialog({
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
          state = paragraphs.map(function(n) {return [n];}).reverse();
          stateToView();
          $( this ).dialog( "close" );
        }
      }
    });
  });

  $entryContainer = $('.explore-entry-container');
  loadState();
  stateToView();
  $('#jot-form').submit(function(e) {
    var val = $('.jot-form-text').val();
    if (val.length < 1) return;
    state.push([val]);
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

  $('#clear').click(function() {
    state = [];
    saveState();
    stateToView();
  });

  $('#copy').click(function() {
    var $temp = $("<textarea>");
    $("body").append($temp);
    var str = "";
    $.each(state, function(i) {
      $.each(state[i], function(j, d) {
        str += d + '\n\n';
      });
    });
    $temp.val(str).select();
    document.execCommand("copy");
    $temp.remove();
  });
});

// import prompt handler
function importPrompt() {
  var input = prompt("Please paste your text into this tiny box.");
  
  if (input != null) {
    console.log(input);
  }
}
