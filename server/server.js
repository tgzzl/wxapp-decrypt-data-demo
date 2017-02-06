var http = require("http");
var https = require('https');
var request = require('request');
var url = require("url");
var fs = require("fs");
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
          var data = decryptData(params.code, params.encryptedData, params.iv);
          response.write(data);
        }
    }else if('/createwxaqrcode' == pathname){
        createwxaqrcode();
    }else{
        response.write(JSON.stringify(_url));
    }
    response.end();
  }

  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

function decryptData(code,encryptedData,iv) {
  function decode(d){
    return d.replace(/\s+/g,'+')
  }

  var data = ''

  var url = 'https://api.weixin.qq.com/sns/jscode2session?appid='+appId+'&secret='+secret+'&js_code='+decode(code)+'&grant_type=authorization_code';
  https.get(url, (res) => {
        var body = '';
        res.on('data', (d) => { body += d })
           .on('end', () => { 
               body = JSON.parse(body);
               var sessionKey = body.session_key
               
               sessionKey = decode(sessionKey)
               encryptedData = decode(encryptedData)
               iv = decode(iv)

               var pc = new WXBizDataCrypt(appId, sessionKey)
               data = pc.decryptData(encryptedData, iv)

               console.log(JSON.stringify(body), sessionKey)
               console.log(encryptedData, iv)
               console.log(data)
            });
    });

  return data;
}

function createwxaqrcode(){
  https.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appId+'&secret='+secret, (res) => {
        var body = '';
        res.on('data', (d) => { body += d })
           .on('end', () => { 
               body = JSON.parse(body);
               console.log('token', body)
               post_createwxaqrcode(body.access_token)
               request_createwxaqrcode(body.access_token)
            });
    });

  /*  use origin https request  */
  function post_createwxaqrcode(token){
    var post_data = JSON.stringify({
      'path': 'pages/map/map'
    });
    var options = {
      host: 'api.weixin.qq.com',
      port: '443',
      path: '/cgi-bin/wxaapp/createwxaqrcode?access_token='+token,
      method: 'POST',
      headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };
    var req = https.request(options, (res) => {
      var body = '';
      res.setEncoding('binary');
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        fs.writeFile('./https_'+Date.now()+'.jpg', body, 'binary', (err) => { console.log('writeFile', err) } )
      });
    });
    req.write(post_data);
    req.end();
  }

  /*  use request module  */
  function request_createwxaqrcode(token){
    var options = {
      uri: 'https://api.weixin.qq.com/cgi-bin/wxaapp/createwxaqrcode?access_token='+token,
      method: 'POST',
      json: {'path': 'pages/map/map'},
      encoding: 'binary'
    };
    request(options, (error, res, body) => {
      if(!error && res.statusCode == 200){
        fs.writeFile('./request_'+Date.now()+'.jpg', body, 'binary', (err) => { console.log('writeFile', err) } )
      }
    });
  }
}

exports.start = start;
