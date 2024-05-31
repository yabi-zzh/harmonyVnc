// (function () {
var input = '',
  token = '',
  h264 = '',
  iosUrl = '';

// 当前连接的是 ios
var iosMode = false;

var ip = '';
var port = '';
var token = '';

var path_token = getUrlParam('token');
var path_host = getUrlParam('host');
var path_port = getUrlParam('port');

if (path_token) {
  token = path_token;
} else {
  token = localStorage.token ? localStorage.token : '';
}

if (path_host) {
  ip = path_host;
} else {
  ip = localStorage.ip ? localStorage.ip : 'localhost';
}

if (path_port) {
  port = path_port;
} else {
  port = localStorage.port ? localStorage.port : '80';
}

var protocol = window.location.protocol;
var urlInput = $('.url-input');
var urlH264 = $('.url-h264');
var urlIOS = $('.url-ios');
var ipInput = $('.input-wrap.ip input');
var portInput = $('.input-wrap.port input');
var tokenInput = $('.input-wrap.token input');

var isH264 = localStorage.isH264 == 'true' ? true : false;
var minicap = !isH264;
var isVertical;
var mobile = { width: 1080, height: 1920 };
var rate = mobile.height / mobile.width;
var css =
  '.mobile .screen > div { padding-top:' +
  100 * rate +
  '%;}' +
  '.mobile-l .screen > div { padding-top:' +
  100 / rate +
  '%;}';
$('#css').html(css);

if (isH264) {
  $('.is-h264 li')
    .eq(0)
    .addClass('active');
} else {
  $('.is-h264 li')
    .eq(1)
    .addClass('active');
}
if (protocol.indexOf('https') > -1) {
  var ws = 'wss://';
  var http = 'https://';
} else {
  var ws = 'ws://';
  var http = 'http://';
}
setUrl();
setInput();
$('.input-wrap input').on('input', function() {
  var val = $(this).val();
  if (val) {
    $(this)
      .parent()
      .find('.clear-away')
      .show();
  } else {
    $(this)
      .parent()
      .find('.clear-away')
      .hide();
  }
  if (
    $(this)
      .parent()
      .attr('mtype') == 'ip'
  ) {
    ip = val;
  } else if (
    $(this)
      .parent()
      .attr('mtype') == 'port'
  ) {
    port = val;
  } else {
    token = val;
  }
  setUrl();
});
$('.input-wrap .clear-away').on('click', function() {
  var input = $(this)
    .parent()
    .find('input');
  var type = $(this)
    .parent()
    .attr('mtype');
  input.val('');
  if (type == 'ip') {
    ip = '';
  } else if (type == 'port') {
    port = '';
  } else {
    token = '';
  }
  $(this).hide();
  setUrl();
  setInput();
});
$('.g1 li').on('click', function() {
  switchover($(this));
});
$('.g2 li').on('click', function() {
  switchover($(this));
});
$('.save').on('click', function() {
  var type = $(this)
    .parent()
    .attr('mtype');
  localStorage[type] = $(this)
    .parent()
    .find('input')
    .val();
});
$('.is-h264 li').on('click', function() {
  var isH264 = !!$(this).attr('isH264');
  localStorage.isH264 = isH264;
  minicap = !isH264;
});
function setUrl() {
  input = ws + ip + ':' + port + '/ndesktop/input';
  h264 = http + ip + ':' + port + '/ndesktop/h264';
  iosUrl = ws + ip + ':' + port + '/ndesktop/';

  // input = ws + ip + ':' + port + '/input';
  // h264 = http + ip + ':' + port + '/h264';
  if (token && token.length > 0) {
    input += '?token=' + token;
    h264 += '?token=' + token;
    iosUrl += '?token=' + token;
  } else {
    input = input.replace('/ndesktop', '');
    h264 = h264.replace('/ndesktop', '');
    iosUrl = iosUrl.replace('/ndesktop', '');
  }

  urlInput.html(input);
  urlH264.html(h264);
  urlIOS.html(iosUrl);
}

