//192.168.1.113
//419099
var fs = require('fs');
var path = require('path');
var io = require('socket.io')(8078);
var conn = require('./database/database_operator');
var checker = require('./data_operate/data_check');
var base64transformer = require('./data_operate/base64_transorm');
var classes = require('./data_operate/se_class');
var alipay = require('alipay-nodejs');
conn.connect();
console.log('server start');

//socket.io event
io.on('connection', (socket) => {
    console.log('client connection');

    socket.emit('ClientListener', { hello: 'world' });

    //Test
    socket.on('ServerLstener', (data, callback) => {
        console.log('ServerLstener email:' + data['email']);
        callback({ abc: 123 });
    });

    //use id and pass to register, client event:regist_state
    socket.on('regist', (data) => {
        var keys = ['user_id', 'password', 'user_name', 'sex', 'birth', 'e_mail', 'phone'];
        //1st check
        if (data[keys[0]] == null && data[keys[5]] == null && data[keys[6]] == null) {
            socket.emit('regist_state', { registstate: '账号或手机或邮箱不得为空' });
            return;
        }
        else if (data[keys[1]] == null) {
            socket.emit('regist_state', { registstate: '密码不得为空' });
            return;
        }
        //2ed check
        var check_res = checker.checkIdPassEmailPhone(data);
        if (check_res != "ok") {
            socket.emit('regist_state', { registstate: check_res });
        }
        //3th check
        else {
            //add "\' \'" and transform undefind value to be null
            var i;
            for (i = 0; i < keys.length; i++) {
                console.log(data[keys[i]]);
                if (data[keys[i]] == undefined || data[keys[i]] == "") {
                    data[keys[i]] = null;
                } else {
                    data[keys[i]] = '\'' + data[keys[i]] + '\'';
                }
            }
            query_sql = 'select * from user_account where user_id=' + data['user_id'] + ';';
            conn.query(query_sql, (err, result) => {
                if (err) {
                    console.log(err);
                }
                else if (result.length != 0) {
                    socket.emit('regist_state', { registstate: '该账号已被注册，请更换账号' });
                } else {
                    conn.query('select * from user_account where E_mail=' + data['e_mail'] + ';', (err, result) => {
                        if (err) {
                            console.log(err);
                            socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                        }
                        else if (result.length != 0) {
                            socket.emit('regist_state', { registstate: '该邮箱已被注册，请更换邮箱' });
                        } else {
                            conn.query('select * from user_account where Phone=' + data['phone'] + ';', (err, result) => {
                                if (err) {
                                    console.log(err);
                                    socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                }
                                else if (result.length != 0) {
                                    socket.emit('regist_state', { registstate: '该号码已被注册，请更换号码' });
                                } else {
                                    conn.query('select max(No) from user_account', (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                        }
                                        var no = parseInt(result[0]['max(No)']);
                                        no++;
                                        var query_sql = 'insert into user_account value (' + no + ',' + data['user_id'] + ',' + data['password'] + ',' + data['user_name'] + ',' + data['sex'] + ',' + data['birth'] + ',' + data['e_mail'] + ',' + data['phone'] + ');';
                                        conn.query(query_sql, (err) => {
                                            if (err) {
                                                socket.emit('regist_state', { registstate: '注册失败，请稍后再试' });
                                                console.log(err);
                                            }
                                            socket.emit('regist_state', { registstate: '注册成功！' });
                                        });
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    //Use id and pass to log in, client event:login_state
    socket.on('login', (data) => {
        if (data['account'] == "" && data['password'] == "") {
            socket.emit('login_state', { loginstate: 'yes' });
            return;
        }
        //use email
        if (checker.checkEmail(data['account']) == true) {
            login(data, 'E_mail', socket);
        }
        //use phone's number
        else if (checker.checkPhone(data['account']) == true) {
            login(data, 'Phone', socket);
        }
        //use user's id
        else {
            login(data, 'user_id', socket);
        }
    });
    //choose type of account and try to login
    function login(data, login_type, socket) {
        clientIP = socket.handshake.address
        //check islogin?
        query_sql = 'select * from online_account where ' + login_type + '=\'' + data['account'] + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            if (result.length != 0) {
                socket.emit('login_state', { loginstate: '该账户已登录，请勿重复登录' });
            }
            else {
                //login
                query_sql = 'select * from user_account where ' + login_type + '=\'' + data['account'] + '\' and password=\'' + data['password'] + '\';';
                conn.query(query_sql, (err, result) => {
                    if (err) {
                        console.log(err);
                        socket.emit('login_state', { loginstate: '登录失败，请稍后再试' });
                    }
                    if (result.length != 0) {
                        query_sql = 'insert into online_account value (' + result[0].No + ', \'' + result[0].user_id + '\', \'' + result[0].E_mail + '\', \'' + result[0].Phone + '\', \'' + clientIP + '\')';
                        conn.query(query_sql, (err) => {
                            if (err) {
                                console.log(err);
                                socket.emit('login_state', { loginstate: '登录失败，请稍后再试' });
                            }
                            socket.emit('login_state', { loginstate: 'yes' });
                        });
                    }
                    else {
                        socket.emit('login_state', { loginstate: '用户名密码错误' });
                    }
                });

            }
        });
    }

    //Deal with game rely require, send the game information to UI, client event:game_receive
    socket.on('game_require', (data) => {
        var times = data['times'];//times >= 1
        var sta = times * 8 - 8;
        var end = times * 8;
        var query_sql = 'select * from game_info where game_id<' + end + ' and game_id>=' + sta + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            socket.emit('game_receive', result);
        });
    });

    socket.on('trans_ad', (data) => {
        var query_sql = 'select game_id from ad_info where ad_id=' + data['ad_num'] + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
            }
            query_sql = 'select * from game_info where game_id=' + result[0]['game_id'];
            conn.query(query_sql, (err, result) => {
                if (err) {
                    console.log(err);
                }
                socket.emit('ad_trans', new classes.gameInfo(result[0]));
            });
        });

    });

    //when client is disconnected
    socket.on('disconnect', () => {
        query_sql = 'select user_id from online_account where IP_addr=\'' + socket.handshake.address + '\';';
        conn.query(query_sql, (err) => {
            if (err) {
                console.log(err);
            }
            conn.query('delete from online_account where IP_addr=\'' + socket.handshake.address + '\';', (err, result) => {
                if (err) {
                    console.log(err);
                }
                else if (result[0] != undefined) {
                    console.log('Client ' + result[0].user_id + ' is disconnected');
                } else {
                    console.log('Client xxx is disconnected');
                }
            });
        });
    });

    //deal with purchase require, send the statement to UI, client event:purchase_state
    socket.on('purchase', (data) => {
        data['game'];
        var user_addr = socket.handshake.address;
        query_sql = 'select No from online_account where IP_addr=' + '\'' + user_addr + '\'';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err)
            } else if (result == undefined) {
                socket.emit('error', { error: '你已从服务器断开，请重新登录' });
            } else {
                //get No
                No = parseInt(result[0]['No']);
                query_sql = 'insert into users_assets value (' + No + ', ' + data['game_id'] + ', \'' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + '\');';
                conn.query(query_sql, (err) => {
                    if (err) {
                        console.log(err);
                        socket.emit('purchase_state', { purchasestate: '购买失败，请稍后再试' });
                    } else {
                        socket.emit('purchase_state', { purchasestate: '购买成功！' });
                    }
                });
            }
        });
    });

    //deal with advertisement require, send the require statement or advertisements'informations to UI, client event:ad_get
    socket.on('require_ad', () => {
        query_sql = 'select * from ad_info;';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('ad_get', { requirestate: '获取内容失败，请稍后尝试刷新' });
            } else {
                var info = [];
                var i;
                for (i = 0; i < result.length; i++) {
                    info[i] = new classes.adInfo(result[i]);
                }
                socket.emit('ad_get', { adcount: info.length, ads: info });
            }
        });
    });

    socket.on('pay', (data) => {

    });

    socket.on('groups_require', (data)=>{
        game_id = data['game_id'];
        query_sql = 'select * from group_buy, user_account where game_id=\'' + game_id + '\';';
        conn.query(query_sql, (err, result)=>{
            if(err){
                console.log(err);
                socket.emit(state, { state: '拼单信息请求失败~_~' });
            }else{
                var i = 0;
                groups = [];
                for(i = 0;i < result.length;i++){
                    groups[i] = new classes.groupInfo(result[0]);
                }
                socket.emit('group_get', { group_count: groups.length, groups: groups });
            }
        });
    });

    /**
     * @param data
     * {
     *  game_id;
     * }
     */
    socket.on('create_group', (data) => {
        group_operation('create', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('join_group', (data) => {
        group_operation('join', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('quit_group', (data) => {
        group_operation('quit', data);
    });
    /**
     * @param data
     * {
     *  group_id;
     * }
     */
    socket.on('delete_group', (data) => {
        group_operation('delete', data);
    });

    function group_operation(operation, data) {
        query_sql = 'select * from online_account where IP_addr=\'' + socket.handshake.address + '\';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '登录状态异常，请稍后再试' });
            } else {
                data['No'] = result[0]['No'];
                if (operation == 'delete') {
                    del(data);
                } else {
                    ndel(operation, data);
                }
            }
        });
    }
    function del(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select * from group_buy where group_id=\'' + group_id + '\' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                socket.emit(state, { state: '查询拼团信息失败，请稍后再试' });
            } else if (result.length >= 1) {
                query_sql = 'delete from group_buy where group_id=\'' + group_id + '\';';
                conn.query(query_sql, (err) => {
                    if (err) {
                        socket.emit('state', { state: '删除拼团信息失败，请稍后再试' });
                        console.log(err);
                        console.log('请手动运行sql语句：' + query_sql);
                    } else {
                        socket.emit('state', { state: '删除拼团信息成功' });
                    }
                });
            } else {
                socket.emit('state', { state: '抱歉，您不是该拼团的团长，无权删除拼团' });
            }
        })
    }
    function ndel(operation, data) {
        if (operation == 'quit') {
            quit(data);
        } else {
            nquit(operation, data);
        }
    }
    function quit(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select * from join_group where group_id=\'' + group_id + '\' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length <= 0) {
                socket.emit('state', { state: '抱歉，您未加入该拼团，无法退出拼团' });
            } else {
                quit_opt(data);
            }
        });
    }
    function quit_opt(data){
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'delete from join_group where No=' + No + ' and group_id=\'' + group_id + '\';';
        query_sql += 'update group_buy set user_count=user_count-1 where group_id=\'' + group_id + '\';';
        query_sql += 'delete from group_buy where user_count=0;';
        conn.query(query_sql, (err, data)=>{
            if(err){
                console.log(err);
                socket.emit('state', { state: '退出拼团失败，请稍后再试' });
            }else{
                socket.emit('state', { state: '退出拼团成功！' });
            }
        });
    }
    function nquit(operation, data) {
        if (operation == 'join') {
            join(data);
        } else if (operation == 'create') {
            create(data);
        }
    }
    function create(data) {
        No = data['No'];
        game_id = data['game_id'];
        group_id = data['group_id'];

        query_sql = 'select * from join_group, group_buy where group_buy.group_id=join_group.group_id and game_id=' + game_id + ' and No=' + No + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length > 0) {
                multi_join_state();
            } else {
                group_id = game_id + '-' + No;
                query_sql = 'insert into group_buy value (\'' + group_id + '\', ' + game_id + ', ' + 0 + ');';
                conn.query(query_sql, (err) => {
                    if (err) {
                        console.log(err);
                        socket.emit('state', { state: '创建拼团失败，请稍后再试' });
                    } else {
                        socket.emit('state', { state: '创建拼团成功！' });
                        join({ group_id: group_id, No: No });
                    }
                });
            }
        });
    }
    function join(data) {
        No = data['No'];
        group_id = data['group_id'];
        query_sql = 'select game_id from group_buy where group_id=' + group_id + ';';
        conn.query(query_sql, (err, result) => {
            if (err) {
                console.log(err);
                query_fail_state();
            } else if (result.length > 0) {
                query_sql = 'select * from group_buy, join_group where group_buy.group_id=join_group.group_id and game_id=' + result[0]['game_id'] + ' and No=' + No + ';';
                conn.query(query_sql, (err, result)=>{
                    if(err){
                        console.log(err);
                        query_fail_state();
                    }else if(result.length > 0){
                        multi_join_state();
                    }else{
                        join_opt(data);
                    }
                });
            } else {
                socket.emit('state', { state: '拼团信息不存在' });
            }
        });
    }
    function join_opt(data){
        group_id = data['group_id'];
        No = data['No'];
        query_sql = 'insert into join_group value (\'' + group_id + '\', ' + No + ', \'' + new Date().toLocaleString() + '\');';
        query_sql += 'update group_buy set user_count=user_count+1 where group_id=\'' + group_id + '\';';
        conn.query(query_sql, (err) => {
            if (err) {
                console.log(err);
                socket.emit('state', { state: '加入拼团失败' });
                if (isLeader) {
                    delete_group(group_id);
                }
            } else {
                socket.emit('state', { state: '加入拼团成功' });
            }
        });
    }
    /**
     * 提示查询拼团状态失败
     */
    function query_fail_state(){
        socket.emit('state', { state: '查询拼团状态失败' });
    }
    /**
     * 提示重复创建或加入
     */
    function multi_join_state(){
        socket.emit('state', { state: '抱歉，您已经加入该游戏的拼团，请勿重复创建或加入' });
    }
});
