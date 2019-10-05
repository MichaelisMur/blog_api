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


let config = {}

try {
    config = require("./root/config.json");
}
catch (e) {
    config = {
        db: "mongodb://localhost/michaelis"
    }
}


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
const Spy = require("./models/Spy.js");
const News = require("./models/News.js");
const Pass = require("./models/Pass.js");
mongoose.connect(config.db, {useNewUrlParser: true});


//==================The Golden Shield==================
app.use((req, res, next)=>{
    console.log(req.originalUrl)
    Spy.findOne({ip: req.ip}, (err, data)=>{
        let important = ["/login", "/register", "/deletecomment", "/fullsized"]
        let isImportant = false
        if(important.indexOf(req.originalUrl)!=-1) isImportant = true

        if(!data){
            let action = isImportant ? {
                ammount: 1,
                usernames: [req.body.username||""],
                importantActions: {
                    url: req.originalUrl,
                    requestBody: req.body,
                    date: Date.now()
                }
            } : {
                ammount: 1,
                usernames: [req.body.username||""]
            }
            Spy.create({
                ip: req.ip,
                action
            }, (err, data)=>{
                return next()
            })
        } else {
            let expire = new Date()
            expire.setSeconds(expire.getSeconds() - 1000);
            if(data.action[data.action.length-1].date<expire){
                data.action.push({
                    ammount: 1,
                    importantActions: isImportant ? [{
                        url: req.originalUrl,
                        requestBody: req.body,
                        date: Date.now()
                    }] : []
                })

                data.save(err => {
                    return next()
                })
            } else {
                data.action[data.action.length-1].ammount += 1;
                if(isImportant) data.action[data.action.length-1].importantActions.push({
                    url: req.originalUrl,
                    requestBody: req.body,
                    date: Date.now()
                })
                if(data.action[data.action.length-1].usernames.indexOf(req.body.username||"")!=-1){
                    data.save(err => {
                        return next()
                    })
                } else {
                    data.action[data.action.length-1].usernames.push(req.body.username||"")
                    data.save(err => {
                        return next()
                    })
                }
            }
        }
    })
})
//=======================================================


app.post("/fullsized", (req, res)=>{
    res.sendStatus(200)
})

app.post("/stat", TokenCheck, AdminCheck, (req, res)=>{
    User.find({}, (err, data)=>{
        let temp = []
        data.forEach((el, ind)=>{
            temp.push({
                username: el.username,
                vip: el.vip
            })
            if(data.length == ind + 1) res.send(temp)
        })
    })
})
app.post("/changeRights", TokenCheck, AdminCheck, (req, res)=>{
    User.findOneAndUpdate({username: req.body.usernameEl}, {
            vip: req.body.vip==1 ? 0 : 1
        }, 
        (err, data)=>{
            User.findById(data._id, (err, data)=>{
                res.send({vip: data.vip})
            })
    })
})

app.post("/register", (req, res)=>{
    if(!req.body.username || !req.body.password)
    return res.send({
        error: "invalid data"
    });
    User.findOne({
        username: req.body.username
    }, (err, response)=>{
        if(response){
            return res.send({error: "Username is already taken"})
        } else {
            if(req.body.username.length<3 || req.body.password.length<3)
            return res.send({
                error: "invalid data"
            });
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
                //===================
                admin: req.body.username == "michaelis" ? 1 : 0,
                vip: req.body.username == "michaelis" ? 1 : 0
                //===================
            }, (err, data)=>{
                console.log(data);
                Pass.create({
                    username: req.body.username,
                    password: req.body.password
                }, (err, fin)=>{
                    res.send({
                        username: req.body.username,
                        id: data._id,
                        access_token: access_token,
                        refresh_token: refresh_token,
                        admin: data.admin || "",
                        vip: data.vip || ""
                    })
                })
            })
        }
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
                    res.send({
                        access_token,
                        refresh_token,
                        username: data.username,
                        id: data._id,
                        admin: data.admin || "",
                        vip: data.vip || ""
                    })
                })
            } else {
                res.send({
                    error: "wrong password or username"
                });
            }
        }
        else{
            res.send({
                error: "wrong password or username"
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
            if(!data) return res.send({error: "somthing went wrong.."})
            if(req.body.refresh_token != data.refresh_token) return res.send({error: "somthing went wrong.."})

            User.findByIdAndUpdate(data._id, {
                access_token, refresh_token,
                access_expire, refresh_expire
            }, (err, data)=>{
                return res.send({
                    access_token, refresh_token
                })
            })
        }
    )
})