function setInput() {
  if (ip) {
    ipInput.val(ip);
    ipInput
      .parent()
      .find('.clear-away')
      .show();
  }
  if (port) {
    portInput.val(port);
    portInput
      .parent()
      .find('.clear-away')
      .show();
  }

  if (token) {
    tokenInput.val(token);
    tokenInput
      .parent()
      .find('.clear-away')
      .show();
  }
}

function switchover(e) {
  e.parent()
    .find('li')
    .removeClass('active');
  e.addClass('active');
}

//显示相关   ======================================================>
var websocketconnected = undefined;
var inputWebSocket;
var h264Socket;
var attemptCount = 0;
var maxRetries = 5;
var lastEvent;
var screenWidth;
var screenHeight;
var g = [5e5, 75e4, 1e6, 15e5, 2e6, 3e6, 4e6];
var c; // = $('.screen canvas')[0];
// c.oncontextmenu = function () {
//     return false;
// };
var GC;
var BLANK_IMG =
  'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
var rectWidth; //= c.offsetWidth;
var rectHeight; //= c.offsetHeight;

// class FetchSocket   ======================================================>
function FetchSocket(url, cb) {
  this.promise = fetch(url).then(
    function(response) {
      this.connected = true;
      this.response = response;
      this.reader = this.response.body.getReader();
      // console.log(this.reader.cancel);
      this.reader.closed.then(
        function() {
          if (this.onClose) this.dataReceived(null);
        }.bind(this)
      );
      this.onResume();
      cb(this);
    }.bind(this),
    function(error) {
      cb(null, error);
    }
  );
}

FetchSocket.prototype.dataReceived = function(payload) {
  // if (this.disconnected) return;
  if (payload && payload.length) {
    var arr = new Uint8Array(payload);
    if (!this.pending) this.pending = [arr];
    else this.pending.push(arr);
  }
  if (payload == null) this.closed = true;
  if (this.paused || !this.pending || !this.pending.length) {
    var cb = this.onClose;
    if (this.closed && cb) {
      delete this.onClose;
      cb();
    }
    return;
  }
  var pl = this.pendingLength;
  var cb = this.pendingCallback;
  if (cb) {
    delete this.pendingCallback;
    this.read(pl, cb);
  }
};
FetchSocket.prototype.onResume = function() {
  this.reader.read().then(
    function(chunk) {
      if (!chunk.value) return;
      this.dataReceived(chunk.value);
      if (this.paused) {
        return;
      }
      this.onResume();
    }.bind(this)
  );
};

FetchSocket.connect = function(url, cb) {
  new FetchSocket(url, cb);
};

function fetchReaderPump(reader) {
  reader.read().then(function(result) {
    fetchReaderReceive(reader, result);
  });
}

function fetchReaderReceive(reader, result) {
  if (result.done) {
    console.log('result', result);
  } else {
    console.log('result', result);
  }
}

FetchSocket.prototype.unshift = function(buffer) {
  if (buffer.byteLength == 0) return;
  if (!this.pending) this.pending = [buffer];
  else this.pending.unshift(buffer);
};

FetchSocket.prototype.buffered = function() {
  var ret = 0;
  if (this.pending) {
    for (var buf in this.pending) {
      buf = this.pending[buf];
      ret += buf.byteLength;
    }
  }
  return ret;
};

