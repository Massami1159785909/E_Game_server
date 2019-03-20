var base64transformer = require('./data_operate/base64_transorm');
var io = require('socket.io-client');
var socket = io('ws://127.0.0.1:8078');
socket.on('login_state', (data)=>{
    console.log(data['loginstate']);
    //socket.emit('create_group', { game_id: 0 });
    socket.emit('join_group', { group_id: '0-1' });
    //socket.emit('quit_group', { group_id: '0-0' });
    //socket.emit('purchase', { game_id: 1 });
});
socket.on('regist_state', (data)=>{
    console.log(data['registstate']);
});
socket.on('game_receive', (data)=>{
    console.log(data);
});
socket.on('purchase_state', (data)=>{
    console.log(data);
});
socket.on('pict_get', (data)=>{
    console.log(data);
});
socket.on('ad_get', (data)=>{
    var i = 0;
    for(i = 0;i < data['ads'].length;i++){
        base64transformer.Base64ToFile(data['ads'][i]['adpict'], './test.jpg');
    }
    
    //console.log(data);
});

socket.on('state', (data)=>{
    console.log(data['state']);
});

socket.on('create_state', (data)=>{
    console.log(data['create_state']);
    socket.emit('join_group', {game_id: '0-0'});
});
socket.on('join_state', (data)=>{
    console.log(data['join_state']);
    socket.emit('quit_group', { group_id: '0-0' });
});
socket.on('delete_state', (data)=>{
    console.log(data['delete_state']);
});
socket.on('quit_state', (data)=>{
    console.log(data['quit_state']);
});
socket.on('group_get', (data)=>{
    var i;
    for(i = 0;i < data['group_count'];i++){
        console.log(data['groups'][i]['owner']);
    }
});

//socket.emit('require_ad');

//socket.emit('regist', { phone: '111', password: '12xXX@@@1113456' });
//socket.emit('game_require', { times:1 });
//socket.emit('login', { account:'846089495@qq.com', password:'123456' });
//socket.emit('login', { account:'1111', password:'852@@qqQQ111158' });
//socket.emit('groups_require', { game_id: 0 });
//socket.emit('login', { account: '1159785909', password: '654321' });
socket.emit('groups_require', { game_id: 0 });