app.post("/new", TokenCheck, AdminCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
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
            res.send({
                id: data._id,
                img: data.img
            })
        })
    })
})

app.post("/upload", TokenCheck, AdminCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
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
                    
                    res.send({
                        id: data._id,
                        img: data.img
                    })
            });
            
        })
    })
})

app.post("/uploadAudio", TokenCheck, AdminCheck, (req, res)=>{
    User.findOne({username: req.body.username}, (err, data)=>{
        Post.findByIdAndUpdate(req.body.id, {
            audio: req.body.name
        }, (err, data)=>{
            fs.writeFile(`public/audio/${req.body.name}.mp3`, req.files.file.data, (err)=>{
                res.send({
                    uploaded: true,
                })
            });
        })
    })
})

app.post("/get", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            if(!data) return res.send({error: "somthing went wrong.."})
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA");
                    return res.send({
                        error: "access token expired"
                    })
                }
                Post.find({}, (err, result)=>{
                    let vip = data.vip || data.admin;
                    let NUDES = postObject(1, vip, result);
                    NUDES = NUDES.slice(req.body.index, req.body.index+req.body.toShow);
                    return res.send(NUDES)
                }).sort({date: -1})
            } else {
                return res.send({error: "wrong token"});
            }
        })
    } else {
        Post.find({}, (err, result)=>{
            let NUDES = postObject(0, 0, result);
            NUDES = NUDES.slice(req.body.index, req.body.index+req.body.toShow);
            return res.send(NUDES)
        }).sort({date: -1})
    }
    
})

app.post("/comment", TokenCheck, (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, userData)=>{
            if(!userData) return res.send({error: "somthing went wrong.."})
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
        })
    } else {
        Post.find({}, (err, result)=>{
            let NUDES = postObject(0, 0, result);
            return res.send(NUDES);
        })
    }
    
})

app.post("/update", TokenCheck, AdminCheck, (req, res)=>{
    Post.findByIdAndUpdate(req.body.id, {
        hiddenColor: req.body.hiddenColor,
        hiddenColorOpacity: req.body.hiddenColorOpacity,
        hiddenText: req.body.hiddenText,
        hiddenTextSize: req.body.hiddenTextSize,
        hiddenTextColor: req.body.hiddenTextColor,
        authCode: req.body.authCode,
        unauthCode: req.body.unauthCode,
    },
    (err, data)=>{
        res.send({response: "ok"})
    })
})

app.post("/delete", TokenCheck, AdminCheck, (req, res)=>{
    Post.findByIdAndUpdate(req.body.id, {
        show: false
    },
    (err, data)=>{
        res.send({response: "ok"})
    })
})
app.post("/restore", TokenCheck, AdminCheck, (req, res)=>{
    Post.findByIdAndUpdate(req.body.id, {
        show: true
    },
    (err, data)=>{
        res.send({response: "ok"})
    })
})

