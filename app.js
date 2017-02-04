//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function (res) {
          var code = res.code;
          wx.getUserInfo({
            success: function (res) {
              wx.request({
                url: 'http://localhost:8888/index?code='+code+'&encryptedData='+res.encryptedData+'&iv='+res.iv,
                success: function (decryptData) {
                  console.log('decryptData',JSON.stringify(res), JSON.stringify(decryptData));
                }
              });
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData:{
    userInfo:null
  }
})