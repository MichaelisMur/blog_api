const   cors        = require("cors"),
        fs          = require("fs"),
        moment      = require("moment"),
        path        = require('path'),
        request     = require("request"),
        express     = require("express"),
        mongoose    = require("mongoose"),
        bodyParser  = require("body-parser"),
        random      = require("randomstring"),
        fileUpload  = require("express-fileupload");

const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const app = express();
const config = require("./root/config.json");

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use("/public", express.static(path.join(__dirname, 'public')));

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));

app.use(fileUpload());

mongoose.set("useFindAndModify", false);
const User = require("./models/User.js");
const Post = require("./models/Post.js");
mongoose.connect(config.db || "mongodb://localhost/shineon", {useNewUrlParser: true});


app.get("/public/img/:id", (req, res)=>{
    res.send()
})

app.post("/stat", (req, res)=>{
    User.find({}, (err, data)=>{
        let temp = []
        data.forEach((el, ind)=>{
            temp.push({
                username: el.username,
                vip: el.vip
            })
            if(data.length == ind + 1) res.send(JSON.stringify(temp))
        })
    })
})
app.post("/changeRights", (req, res)=>{
    User.findOneAndUpdate({username: req.body.username}, {
            vip: req.body.vip==1 ? 0 : 1
        }, 
        (err, data)=>{
            User.findById(data._id, (err, data)=>{
                res.send({vip: data.vip})
            })
    })
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
            id: data._id,
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
                        id: data._id,
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

app.post("/new", TokenCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
        if(!data.admin) return res.send(JSON.stringify({error: "no admin"}))
        Post.findByIdAndUpdate(req.body.id, {
            hiddenColor: req.body.hiddenColor,
            hiddenColorOpacity: req.body.hiddenColorOpacity,
            hiddenText: req.body.hiddenText,
            hiddenTextSize: req.body.hiddenTextSize,
            hiddenTextColor: req.body.hiddenTextColor,
            header: moment().format('MMMM Do YYYY, h:mm a'),
            authCode: req.body.authCode,
            unauthCode: req.body.unauthCode,
            show: true
        }, (err, data)=>{
            console.log(data);
            res.send(JSON.stringify({
                id: data._id,
                img: data.img
            }))
        })
    })
})

app.post("/upload", TokenCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
        if(!data.admin) return res.send(JSON.stringify({error: "no admin"}))
        Post.create({
            hiddenColor: "",
            hiddenColorOpacity: "",
            hiddenText: "",
            hiddenTextSize: "",
            hiddenTextColor: "",
            header: moment().format('MMMM Do YYYY, h:mm a'),
            comments: [],
            authCode: "",
            unauthCode: "",
            img: random.generate({length: 60, capitalization: "lowercase"}),
            show: false
        }, (err, data)=>{

            fs.writeFile(`public/source/${data._id}_${data.img}.jpg`, req.files.file.data, async (err)=>{
                    const files = await imagemin([`./public/source/${data._id}_${data.img}.jpg`], {
                        destination: `./public/min`,
                        plugins: [
                            imageminMozjpeg({quality: 50}),
                            imageminPngquant({
                                quality: [0.3, 0.5]
                            })
                        ]
                    });
                    console.log(files)
                    
                    res.send(JSON.stringify({
                        id: data._id,
                        img: data.img
                    }))
            });
            
        })
    })
})

app.post("/uploadAudio", TokenCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
        if(!data.admin) return res.send(JSON.stringify({error: "no admin"}))
        // User.findOne({username: req.body.username}, (err, data)=>{
        Post.findByIdAndUpdate(req.body.id, {
            audio: req.body.name
        }, (err, data)=>{
            fs.writeFile(`public/audio/${req.body.name}.mp3`, req.files.file.data, (err)=>{
                res.send(JSON.stringify({
                    uploaded: true,
                }))
            });
        })
        // })
    })
})

app.post("/get", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA");
                    return res.send(JSON.stringify({
                        error: "access token expired"
                    }))
                } else {

                }
                Post.find({}, (err, result)=>{
                    let vip = data.vip;
                    let NUDES = postObject(1, vip, result);
                    NUDES = NUDES.slice(req.body.index, req.body.index+req.body.toShow);
                    return res.send(JSON.stringify(NUDES));
                }).sort({date: -1})
            } else {
                return res.send("wrong token");
            }
        })
    } else {
        Post.find({}, (err, result)=>{
            let NUDES = postObject(0, 0, result);
            NUDES = NUDES.slice(req.body.index, req.body.index+req.body.toShow);
            return res.send(JSON.stringify(NUDES));
        }).sort({date: -1})
    }
    
})