FetchSocket.prototype.read = function() {
  if (this.pendingCallback) {
    throw new Error('double callback');
  }
  if (this.closed && !this.pending) {
    var cb = this.onClose;
    if (cb) {
      delete this.onClose;
      cb();
    }
    return;
  }
  var argc = 0;
  if (arguments[argc].constructor.name == 'Number') {
    this.pendingLength = arguments[argc++];
  } else {
    this.pendingLength = 0;
  }
  var cb = arguments[argc];
  if (!this.pending || this.paused) {
    this.pendingCallback = cb;
    return;
  }
  if (!this.pendingLength) {
    this.pendingLength = this.buffered();
  } else if (this.pendingLength > this.buffered()) {
    this.pendingCallback = cb;
    return;
  }
  var data;
  var totalRead = 0;
  while (totalRead < this.pendingLength) {
    var buf = this.pending.shift();
    if (!this.pending.length) delete this.pending;
    var add = buf;
    var need = Math.min(add.byteLength, this.pendingLength - totalRead);
    if (need != add.byteLength) {
      var part = add.subarray(0, need);
      var leftover = add.subarray(need);
      this.unshift(leftover);
      add = part;
    }
    if (!data && add.byteLength != this.pendingLength)
      data = new Uint8Array(this.pendingLength);
    if (data) {
      data.set(add, totalRead);
    } else {
      data = add;
    }
    totalRead += add.byteLength;
  }
  cb(data);
};

FetchSocket.prototype.pause = function() {
  if (this.paused) {
    return;
  }
  this.paused = true;
  this.onPause();
};

FetchSocket.prototype.destroy = function() {
  // this.disconnected = true;
  // console.log(this.reader.cancel)
  this.reader.cancel();
  // this.promise && this.promise.cancel && this.promise.cancel()
};
// class FetchSocket end
// withSocket   ======================================================>
function withSocket(socket) {
  if (h264Socket) {
    h264Socket.destroy();
  }
  h264Socket = socket;
  if (!socket) {
    return;
  }
  socket.onClose = function() {
    console.log('onClose');
    // inputWebSocket = null;
    // if (h264Socket == socket) h264Socket = null
  };
  var defaultConfig = {
    filter: 'original',
    filterHorLuma: 'optimized',
    filterVerLumaEdge: 'optimized',
    getBoundaryStrengthsA: 'optimized'
  };
  var canvas;
  var asmInstance;
  var avc = new Avc();

  avc.configure(defaultConfig, function() {
    console.log('callback for avc');
  });
  avc.onPictureDecoded = function(buffer, width, height) {
    if (!buffer) {
      console.log('no buffer?');
      return;
    }
    if (!canvas) {
      canvas = new WebGLCanvas(c, undefined, {});

      if (!canvas.contextGL) {
        alert(
          'WebGL is disabled in Chrome. Enable it for AndCast to work properly.'
        );
      }
    }
    if (!rectWidth || !rectHeight) return;
    canvas.drawNextOutputPicture(
      width,
      height,
      {
        left: 0,
        top: 0,
        width: Math.round(rectWidth),
        height: Math.round(rectHeight)
      },
      buffer
    );
  };

  var isSps = true;
  var payloadReader = function(data) {
    var video = data.subarray(8);
    if (isSps) {
      isSps = false;
      if (video[5] != 66 && video.byteLength >= 6) console.log('bbbbb');
    }

    avc.decode(video);
    socket.read(4, headerReader);
  };
  var headerReader = function(data) {
    if (data.byteLength != 4) {
      throw new Error('WTF');
    }
    var lenBuf = new DataView(data.buffer, data.byteOffset, 4);
    var len = lenBuf.getInt32(0, true);
    socket.read(len, payloadReader);
  };
  var firstRead = setTimeout(function() {
    console.log('aaaaa');
  }, 5e3);
  socket.read(4, function(data) {
    clearTimeout(firstRead);
    headerReader(data);
  });
}
// withSocket end

