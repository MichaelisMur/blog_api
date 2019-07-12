const   express     = require('express'),
        mongoose    = require("mongoose"),
        bodyParser  = require("body-parser"),
        random      = require("randomstring");

const app = express();
const config = require("./root/config.json");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


mongoose.set("useFindAndModify", false);
const User = require("./models/User.js");
const Post = require("./models/Post.js");
mongoose.connect('mongodb://localhost/shineon', {useNewUrlParser: true});




app.get("/", (req, res)=>{
    User.create({
        username: random.generate(7),
        password: random.generate(20),
        access_token: random.generate(20),
        refresh_token: random.generate(20)
    }, (err, data)=>{
        console.log(data);
    })
    res.send("Hey, you!");
})
app.post("/register", (req, res)=>{
    let access_token = "4ist0_r0fl/\\n4ik" + random.generate(30);
    let refresh_token = "mamkuebal" + random.generate(30);
    let access_expire = new Date();
    access_expire.setSeconds(access_expire.getSeconds() + 7200);
    let refresh_expire = new Date();
    refresh_expire.setSeconds(refresh_expire.getSeconds() + 2592000);
    User.create({
        username: req.body.username,
        password: req.body.password,
        access_token,
        access_expire: access_expire,
        refresh_token,
        refresh_expire: refresh_expire,
    }, (err, data)=>{
        console.log(data);
        res.send(JSON.stringify({
            username: req.body.username,
            access_token: access_token,
            refresh_token: refresh_token
        }))
    })
})
app.post("/login", (req, res)=>{
    console.log(req.body);
    User.findOne({
        username: req.body.username
    }, (err, data)=>{
        if(data){
            if(data.password == req.body.password){
                let access_expire = new Date();
                access_expire.setSeconds(access_expire.getSeconds() + 7200);
                let refresh_expire = new Date();
                refresh_expire.setSeconds(refresh_expire.getSeconds() + 2592000);
                let access_token = "4ist0_r0fl/\\n4ik" + random.generate(30);
                let refresh_token = "mamkuebal" + random.generate(30);
                User.findByIdAndUpdate(data._id, {
                    access_token, refresh_token,
                    access_expire, refresh_expire
                }, (err, data)=>{
                    res.send(JSON.stringify({
                        access_token,
                        refresh_token,
                        username: data.username,
                        code: 200
                    }))
                })
            } else {
                res.send({
                    message: "wrong password or username"
                });
            }
        }
        else{
            res.send({
                message: "wrong password or username"
            });
        }
    })
})

app.post("/refreshtoken", (req, res)=>{
    let access_expire = new Date();
    access_expire.setSeconds(access_expire.getSeconds() + 7200);
    let refresh_expire = new Date();
    refresh_expire.setSeconds(refresh_expire.getSeconds() + 2592000);
    let access_token = "4ist0_r0fl/\\n4ik" + random.generate(30);
    let refresh_token = "mamkuebal" + random.generate(30);
    console.log("aaa");
    User.findOne(
        {
            username: req.body.username
        }, (err, data)=>{
            console.log(req.body.refresh_token);
            console.log(data.refresh_token);
            if(req.body.refresh_token == data.refresh_token){
                User.findByIdAndUpdate(data._id, {
                    access_token, refresh_token,
                    access_expire, refresh_expire
                }, (err, data)=>{
                    return res.send(JSON.stringify({
                        access_token, refresh_token
                    }))
                })
            }
        }
    )
})

app.post("/new", (req, res)=>{
    Post.create({
        img: "https://imgcomfort.com/Userfiles/Upload/images/illustration-geiranger.jpg",
        hiddenColor: "lightgray",
        hiddenColorOpacity: "0.3",
        hiddenText: req.body.hiddenText || "Just testing... Please, stand by...",
        hiddenTextSize: "20",
        hiddenTextColor: "white",
        header: "02.07.2019 23:20",
        comments: [
            {
                username: "username",
                comtext: "his or her superfunny comment"
            },
            {
                username: "creepyshithead",
                comtext: "wtf with this comment section"
            },
            {
                username: "michaelis",
                comtext: "hey now! that's beautiful))))"
            },
        ],
        authCode: req.body.authCode,
        unauthCode: req.body.unauthCode
    }, (err, data)=>{
        console.log(data);
        res.send(JSON.stringify({
            result: 200
        }))
    })
})

app.post("/get", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            // console.log(req.body.access_token);
            // console.log(data.access_token);
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA")
                    return res.send(JSON.stringify({
                        error: "access token expired"
                    }))
                } else {
                    console.log("it's ok")
                }
                Post.find({}, (err, result)=>{
                    let vip = data.vip;
                    let NUDES = postObject(1, vip, result);
                    return res.send(JSON.stringify(NUDES));
                })
            } else {
                return res.send("wrong token");
            }
        })
    } else {
        Post.find({}, (err, result)=>{
            let NUDES = postObject(0, 0, result);
            return res.send(JSON.stringify(NUDES));
        })
    }
    
})

const postObject = (auth, vip, array) => {
    let shit = auth ? 200 : 300;
    let list = [];
    array.forEach(el=>{
        let authCode = auth ? el.authCode : el.unauthCode;
        let fuck = vip ? 0 : authCode;
        let final = codeObject(shit + fuck, el.toObject());
        list.push(final);
    })
    return(list)
}
const codeObject = (code, obj) => {
    let temp = {}
    if(code == 200){
        temp = {
            code,
            comments: obj.comments,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
    } else if(code == 201){
        temp = {
            code,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
    } else if(code==202){
        temp = {
            code,
            header: obj.header,
            img: obj.img,
        };
    } else if(code==203){
        temp = {
            code,
            header: obj.header
        };
    } else if(code==300){
        temp = {
            code,
            comments: obj.comments,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
    } else if(code == 301){
        temp = {
            code,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
    } else if(code==302){
        temp = {
            code,
            header: obj.header,
            img: obj.img,
        };
    } else if(code==303){
        temp = {
            code,
            header: obj.header
        };
    }
    return(temp);
}

app.listen(3001);