app.post("/comment", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, userData)=>{
            if(req.body.access_token == userData.access_token){
                if(userData.access_expire<new Date()){
                    console.log("OPA")
                    return res.send(JSON.stringify({
                        error: "access token expired"
                    }))
                }
                //=========
                Post.findById(req.body.post_id, (err, result)=>{
                    result.comments.push({
                        username: req.body.username,
                        comment: req.body.comtext,
                        date: Date.now()
                    });
                    result.save((err)=>{
                        let commentsArray = [];
                        for(let i = 0; i<result.comments.length; i++){
                            if(result.comments[i].available){
                                commentsArray.push(result.comments[i])
                            }
                        }
                        res.send(commentsArray)
                    })
                })
                //=========
            } else {
                return res.send(JSON.stringify({
                    error: "wrong token"
                }));
            }
        })
    } else {
        Post.find({}, (err, result)=>{
            let NUDES = postObject(0, 0, result);
            return res.send(JSON.stringify(NUDES));
        })
    }
    
})

app.post("/deletecomment", TokenCheck, (req, res)=>{
    Post.findById(req.body.post_id, (err, post)=>{
        let comment = post.comments.id(req.body.id);
        let restore_expire = new Date();
        restore_expire.setSeconds(restore_expire.getSeconds() + 300);
        comment.available = false;
        comment.restore_expire = restore_expire;
        post.save(()=>{
            res.send({
                deleted: true
            })
        })
    })
})

app.post("/restorecomment", TokenCheck, (req, res)=>{
    Post.findById(req.body.post_id, (err, post)=>{
        let comment = post.comments.id(req.body.id);
        if(!comment.available && comment.restore_expire){
            if(comment.restore_expire>Date.now()){
                comment.available = true;
                post.save(()=>{
                    res.send({
                        deleted: false
                    })
                })
            } else {
                res.send({error: "the time has come"})
            }
        } else {
            res.send({error: "comment was not deleted"})
        }
    })
})

app.post("/webm", TokenCheck, (req, res)=>{
    fs.readdir("./webm", (err, data)=>{
        let name = data[Math.floor(Math.random()*data.length)]
        let ext = name.split(".")[name.split(".").length-1]
        let newName = `${random.generate(10)}.${ext}`
        fs.copyFile(`./webm/${name}`, `./public/webm/${newName}`, (err) => {
            if (err) throw err;
            res.send({
                link: `http://localhost:3001/public/webm/${newName}`,
                name: name
            })
        })
    })
})

function TokenCheck(req, res, next){
    User.findOne({
        username: req.body.username
    }, (err, userData)=>{
        if(req.body.access_token == userData.access_token){
            if(userData.access_expire<new Date()){
                console.log("OPA")
                return res.send(JSON.stringify({
                    error: "access token expired"
                }))
            } else {
                next()
            }
        } else {
            return res.send(JSON.stringify({
                error: "wrong token"
            }))
        }
    })
}

const postObject = (auth, vip, array) => {
    let shit = auth ? 200 : 300;
    let list = [];
    array.forEach(el=>{
        if(el.show){
            let authCode = auth ? el.authCode : el.unauthCode;
            let fuck = vip ? 0 : authCode;
            let final = codeObject(shit + fuck, el);
            list.push(final);
        }
    })
    return(list)
}

const codeObject = (code, obj) => {
    let temp = {}
    if(code == 200){
        let commentsArray = [];
        for(let i = 0; i<obj.comments.length; i++){
            if(obj.comments[i].available){
                commentsArray.push(obj.comments[i])
            }
        }
        temp = {
            code,
            id: obj._id,
            comments: commentsArray,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize,
            audio: obj.audio
        };
        return(temp);
    } else if(code == 201){
        temp = {
            code,
            id: obj._id,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
        return(temp);
    } else if(code==202){
        temp = {
            code,
            id: obj._id,
            header: obj.header,
            img: obj.img,
        };
        return(temp);
    } else if(code==203){
        temp = {
            code,
            id: obj._id,
            header: obj.header
        };
        return(temp);
    } else if(code==300){
        let commentsArray = [];
        for(let i = 0; i<obj.comments.length; i++){
            if(obj.comments[i].available){
                commentsArray.push(obj.comments[i])
            }
        }
        temp = {
            code,
            id: obj._id,
            comments: commentsArray,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
        return(temp);
    } else if(code == 301){
        temp = {
            code,
            id: obj._id,
            header: obj.header,
            img: obj.img,
            hiddenColor: obj.hiddenColor,
            hiddenColorOpacity: obj.hiddenColorOpacity,
            hiddenText: obj.hiddenText,
            hiddenTextColor: obj.hiddenTextColor,
            hiddenTextSize: obj.hiddenTextSize
        };
        return(temp);
    } else if(code==302){
        temp = {
            code,
            id: obj._id,
            header: obj.header,
            img: obj.img,
        };
        return(temp);
    } else if(code==303){
        temp = {
            code,
            id: obj._id,
            header: obj.header
        };
        return(temp);
    }
}

app.listen(3001);