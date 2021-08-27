Object.defineProperty(navigator, "languages", {
    get: function() {
       return ["en-US", "en"];
    }
});
  
Object.defineProperty(navigator, 'plugins', {
    get: function() {
       return [{}, {}, {}, {}, {}];
    }
});
  
Object.defineProperty(navigator, 'webdriver', {
    get: function() {
       return false;
    }
});

Object.defineProperty(window, 'outerHeight', {
    get: function() {
       return window.innerHeight + 72;
    }
});

