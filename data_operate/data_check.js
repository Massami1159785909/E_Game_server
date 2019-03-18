function checkIdPassEmailPhone(data){
    var password = data['password'];
    var E_mail = data['e_mail'];
    var Phone = data['phone'];
    var Id = data['user_id'];

    if(!checkPass(password)){
        return "请输入符合格式的密码";
    }
    else if(!checkEmail(E_mail)){
        return "请输入正确的电子邮箱";
    }
    else if(!checkPhone(Phone)){
        return "请输入正确的手机号码";
    }
    else if(!checkId(Id)){
        return "请输入正确的账号";
    }

    return "ok";
}

function checkPass(password){
    if(password.length < 12){
        return false;
    }
    var i = 0;
    var a = {};
    for(i = 0;i < password.length;i++){
        if(password[i] <= 'Z' && password[i] >= 'A'){
            a['A'] = 1;
        }else if(password[i] <= 'z' && password[i] >= 'a'){
            a['a'] = 1;
        }else if(password[i] <= '9' && password[i] >= '0'){
            a['1'] = 1;
        }else{
            a[','] = 1;
        }
    }
    if(a['A'] == 1 && a['a'] == 1 && a['1'] == 1 && a[','] == 1){
        return true;
    }
    return false;
}

function checkEmail(E_mail){
    return (E_mail == undefined || E_mail.match('[A-Za-z0-9]*@[A-Za-z0-9]*[\.]com') == E_mail);
}

function checkPhone(Phone){
    return (Phone == undefined || Phone.length == 11);
}

function checkId(Id){
    if(Id == undefined){
        return true;
    }
    var i;
    for(i = 0;i < Id.length;i++){
        if(!((Id[i] >= 0 && Id[i] <= 9) || (Id[i] >= 'a' && Id[i] <= 'z') || (Id[i] >= 'A' && Id[i] <= 'Z'))){
            return false;
        }
    }
    return true;
}

module.exports = {checkIdPassEmailPhone, checkEmail, checkPass, checkPhone, checkId};