// pages/list/list.js
import IMOperator from "./im-operator";
import UI from "./ui";
import MsgManager from "./msg-manager";

/**
 * 聊天页面
 */
Page({

    /**
     * 页面的初始数据
     */
    data: {
        textMessage: '',
        chatItems: [],
        latestPlayVoicePath: '',
        chatStatue: 'open',
        extraArr: [{
            picName: 'choose_picture',
            description: '照片'
        }, {
            picName: 'take_photos',
            description: '拍摄'
        }, {
            picName: 'close_chat',
            description: '自定义功能'
        }],
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

        const friend = JSON.parse(options.friend);
        console.log(friend);
        this.initData();
        wx.setNavigationBarTitle({
            title: friend.friendName || ''
        });
        this.imOperator = new IMOperator(this, friend);
        this.UI = new UI(this);
        this.msgManager = new MsgManager(this);

        this.imOperator.onSimulateReceiveMsg((msg) => {
            this.msgManager.showMsg({msg})
        });
        this.UI.updateChatStatus('正在聊天中...');
    },
    onReady() {
        this.chatInput = this.selectComponent('#chatInput');
    },
    initData() {
        let that = this;
        let systemInfo = wx.getSystemInfoSync();

        that.setData({
            pageHeight: systemInfo.windowHeight,
        });
        wx.setNavigationBarTitle({
            title: '好友'
        });
    },
    onSendMessageEvent(e) {
        console.log('发送的消息',e);
        let content = e.detail.value;
        this.msgManager.sendMsg({type: IMOperator.TextType, content});
    },
    voiceButton() {
        chatInput.recordVoiceListener((res, duration) => {
            let tempFilePath = res.tempFilePath;
            this.msgManager.sendMsg({type: IMOperator.VoiceType, content: tempFilePath, duration});
        });
        chatInput.setVoiceRecordStatusListener((status) => {
            this.msgManager.stopAllVoice();
        })
    },

    //模拟上传文件，注意这里的cbOk回调函数传入的参数应该是上传文件成功时返回的文件url，这里因为模拟，我直接用的savedFilePath
    simulateUploadFile({savedFilePath, duration, itemIndex, success, fail}) {
        setTimeout(() => {
            let urlFromServerWhenUploadSuccess = savedFilePath;
            success && success(urlFromServerWhenUploadSuccess);
        }, 1000);
    },
    onExtraItemClickEvent(e) {
        console.warn(e);
        let chooseIndex = parseInt(e.detail.index);
        if (chooseIndex === 2) {
            this.myFun();
            return;
        }
        wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['compressed'],
            sourceType: chooseIndex === 0 ? ['album'] : ['camera'],
            success: (res) => {
                this.msgManager.sendMsg({type: IMOperator.ImageType, content: res.tempFilePaths[0]})
            }
        });
    },
    /**
     * 自定义事件
     */
    myFun() {
        wx.showModal({
            title: '小贴士',
            content: '演示更新会话状态',
            confirmText: '确认',
            showCancel: true,
            success: (res) => {
                if (res.confirm) {
                    this.msgManager.sendMsg({type: IMOperator.CustomType})
                }
            }
        })
    },

    resetInputStatus() {
        this.chatInput.closeExtraView();
    },

    sendMsg({content, itemIndex, success}) {
        this.imOperator.onSimulateSendMsg({
            content,
            success: (msg) => {
                this.UI.updateViewWhenSendSuccess(msg, itemIndex);
                success && success(msg);
            },
            fail: () => {
                this.UI.updateViewWhenSendFailed(itemIndex);
            }
        })
    },
    /**
     * 重发消息
     * @param e
     */
    resendMsgEvent(e) {
        const itemIndex = parseInt(e.currentTarget.dataset.resendIndex);
        const item = this.data.chatItems[itemIndex];
        this.UI.updateDataWhenStartSending(item, false, false);
        this.msgManager.resend({...item, itemIndex});
    },
});