// sendEvent   ======================================================>
function sendEvent(e) {
  if (!inputWebSocket) return;
  var d;
  var w, h;
  if (rectWidth > rectHeight) {
    w = Math.max(screenWidth, screenHeight);
    h = Math.min(screenWidth, screenHeight);
  } else {
    h = Math.max(screenWidth, screenHeight);
    w = Math.min(screenWidth, screenHeight);
  }
  // console.log(screenWidth, screenHeight, w, h)
  if (e.layerX) {
    if (!d) {
      d = {};
      if (e.type == 'mouseout') {
        d.type = 'mouseup';
      } else {
        d.type = e.type;
      }
    }
    // var rate = screenHeight / screenWidth;
    // var rectWidth = c.offsetWidth;
    // var rectHeight = rectWidth * rate;
    //rectWidth：dom宽，screenWidth：画布宽
    d.pageX = (e.layerX / rectWidth) * w;
  }
  if (e.layerY) {
    if (!d) {
      d = {};
      if (e.type == 'mouseout') {
        d.type = 'mouseup';
      } else {
        d.type = e.type;
      }
    }
    // var rate = screenHeight / screenWidth;
    // var rectWidth = c.offsetWidth;
    // var rectHeight = rectWidth * rate;
    d.pageY = (e.layerY / rectHeight) * h;
  }
  if (d) {
    // console.log(d);
    inputWebSocket.send(JSON.stringify(d));
  } else {
    // console.log(e);
    inputWebSocket.send(JSON.stringify(e));
  }
  lastEvent = e;
  window.event && window.event.preventDefault();
  return false;
}

function enforceAspectRatio(ow, oh) {
  if (oh == screenWidth && ow == screenHeight) {
    var tmp = rectWidth;
    rectWidth = rectHeight;
    rectHeight = tmp;
  } else {
  }
  resizeWindow();
}

function resizeWindow() {
  // c.width = Math.round(rectWidth);
  // c.height = Math.round(rectHeight);
  c.width = Math.round(screenWidth);
  c.height = Math.round(screenHeight);
}

function throttleTimeout(e, t, n, o) {
  if (!e)
    e = {
      items: []
    };
  e.items.push(t);
  if (!e.timeout) {
    e.timeout = setTimeout(function() {
      delete e.timeout;
      o(e.items);
      e.items = [];
    }, n);
  }
  return e;
}

$('.connect').on('click', function() {
  // c = $('.screen canvas')[0];
  // c.oncontextmenu = function () {
  //     return false;
  // };
  if (websocketconnected) {
    alert('请先断开连接');
    return;
  }

  minicap = !$(this).attr('isH264');
  initDoms(minicap, attemptConnection);
});

// 连接ios 按钮
$('.connect-ios').on('click', function() {
  if (websocketconnected) {
    alert('请先断开连接');
    return;
  }
  initDoms(false, attemptConnectionIos);
});

function initDoms(m, cb) {
  $('<canvas></canvas>').appendTo($('#canvas-wrap'));
  c = $('.screen canvas')[0];
  rectWidth = c.offsetWidth;
  rectHeight = c.offsetHeight;
  minicap = m;
  cb();
}

