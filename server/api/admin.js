var model = require('../models/models').models;
var util = require('../utils');
var stringGenerator = require('randomstring');
var auth = require("../auth");

const certificateConfigure = {length:50};
//restful格式{code, data, msg}, code 为0表示成功，非0表示失败
/**
 * get方法
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function getGroupInfo(req, res){
    req.body = req.query;
    var group = await model.operatorGroup.findById(req.user.operatorGroupId);
    //根据dataType确定返回的数据类型
    if(!util.bodyContains(req, 'dataType')){
        //返回该管理员下面的全部客服的id和名称
        var operatorList = await model.operator.find(
            {operatorGroupId:group.id});
        var result = [];
        operatorList.forEach(element => {
            result.push({id:element.id, name:element.name});
        });
        res.json(result);
    }
    else{
        //返回该客服组下所有类型为DataType数据
        var list = [];
        group.serviceData.forEach(val => {
            list.push(val[req.body.dataType]);
        });
        var result = util.wrapArrayData(group.serviceRecordStart, list);
        res.json(result);
    }
}

async function getOperatorInfo(req, res){
    req.body = req.query;
    if(!util.bodyContains(req, 'id')){
        res.json({success:false});
        return;
    }
    var operator = await model.operator.findById(req.body.id);
    //防止管理员获取不是自己组下的客服的信息
    if(!operator || operator.operatorGroupId.toString() != req.user.operatorGroupId.toString()){
        res.json({success:false, err:"operator not found"});
        return;
    }
    if(req.body.dataType){
        //返回该客服的类为dataType的数据类型
        var list = [];
        operator.serviceData.forEach(val => {
            list.push(val[req.body.dataType]);
        });
        var result = util.wrapArrayData(operator.serviceRecordStart, list);
        res.json(result);
    }
}
/**
 * post方法
 * 前端传入邮箱，后端自动生成随机的验证码并发送邮件，如果发送成功则
 * 在缓存中保存该验证码和邮箱同时向前端返回success为true,否则false
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function getCertificate(req, res){
    if(!util.bodyContains(req,'email')){
        res.json({success:false, err:"parameter email loss"});
        return;
    }
    var admin = await model.admin.findOne({email:req.body.email});
    if(admin){
        res.json({success:false, err:"邮箱重复!"});
        return;
    }
    var certificate = stringGenerator.generate(certificateConfigure);
    try {
        await util.mailTransporter.sendMail({
            to:req.body.email,
            subject: "小天秤在线客服管理员注册",
            text: certificate
        });
    }
    catch(err){
        res.json({success:false});
        return;
    }
    //寄件成功，将验证码和邮箱保存在缓存中
    await util.cache.setAsync(`certificate:${certificate}`, req.body.email);
    res.json({success:true});
}
/**
 * post方法
 * 前端传入一个验证码，后端检查验证码是否存在，如果存在则在会话信息中保留email作为
 * 已经输入验证码的凭证
 * 读出验证码之后应该立刻清除
 * 注意一个客服组是在这里被第一次创建的存
 * @param {*} req 
 * @param {Express.Response} res 
 */
async function certificate(req, res){
    if(!util.bodyContains(req, "certificate")){
        res.json({success:false});
        return;
    }
    var key = `certificate:${req.body.certificate}`;
    var email = await util.cache.getAsync(key);
    if(!email){
        res.json({success:false, err:"invalid certificate"});
        return;
    }
    //删除cache中的验证码
    await util.cache.delAsync(key);
    //保存会话信息
    req.session.email = email;
    req.session.save();
    res.json({success:true});
}
/**
 * post方法
 * 前端传入创建管理员和客服组所需要的信息
 * name, pass, companyName,
 * 后端检查是否已经输入验证码,如果已经输入，
 * 则创建客服和客服组
 * 注意由于email已经被保存在后端所以该数据不是必须的
 * @param {*} req 
 * @param {*} res 
 */
