var STORAGE_KEY = 'processor-data-lalala';
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

$(document).ready(function() {
  $entryContainer = $('.explore-entry-container');
  loadState();
  stateToView();
  $('#jot-form').submit(function(e) {
    state.push([$('.jot-form-text').val()]);
    $('.jot-form-text').val("");
    saveState();
    stateToView();
    return false;
  });
  $(document).on('click', '.jot-entry', function() {
    activeIndexToView($(this).attr('data-idx'));
  });
  $('.explore-button').click(function() {
    var texts = state[activeIndex];
    $('.explore-entry-edit').replaceWith(function() {
      var $div = $('<div>', {'class': 'explore-entry', 'data-idx': texts.length - 1});
      $div.text($(this).val());
      return $div;
    });
    var copylast = texts[texts.length - 1];
    texts.push(copylast);
    var $textarea = $('<textarea>', {'class': 'explore-entry-edit'});
    $textarea.val(copylast);
    $entryContainer.append($textarea);
    $textarea.prop('selectionStart', 0);
    $textarea.prop('selectionEnd', copylast.length);
    $textarea.focus();
    return false;
  });
  $(document).on('focusout', '.explore-entry-edit', function() {
    var texts = state[activeIndex];
    texts[texts.length - 1] = $('.explore-entry-edit').val();
    saveState();
  })

  $('#clear').click(function() {
    state = [];
    saveState();
    stateToView();
  })
});