function connect264() {
  new FetchSocket(urlH264.html(), withSocket);
  // FetchSocket.connect(urlH264.html(), withSocket)
}
function stop() {
  iosMode = false;
  $('.canvas-mask').show();
  websocketconnected = false;
  sendEvent({
          type: 'stopminicap'
        });
  inputWebSocket && inputWebSocket.close();
  inputWebSocket = undefined;
  h264Socket && h264Socket.destroy && h264Socket.destroy();
  h264Socket = undefined;
  canvas = undefined;
  // avc = undefined;
  attemptCount = 0;
  maxRetries = 5;
  lastEvent = undefined;
  screenWidth = undefined;
  screenHeight = undefined;
  GC = undefined;
  $('#canvas-wrap canvas').remove();
  switchover($('.g1 li').eq(0));
  iosBaseUrl = '';
  iosToken = '';
  // $('#canvas-wrap').append($('<canvas></canvas>'));
}
function attemptConnection() {
  attemptCount++;
  if (attemptCount == maxRetries) {
    withSocket();
    return;
  }
  function reattempt() {
    console.log(
      'input websocket failed, retrying. attempt ' +
        attemptCount +
        ' out of ' +
        maxRetries
    );
    setTimeout(attemptConnection, 2e3);
  }

  if (inputWebSocket) {
    sendEvent({
      type: 'connected'
    });
  } else {
    inputWebSocket = new ReconnectingWebSocket(
      urlInput.html(),
	  'mirror-protocol'
    );
    inputWebSocket.binaryType = 'blob';
    inputWebSocket.maxReconnectAttempts = 2;
    inputWebSocket.reconnectDecay = 1;
  }
  inputWebSocket.onopen = function() {
    $('.canvas-mask').hide();
    inputWebSocket = this;
    console.log('input websocket opened');
    setTimeout(function() {
      sendEvent({
        type: 'connected',
        height: rectHeight * 2
      });

      websocketconnected = true;

      minicap &&
        sendEvent({
          type: 'startminicap'
        });

      sendEvent({
        type: 'bitrate',
        bitrate: 5e5
      });
      if (minicap) {
        GC = c.getContext('2d');
      }
      c.onmouseover = mouseover;
      c.onmouseout = mouseout;
      c.onmousedown = mousedown;
      c.onmouseup = mouseup;
      c.onmousemove = mousemove;
      c.onmousewheel = mousewheel;
    }, 300);

    // c.on = mouse;
  };
  inputWebSocket.reconnectInterval = 1000;
  var t;
  // inputWebSocket.onerror = reattempt;

  var URL = window.URL || window.webkitURL;
  var img = new Image();
  var u;
  var blob;
  var i1 = 0,
    i2 = 0;
  img.onload = function() {
    // c for canvas
    i2++;
    console.log(i1 - i2, this);
    // console.log(i1)
    c.width = img.width;
    c.height = img.height;
    screenHeight = img.height;
    screenWidth = img.width;
    // console.log(screenWidth, screenHeight)
    isVertical = screenWidth < screenHeight;
    if (isVertical) {
      $('.mobile').removeClass('mobile-l');
    } else {
      $('.mobile').addClass('mobile-l');
    }
    GC.drawImage(img, 0, 0);
    // img.onload = null;
    // img.src = BLANK_IMG;
    // img = null;
    // u = null;
    // blob = null;
  };
  inputWebSocket.onmessage = function(event) {
    var json = { type: '' };
    if (typeof event.data == 'object' && minicap) {
      i1++;
      // }
      // if (minicap) {
      blob = new Blob([event.data], { type: 'image/jpeg' });
      // var blob = event.data;
      u = URL.createObjectURL(blob);
      img.src = u;
    } else if (typeof event.data == 'string') {
      json = JSON.parse(event.data);
      if (json.type == 'displaySize') {
        $('.canvas-mask').hide();
        var needs264 = !h264Socket;
        // var ow = screenWidth;
        // var oh = screenHeight;
        screenWidth = json.screenWidth;
        screenHeight = json.screenHeight;
        isVertical = screenWidth < screenHeight;
        if (isVertical) {
          $('.mobile').removeClass('mobile-l');
        } else {
          $('.mobile').addClass('mobile-l');
        }
        rectWidth = c.offsetWidth;
        rectHeight = c.offsetHeight;
        c.width = rectWidth;
        c.height = rectHeight;
        // if (minicap) {
        //     c.width = screenWidth;
        //     c.height = screenHeight;
        // } else {
        //     c.width = rectWidth;
        //     c.height = rectHeight;
        // }
        // c.width = Math.round(rectWidth);
        // c.height = Math.round(rectHeight);
        // if (!ow && !oh) {
        //     rectWidth = screenWidth;
        //     rectHeight = screenHeight;
        // }
        // enforceAspectRatio(ow, oh);
        if (!minicap && needs264) connect264();
      } else if (json.type == 'clip') {
        // copyTextToClipboard(json.clip)
      } else if (json.type == 'encodeSize') {
        // r = json.encodeWidth;
        // a = json.encodeHeight;
        if (!h264Socket) {
          attemptConnection();
          return;
        }
        t = throttleTimeout(t, null, 1e3, function() {
          stop();
          // h264Socket.onClose = null;
          // h264Socket.destroy();
          // h264Socket = null;
          attemptConnection();
        });
      }
    }
  };
}