const path = require('path');
const config = require('../serverConfig.json');
async function createAdmin(req, res){
    if(!util.bodyContains(req , "name", "pass", "companyName") || !req.session.email){
        res.json({success:false});
        return;
    }
    //管理员账号重名检查
    var admin = await model.admin.findOne({name:req.body.name});
    if(admin){
        res.json({success:false, err:"admin already exists"});
        return;
    }
    var opGroup = new model.operatorGroup({
        name:req.body.companyName,
        specialRobotAnswer:{greet:`你好我是${req.body.companyName}智能机器人`,
        unknown:`不好意思这触及到了我的知识盲区，您可以选择人工客服呦~`},
        robotPortrait:config.static.portrait.robot,
        serviceRecordStart:Date.now(),
    });
    await opGroup.save();
    //使用bcryptjs对密码进行加密存储
    admin = new model.admin({
        name:req.body.name,
        pass:auth.Hash(req.body.pass),
        email:req.session.email,
        operatorGroupId: opGroup.id,
        portrait:path.join(config.static.portrait.admin, "default.jpg")
    });
    await admin.save();
    //取消认证状态
    req.session.email = null;
    req.session.save();
    res.json({success:true});
}
/**
 * post方法
 * 传入参数为{count:},返回包含生成验证码个数的json数组
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
const MAX_CERTIFICATE_COUNT = 50;
async function getOperatorCertificate(req, res){
    if(!util.bodyContains(req, "count") || !Number.isInteger(req.body.count)){
        res.json({success:false});
        return;
    }
    var cerGened = await util.cache.getAsync(`${util.PREFIX_CERTIFICATE_COUNT}:${req.user.id}`);
    cerGened = cerGened || 0;
    cerGened = Number(cerGened);
    if(cerGened + req.body.count > MAX_CERTIFICATE_COUNT){
        res.json({success:false,
            err:"too much certificate generated currently"});
        return;
    }
    //修改当日生成的验证码个数
    req.body.count = Number(req.body.count);
    await util.cache.incrbyAsync(`${util.PREFIX_CERTIFICATE_COUNT}:${req.user.id}`, req.body.count);
    var cerList = [];
    //生成验证码，每个验证码中保留了OperatorGroup的Id,同时为验证码设置ttl,暂定为1天
    for(var i = 0; i < req.body.count; ++i){
        var cerTmp = stringGenerator.generate(certificateConfigure);
        var key = `${util.PREFIX_OPERATOR_CERTIFICATE}:${cerTmp}`;
        await util.cache.hsetAsync(key, "opGroup", req.user.operatorGroupId);
        await util.cache.expireAsync(key, 86400);
        cerList.push(cerTmp);
    }
    
    res.json({success:true, certificates:cerList});
}
/**
 * post方法,临时的设置用户接入时判断客服组的token用api
 * 传入参数为{token}
 * 设置成功返回{success:true}
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function setSocketToken(req, res){
    if(!util.bodyContains(req, "token")){
        res.json({success:false});
        return;
    }
    //在operatorGroup中记录相应的键值
    var opGroup = await model.operatorGroup.findById(req.user.operatorGroupId);
    var oldToken = opGroup.companySocketToken;
    opGroup.companySocketToken = req.body.token;
    if(oldToken){
        await util.cache.delAsync(`${util.PREFIX_SOCKET_CLIENT}:${oldToken}`);
    }
    //检查该键是否已经被使用
    var key = `${util.PREFIX_SOCKET_CLIENT}:${req.body.token}`;
    var val = await util.cache.getAsync(key);
    if(val){
        res.json({success:false, err:'duplicated token'});
        return;
    }
    await util.cache.setAsync(`${util.PREFIX_SOCKET_CLIENT}:${req.body.token}`, opGroup.id);
    //保存新的token
    await opGroup.save();
    res.json({success:true});
}
/**
 * get方法，返回该客服组下所有的留言
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function getMsgList(req, res){
    var msgList = await model.message.find({operatorGroupId:req.user.operatorGroupId});
    var result = [];
    for(var i = 0; i < msgList.length; ++i){
        var val = msgList[i];
        var tmp = util.doc2Object(val);
        tmp.id = val.id;
        var operator = await model.operator.findById(val.answerOperatorId);
        operator = operator || {};
        tmp.operatorName = operator.name;
        result.push(tmp);
    }
   res.json(result);
}
/**
 * get方法，返回该客服组下所有的聊天记录，附带所有客服id对应表项中的姓名
 * @param {*} req 
 * @param {*} res 
 */
