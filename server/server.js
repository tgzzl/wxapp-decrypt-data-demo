var http = require("http");
var https = require('https');
var url = require("url");
var querystring = require('querystring');
var WXBizDataCrypt = require('./WXBizDataCrypt');
var appId = '请替换成您的appId';
var secret = '请替换成您的secret';

function start(route) {
  function onRequest(request, response) {
    var _url = url.parse(request.url,true);
    var pathname = _url.pathname;
    console.log("Request for " + pathname + " received.");

    route(pathname);

    response.writeHead(200, {"Content-Type": "application/json"});
    if('/index' == pathname){
        var params = _url.query;
        if(params && params.encryptedData){
          var data = decryptData(params.code.replace(/\s+/g,'+'), 
            params.encryptedData.replace(/\s+/g,'+'), params.iv.replace(/\s+/g,'+'));
          response.write(data);
        }
    }else{
        response.write(JSON.stringify(_url));
    }
    response.end();
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

function decryptData(code,encryptedData,iv) {
  var data = ''

  var url = 'https://api.weixin.qq.com/sns/jscode2session?grant_type=authorization_code&appid='
  +appId+'&secret='+secret+'&js_code='+code;
  https.get(url, (res) => {
        var body = '';
        res.on('data', (d) => { body += d })
           .on('end', () => { 
               body = JSON.parse(body);
               var pc = new WXBizDataCrypt(appId, body.session_key.replace(/\s+/g,'+'))
               data = pc.decryptData(encryptedData, iv)
               console.log('解密后:', JSON.stringify(body), data)
            });
    });

  return data;
}

exports.start = start;