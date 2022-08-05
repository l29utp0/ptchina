var chatFrame = document.getElementById('chat'); 
chatFrame.addEventListener("load", function() { 
var iframe = document.getElementById('chat');
var style = document.createElement('style');
style.textContent =
    'body {' +
    '  scrollbar-width: none;' +
    '  -ms-overflow-style: none;' +
    '}' +
    '.navbar {' +
    '  display:none;' +
    '}'+
    '.board-header {' +
    '  display:none;' +
    '}'+
    '.pages {' +
    '  display:none;' +
    '}'+
    '.footer {' +
    '  display:none;' +
    '}'+
    'main {' +
    '  margin:0;' +
    '}'+
    '#threadstats {' +
    '  display:none;' +
    '}'+
    '#action-menu {' +
    '  display:none;' +
    '}'+
    '.stickynav {' +
    '  display:none;' +
    '}'+
    '.post-check {' +
    '  display:none;' +
    '}'+
    '.post-name {' +
    '  margin-left:5px;' +
    '}'+
    '::-webkit-scrollbar {' +
    '  display:none;' +
    '}'+
    '.wpcc-container {' +
    '  display:none;' +
    '}'
;
iframe.contentDocument.head.appendChild(style);
});