async function getChatList(req, res){
    var chatList = await model.chatLog.find({operatorGroupId:req.user.operatorGroupId});
    var result = [];
    for(let i = 0; i < chatList.length; ++i){
        var tmp = util.doc2Object(chatList[i]);
        delete tmp.contents;
        tmp.id = chatList[i].id;
        tmp.operatorName = await model.operator.findById(tmp.operatorId).name;
        if(tmp.crossed){
            tmp.crosserName = await model.operator.findById(tmp.crosserId);
        }
        result.push(tmp);
    }
    res.json(result);
}
/**
 * get方法，参数类型{id}
 * @param {*} req 
 * @param {*} res 
 */
async function getChatLog(req, res){
    req.body = req.query;
    if(!util.bodyContains(req, 'id')){
        res.json({success:false});
        return;
    }
    var chatLog = await model.chatLog.findById(req.body.id);
    var opGroup1 = String(chatLog.operatorGroupId), opGroup2 = String(req.user.operatorGroupId);
    if(!chatLog || opGroup1 !== opGroup2){
        res.json({success:false});
        return;
    }
    res.json(chatLog.contents);
}
async function getStateList(req, res){
    var operatorList = await model.operator.find({operatorGroupId:req.user.operatorGroupId});
    var result = [];
    for(var i = 0; i < operatorList.length; ++i){
        var state = await util.cache.getAsync(`${util.PREFIX_OPERATOR_STATUS}:${operatorList[i].id}`);
        var tmp = {};
        tmp.id = operatorList[i].id;
        tmp.state = state ? state : 'left';
        result.push(tmp);
    }
    res.json(result);
}
async function getAdminReply(req, res) {
    var group = await model.operatorGroup.findById(req.user.operatorGroupId);
    var result = [];
    if(group.quickReply){
        group.quickReply.forEach(val => {
            result.push({text:val});
        });
    }
    res.json({success:true, data:result});
}

async function updateReply(req, res){
    if(!util.bodyContains(req, 'data')){
        res.json({success:false});
    }
    var group = await model.operatorGroup.findById(req.user.operatorGroupId);
    var replys = [];
    req.body.data.forEach(val => {
        replys.push(val.text);
    });
    group.quickReply = replys;
    await group.save();
    res.json({success:true});
}

async function getSocketToken(req, res){
    var opGroup = await model.operatorGroup.findById(req.user.operatorGroupId);
    res.json({success: true, token:opGroup.companySocketToken});
}
/**
 * 在每天结束时将cache中管理员已经生成的验证码的数量置为0
 */
async function clearCertificate(){
    var cerCounts = await util.cache.keysAsync(`${util.PREFIX_CERTIFICATE_COUNT}:*`);
    if(cerCounts.length){
        await util.cache.delAsync(cerCounts);
    }
}

module.exports.clearCertificateCount = clearCertificate;

module.exports.apiInterfaces = [
    {url:'/api/admin/group_info*', callBack:getGroupInfo, auth:true, type:'admin'},
    {url:'/api/admin/operator_info*', callBack:getOperatorInfo, auth:true, type:'admin'},
    {url:'/api/admin/operator_state_list*',callBack:getStateList, auth:true, type:'admin'},
    {url:'/api/admin/signup/get_certificate*', callBack:getCertificate, type:'admin', method:'post'},
    {url:'/api/admin/signup/certificate', callBack:certificate, method:'post', type:'admin'},
    {url:'/api/admin/signup/create_admin', callBack:createAdmin, method:'post', type:'admin'},
    {url:'/api/admin/get_signup_certificate', callBack:getOperatorCertificate, method:'post',auth:true, type:'admin'},
    {url:'/api/admin/set_socket_token', callBack:setSocketToken, method:'post', auth:true, type:'admin'},
    {url:'/api/admin/get_socket_token*', callBack:getSocketToken,auth:true, type:'admin'},
    {url:'/api/admin/message_lst*', callBack:getMsgList, auth:true, type:'admin'},
    {url:'/api/admin/get_chat_list*',callBack:getChatList, auth:true, type:'admin'},
    {url:'/api/admin/get_chat_log*',callBack:getChatLog, auth:true, type:'admin'},
    {url:'/api/common/settings/adminReply', callBack:getAdminReply, auth:true,type:'admin'},
    {url:'/api/common/settings/renewReply', callBack:updateReply, auth:true, type:'admin', method:'post'},
];