var iosBaseUrl = '';
var iosToken = '';
var iosWidth = 0;
var iosHeight = 0;
// 连接ios
function attemptConnectionIos() {
  // 设置 ios 路径
  iosBaseUrl = http + ip + ':' + port + '/ndesktop/';
  if (token && token.length > 0) {
    iosToken = '?token=' + token;
  } else {
    iosToken = '';
    iosBaseUrl = iosBaseUrl.replace('/ndesktop', '');
  }

  // 初始化 ws
  if (!inputWebSocket) {
    inputWebSocket = new ReconnectingWebSocket(urlIOS.html());
    inputWebSocket.maxReconnectAttempts = 2;
    inputWebSocket.reconnectDecay = 1;
    inputWebSocket.reconnectInterval = 1000;
  }

  inputWebSocket.onopen = function() {
    iosMode = true;
    $('.canvas-mask').hide();
    inputWebSocket = this;
    websocketconnected = true;
    GC = c.getContext('2d');
    c.onmousedown = iosMouseDown;
    c.onmouseup = iosMouseUp;
    c.onmousemove = iosMouseMove;
    c.onmouseenter = iosMouseEnter;
    c.onmouseleave = iosMouseLeave;
    inputWebSocket.send(
      JSON.stringify({
        txid: 'monitor_windowsSize',
        eventType: 'search',
        events: { searchName: 'windowsSize' },
      })
    );
  };

  // 收到的图片
  var img = new Image();

  /**
   * @type {HTMLDivElement}
   */
  var canvasWrap = document.getElementById('canvas-wrap');

  // 绘图
  img.onload = function() {
    c.width = img.width;
    c.height = img.height;
    screenHeight = img.height;
    screenWidth = img.width;
    isVertical = screenWidth < screenHeight;
    if (isVertical) {
      canvasWrap.style.paddingTop = img.height / img.width * 100 + '%';
      $('.mobile').removeClass('mobile-l');
    } else {
      canvasWrap.style.paddingTop = img.height / img.width * 100 + '%';
      $('.mobile').addClass('mobile-l');
    }
    GC.drawImage(img, 0, 0);
    if (c.width < c.height) {
      var _w = Math.min(iosWidth, iosHeight);
      var _h = Math.max(iosHeight, iosWidth);
      iosWidth = _w;
      iosHeight = _h;
    } else {
      var _h = Math.min(iosWidth, iosHeight);
      var _w = Math.max(iosHeight, iosWidth);
      iosWidth = _w;
      iosHeight = _h;
    }
  };

  // ws 收到消息
  inputWebSocket.onmessage = function(ev) {
    if (typeof ev.data === 'object') {
      const blob = new Blob([ev.data], { type: 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    } else if (typeof ev.data === 'string' && ev.data[0] === '{') {
      const resJson = JSON.parse(ev.data);
      if (resJson.txid === 'monitor_windowsSize') {
        iosWidth = Math.min(resJson.value.width, resJson.value.height);
        iosHeight = Math.max(resJson.value.width, resJson.value.height);
      }
    }
  };
}

// ios 鼠标移动列表
var iosActions = [];

// ios 鼠标按下事件
function iosMouseDown(ev) {
  iosActions = [];
  iosActions.push({
    x: ev.offsetX,
    y: ev.offsetY,
    type: ev.type,
    timestamp: Date.now()
  });
}

// ios 鼠标移动事件
function iosMouseMove(ev) {
  if (iosActions.length) {
    iosActions.push({
      x: ev.offsetX,
      y: ev.offsetY,
      type: ev.type,
      timestamp: Date.now()
    });
  }
}

function iosMouseEnter() {
  c.focused = true;
  c.focus();
  iosActions = [];
}

function iosMouseLeave(ev) {
  c.focused = false;
  c.blur();
  if (iosActions.length) {
    iosMouseUp(ev);
  }
}

// ios 鼠标抬起事件
function iosMouseUp(ev) {
  if (!iosActions.length) {
    return;
  }
  iosActions.push({
    x: ev.offsetX,
    y: ev.offsetY,
    type: 'mouseup',
    timestamp: Date.now()
  });
  if (!inputWebSocket || !iosBaseUrl) {
    iosActions = []
    return;
  }
  var c= $('#canvas-wrap canvas');
  var rectWidth = c.outerWidth();
  var rectHeight = c.outerHeight();
  iosActions = iosActions.map(function(act){
    act.x = (act.x / rectWidth) * iosWidth;
    act.y = (act.y / rectHeight) * iosHeight;
    return act;
  });
  if (iosActions.length <= 3) {
    if (iosActions[1].timestamp - iosActions[0].timestamp < 300) {
      inputWebSocket.send(
        JSON.stringify({
          eventType: 'action',
          events: {
            actionName: 'tap',
            coordinate: [
              { x: iosActions[1].x.toFixed(0), y: iosActions[1].y.toFixed(0) },
            ],
            duration: '100',
          },
        })
      )
    } else {
      inputWebSocket.send(
        JSON.stringify({
          eventType: 'action',
          events: {
            actionName: 'longPress',
            coordinate: [
              { x: iosActions[1].x.toFixed(0), y: iosActions[1].y.toFixed(0) },
            ],
            duration: (iosActions[1].timestamp - iosActions[0].timestamp < 1500
              ? iosActions[1].timestamp - iosActions[0].timestamp
              : 1500
            ).toFixed(0),
          },
        })
      );
    }
  } else {
    const coordinate = [];
    coordinate.push({ x: iosActions[0].x.toFixed(0), y: iosActions[0].y.toFixed(0) })
    for(let i = 0; i < iosActions.length - 1; i++) {
      let num = Math.floor((iosActions[i+1].timestamp - iosActions[i].timestamp) / 100);
      if ( num >= 1) {
        for (let _ = 0; _ < num ; _++) {
          coordinate.push({ x: iosActions[i].x.toFixed(0), y: iosActions[i].y.toFixed(0) })
        }
      } else {
        if (i + 1 != iosActions.length - 1) {
          iosActions[i + 1] = iosActions[i];
        }
      }
    }
    coordinate.push({ x: iosActions[iosActions.length - 1].x.toFixed(0), y: iosActions[iosActions.length - 1].y.toFixed(0) })
    inputWebSocket.send(
      JSON.stringify({
        eventType: 'action',
        events: {
          actionName: 'drag',
          coordinate: coordinate,
          duration: '50',
        },
      })
    );
  }
  iosActions = []
}

// ios home
function iosHome() {
  if (!inputWebSocket || !iosBaseUrl) {
    return;
  }
  inputWebSocket.send(
    JSON.stringify({
      eventType: 'action',
      events: { actionName: 'home' },
    })
  );
}

// 获取 ios session
function iosSession() {
  return $.ajax(iosBaseUrl + 'status' + iosToken, {
    method: 'GET'
  }).then(function(resp) {
    return Promise.resolve(resp.sessionId);
  });
}

function rotate() {
  sendEvent({
    type: 'rotate'
  });
}

function keycode(keycode) {
  sendEvent({
    type: 'keycode',
    keycode: keycode
  });
}

function resolution(r) {
  sendEvent({
    type: 'resolution',
    resolution: r
  });
}

function bitrate(b) {
  sendEvent({
    type: 'bitrate',
    bitrate: b
  });
}

function mouseover() {
  this.focused = true;
  c.focus();
}

function mouseout(e) {
  c.focused = false;
  c.blur();
  if (!c.clicking) return;
  c.clicking = false;
  e = e || window.event;
  sendEvent(e);
}

function mousedown(e) {
  e = e || window.event;
  if (e.which == 1) {
    c.clicking = true;
  }
  switch (e.which) {
    case 1:
      sendEvent(e);
      return;
    case 2:
      sendEvent({
        type: 'home'
      });
      return;
    case 3:
      sendEvent({
        type: 'back'
      });
      return;
  }
}

function mouseup(e) {
  c.clicking = false;
  if (e.which > 1) return;
  e = e || window.event;
  sendEvent(e);
}

function mousemove(e) {
  if (!c.clicking) return;
  if (e.which > 1) return;
  e = e || window.event;
  sendEvent(e);
}

function mousewheel(e) {
  e = e || window.event;
  c.clicking = false;
  sendEvent({
    type: 'scroll',
    clientX: e.offsetX,
    clientY: e.offsetY,
    deltaX: e.deltaX / 3,
    deltaY: e.deltaY / 3
  });
  e.stopPropagation();
  e.preventDefault();
  return false;
}

var iosKeyArr = [];
var iosKeyTimer;
function sendIosKey(e) {
  clearTimeout(iosKeyTimer);
  var key = '';
  switch (e.keyCode) {
    case 8:
      key = '';
      break;
    case 13:
      key = '\n';
      break;
    default:
      key = event.key;
  }
  iosKeyArr.push(key);
  iosKeyTimer = setTimeout(function() {
    var needSendKeys = iosKeyArr;
    iosKeyArr = [];
    if (!inputWebSocket || !iosBaseUrl) {
      return;
    }
    inputWebSocket.send(
      JSON.stringify({
        eventType: 'action',
        events: {
          actionName: 'keys',
          value: needSendKeys.join(''),
        },
      })
    )
  }, 400);
}

$(window).keypress(function(e) {
  if (!c || !c.focused) return;
  if (iosMode) {
    sendIosKey(e);
    return;
  }
  var t = String.fromCharCode(e.keyCode);
  if (!t.length) return;
  sendEvent({
    type: 'keychar',
    keychar: t
  });
});

$(window).keydown(function(e) {
  if (!c || !c.focused) return;
  if (iosMode) {
    event.keyCode === 8 && sendIosKey(e);
    return;
  }
  if (e.keyCode == 36) {
    sendEvent({
      type: 'home'
    });
  } else if (e.keyCode == 27) {
    sendEvent({
      type: 'back'
    });
  } else if (e.keyCode == 112) {
    sendEvent({
      type: 'menu'
    });
  } else if (e.keyCode == 113) {
    S();
    return;
  } else if (e.keyCode == 8) {
    sendEvent({
      type: 'backspace'
    });
  } else if (e.keyCode == 38) {
    sendEvent({
      type: 'up'
    });
  } else if (e.keyCode == 40) {
    sendEvent({
      type: 'down'
    });
  } else if (e.keyCode == 37) {
    sendEvent({
      type: 'left'
    });
  } else if (e.keyCode == 39) {
    sendEvent({
      type: 'right'
    });
  } else if (e.keyCode == 46) {
    sendEvent({
      type: 'delete'
    });
  } else if (e.keyCode == 13) {
    //keycode(66);
	sendEvent({
      type: 'enter'
    });
  } else {
    return;
  }
  e.stopPropagation();
});

function startDisplay(b) {
  stop();
  minicap = b;
  isH264 = !b;
  initDoms(minicap, attemptConnection);
  // setTimeout(function () {
  //     attemptConnection();
  // }, 100);
}

// $("#power").click(function () {
//     keycode(26)
// });

//拦截原始 fetch 方法
// var oldFetchfn = window.fetch;
// //添加自定义超时处理
// function fetch(input, opts) {
//     const fetchPromise = oldFetchfn(input);
//     const timeoutPromise = new Promise(function (resolve, reject) {
//         window.setTimeout(function () {
//             reject(new Error("fetch timeout"));
//         }, opts.timeout);
//     });
//     return Promise.race([fetchPromise, timeoutPromise]);
// }
//
// window.fetch = fetch;

// $('.screen canvas').on('click',function (e) {
//     console.log(e.which)
// })
// })();
//
function getUrlParam(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)'); //构造一个含有目标参数的正则表达式对象
  var r = window.location.search.substr(1).match(reg); //匹配目标参数
  if (r != null) return unescape(r[2]);
  return null; //返回参数值
}