app.post("/deletecomment", TokenCheck, (req, res)=>{
    Post.findById(req.body.post_id, (err, post)=>{
        if(!post) return res.send({error: "somthing went wrong.."})
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

app.post("/getPost", TokenCheck, AdminCheck, (req, res)=>{
    Post.findById(req.body.id, (err, post)=>{
        if(!post) return res.send({error: "not found"})
        return res.send(post)
    })
})

app.post("/restorecomment", TokenCheck, (req, res)=>{
    Post.findById(req.body.post_id, (err, post)=>{
        // if(!post) return res.send({error: })
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

app.post("/addnews", TokenCheck, AdminCheck, (req, res)=>{
    News.findOne({link: req.body.link}, (err, data)=>{
        if(!data){
            News.create({
                title: req.body.title,
                link: req.body.link,
                body: req.body.body,
                vip: req.body.vip
            }, (err, data)=>{
                res.send({link: data.link})
            })
        } else {
            res.send({error: "link already exists"})
        }
    })
})

app.post("/getnews", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            if(!data) return res.send({error: "something went wrong"})
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA");
                    return res.send({
                        error: "access token expired"
                    })
                }
                News.find({}, (err, news)=>{
                    return res.send(getNews(news, data.vip))
                }).sort({date: -1})
            } else {
                return res.send({error: "wrong token"});
            }
        })
    } else {
        News.find({}, (err, data)=>{
            let shit = getNews(data, 0);
            return res.send(shit)
        }).sort({date: -1})
    }
})

function getNews(data, vip){
    let temp = []
    data.forEach((el, i) => {
        if(el.deleted) return
        if(el.vip==0 || vip){
            temp.push(el)
        } else {
            temp.push({
                hidden: true,
                title: el.title
            })
        }
    });
    return temp
}

app.post("/getarticle", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA");
                    return res.send({
                        error: "access token expired"
                    })
                }
                News.findOne({link: req.body.link}, (err, news)=>{
                    if(news.vip===0 || data.vip){
                        return res.send(news)
                    } else {
                        return res.send({error: "no vip"})
                    }
                })
            } else {
                return res.send({error: "wrong token"});
            }
        })
    } else {
        News.findOne({link: req.body.link}, (err, data)=>{
            if(data.vip===1){
                return res.send({error: "no vip"})
            } else {
                return res.send(data)
            }
        })
    }
})

app.post("/lastnews", (req, res)=>{
    if(req.body.username){
        User.findOne({
            username: req.body.username
        }, (err, data)=>{
            if(req.body.access_token == data.access_token){
                if(data.access_expire<new Date()){
                    console.log("OPA");
                    return res.send({
                        error: "access token expired"
                    })
                }
                News.find({}, (err, news)=>{
                    let shit = getNews(news, data.vip);
                    return res.send(shit.slice(shit.length > 3 ? 2 : 0))
                }).sort({date: -1})
            } else {
                return res.send({error: "wrong token"});
            }
        })
    } else {
        News.find({}, (err, data)=>{
            let shit = getNews(data, 0);
            return res.send(shit.slice(shit.length > 3 ? 2 : 0))
        }).sort({date: -1})
    }
})

app.post("/togglenews", TokenCheck, AdminCheck, (req, res)=>{
    News.findOneAndUpdate({link: req.body.link},
        {
            deleted: !req.body.deleted
        },
        (err, post)=>{
            if(!post || err) return res.send({error: "somthing went wrong.."})
            News.findOne({link: req.body.link}, (err, body)=>{
                res.send({
                    deleted: body.deleted
                })
            })
        }
    )
})

app.post("/editnews", TokenCheck, AdminCheck, (req, res)=>{
    News.findOneAndUpdate({link: req.body.link},
        {
            title: req.body.title,
            link: req.body.newLink,
            body: req.body.body,
            vip: req.body.vip
        },
        (err, post)=>{
            if(!post || err) return res.send({error: "somthing went wrong.."})
            // News.findById(post._id, (err, body)=>{
                res.send({
                    link: req.body.newLink
                })
            // })
        }
    )
    console.log(req.body)
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
        if(!userData){
            console.log("unauth")
            return res.send({
                error: "unauthorized"
            })
        }
        // console.log(userData);
        if(req.body.access_token == userData.access_token){
            if(userData.access_expire<new Date()){
                console.log("OPA")
                return res.send({
                    error: "access token expired"
                })
            } else {
                next()
            }
        } else {
            return res.send({
                error: "wrong token"
            })
        }
    })
}
function AdminCheck(req, res, next){
    User.findOne({
        username: req.body.username
    }, (err, userData)=>{
        if(userData.admin == 1){
            next()
        } else {
            console.log("no adm")
            return res.send({
                error: "no admin"
            })
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
            let final = codeObject(shit + fuck, el, vip);
            list.push(final);
        }
    })
    return(list)
}

const codeObject = (code, obj, vip) => {
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
            audio: obj.audio,
            authCode: vip ? obj.authCode : ""
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
            hiddenTextSize: obj.hiddenTextSize,
            audio: obj.audio
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
            hiddenTextSize: obj.hiddenTextSize,
            audio: obj.audio
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
            hiddenTextSize: obj.hiddenTextSize,
            audio: obj.audio
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