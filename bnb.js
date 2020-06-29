const public_key=process.env.stripepublic;
const secret_key=process.env.stripesecret;

var express=require('express');
//Profile picture upload
var multer=require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+'/public/assets/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.jpg')
  }
})
var upload=multer({storage:storage});
//till here
require('dotenv').config();
var bodyParser = require('body-parser');
var Razorpay=require('razorpay');
var nodemailer=require('nodemailer');
var hbs=require('nodemailer-express-handlebars');
var Joi=require('@hapi/joi');
var bcrypt=require('bcryptjs');
var session=require('express-session');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var mongoose=require('mongoose');
var socket=require('socket.io');

var app=express();

let instance=new Razorpay({
	key_id:'rzp_test_K7vLK6BbrAprPI',
	key_secret:'kpkL5qvt1KDCJrzYHoHW1wkM'
})

//VIEW ENGINE
app.set('view engine','ejs');

//MIDDLEWARES
app.use(express.static('./public'));
app.use(express.json());
app.use(bodyParser.json());
app.use(session({secret:process.env.sessionsecret,resave: false,saveUninitialized: true}));


var server=app.listen(3000);





//DB Connection
mongoose.connect(process.env.mongoconnect);
var bnbSchema=new mongoose.Schema({
	hotel:String,
	price:String,
	duration:String,

});
var bnb=mongoose.model('bnb',bnbSchema);

//DB Schemas
var chatSchema=new mongoose.Schema({
	handle:String,
	message:String
});
var Chat=mongoose.model('Chat',chatSchema);
var accountSchema=new mongoose.Schema({
	name:String,
	pass:String,
	email:String,
	city:String,
	gender:String,
	ContactNo:String

});
var account=mongoose.model('users',accountSchema);
var bookingSchema=new mongoose.Schema({
	name:String,
	room:String,
	checkin:String,
	checkout:String
});

var booking=mongoose.model('confirmedbookings',bookingSchema);

var imageSchema=new mongoose.Schema({
	name:String,
	image:String
});
var imageupload=mongoose.model('profilepic',imageSchema);

var ownerschema=new mongoose.Schema({
	name:String,
	password:String
});
var owner=mongoose.model('owner',ownerschema);
//Joi schema:

var joischema=Joi.object({
	username:Joi.string().min(3).max(20).required(),
	password:Joi.string().min(3).max(20).required(),
	email:Joi.string().min(5).max(50).required().email(),
	repass:Joi.ref('password'),
	contactNo:Joi.number().integer().required(),
	gender:Joi.string().required(),
	city:Joi.string().required()
});




//Admin Route

app.get('/admin',function(req,res){
	res.render('adminlogin');
});
app.post('/admin-dashboard',urlencodedParser,function(req,res){
	owner.findOne({name:req.body.name},function(err,data){
		if(err){
			res.redirect('/admin');
		}
		if(bcrypt.compareSync(req.body.password,data.password)){
			req.session.admin_name=req.body.name;
			res.redirect('/admin-dashboard');
		}
	})
});

app.get('/admin-dashboard',function(req,res){
	booking.find({},function(error,docs){
		res.render('adminpage',{docs:docs});
	})
})

app.post('/userfind',urlencodedParser,function(req,res){
	res.redirect('/admin-dashboard/'+req.body.user);
});

app.get('/admin-dashboard/:name',function(req,res){
	booking.find({name:req.params.name},function(err,data){
		res.render('adminpage',{docs:data});
	})
})



//Routes





app.get('/ContactUs',function(req,res){
	var io=socket(server);
io.on('connection',function(socket){
	console.log('Connection made!');
	socket.on('chat',function(data){
		console.log(data.handle);
		Chat(data).save(function(err,data){
			console.log(data);
			io.sockets.emit('chat',data);
		})
		
	});
	Chat.find({handle:req.session.name},function(err,data){
		socket.emit('output',data);
	});
	socket.on('typing',function(data){
		socket.broadcast.emit('typing',data);
	})
});
	console.log(req.user);
	if(req.session.name){
		account.findOne({name:req.session.name},function(err,data){
			var displayhandle=data.name;
			console.log(displayhandle);
			res.render('chat',{message:null,handle:displayhandle,session:true});
		});
	
	}
	else{
		res.render('chat',{message:null,handle:null,session:false});
	}
});
app.post('/ContactUs',urlencodedParser,function(req,res){
	var io=socket(server);
io.on('connection',function(socket){
	console.log('Connection made!');
	socket.on('chat',function(data){
		console.log(data.handle);
		Chat(data).save(function(err,data){
			console.log(data);
			io.sockets.emit('chat',data);
		})
		
	});
	Chat.find({handle:req.session.name},function(err,data){
		socket.emit('output',data);
	});
	socket.on('typing',function(data){
		socket.broadcast.emit('typing',data);
	})
});	
	


	account.findOne({name:req.body.name}, function(err,data){
		if(data){
			if(bcrypt.compareSync(req.body.pass,data.pass)){
				req.session.name=req.body.name;
				var displayname=req.session.name;
				
				
				var today = new Date();
				var dd = String(today.getDate()).padStart(2, '0');
				var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
				var yyyy = today.getFullYear();
				today = yyyy + '-' + mm + '-' + dd;
				var mm1=+mm;
				var dd1=+dd;
				booking.find({name:req.body.name},function(error,data1){
					for(k=0;k<data1.length;k++){
						var day=+data1[k].checkout.slice(8,10);
						var month=+data1[k].checkout.slice(5,7);
						if(month<=mm1 && day<=dd1){

							booking(data1[k]).remove(function(er,docs){
								console.log('Booking removed');
							})
						}
					}
				})
				var message="You have been successfully logged in!!!"
			 res.render('chat',{message:message,handle:displayname,session:true});
			}
			else{
				res.redirect('/LogIn');
			}
		}
		else{
			return res.redirect('/LogIn');
		}
	});
	

});

app.get('/bnb',function(req,res){
	
	if(req.session.name){
		res.render('homebnb',{sessionid:req.session.name,session:true});
	}else{
		res.render('homebnb',{sessionid:null,session:false});
	}


	
});

app.get('/LogIn',function(req,res){
	res.render('login',{session:false});
});


app.post('/LogIn',urlencodedParser,function(req,res){
	console.log(req.body.name);
	var name1=req.body.name;
	res.json(req.body);
});
app.get('/Signup',function(req,res){
	res.render('signup',{error:null,session:false});
});
app.post('/Signup',urlencodedParser,function(req,res){
	console.log(req.body);
	var validation=joischema.validate(req.body);
	if(validation.error==undefined){
		console.log("hey there");
	}
	else{
		return res.redirect('/Signup');
	}
	account.findOne({name:req.body.username},function(error,result){
		if(result){
			alert('Username taken!!');
			res.redirect('/Signup');
		}
	});
	account.findOne({email:req.body.email},function(error,result){
		if(result){
			alert('This email ID is already registered!!');
			res.redirect('/Signup');
		}
	})
	if(req.body.password==req.body.repass){
		let transporter=nodemailer.createTransport({
		service:'gmail',
		auth:{
			user:process.env.secretemail,
			pass:process.env.secretemailpass
			}
		});
		

		let mailOptions={
			from:process.env.secretemail,
			to:req.body.email,
			subject:'Test mail',
			text:'You have successfully created an account on Travel BNB!!Congrats!!'
			
		};

		transporter.sendMail(mailOptions,function(err,data){
			if(err){
				console.log("Error");
			}
			else{
				console.log("Mail sent!!");
			}
		});
		
		
		var salt=bcrypt.genSaltSync(10);
		var hashedpass=bcrypt.hashSync(req.body.password,salt);

		account({name:req.body.username,pass:hashedpass,email:req.body.email,city:req.body.city,gender:req.body.gender,ContactNo:req.body.contactNo}).save(function(err,data){
		return res.redirect('/LogIn');
		});
	}
	else{
		let error="Passwords should match!!";
		res.render('signup',{error:error,session:true});
	}
	
});
app.get('/bnb/Suite',function(req,res){
	
	if(req.session.name){
		res.render('jw',{session:true,stripepublic:public_key});
	}else{
		res.render('jw',{session:false,stripepublic:public_key});
	}
	
});

app.get('/logout',function(req,res){
	req.session.destroy(function(err){
		console.log('Logged Out!!');
	});
	res.redirect('/bnb');
});

app.post('/bnb',urlencodedParser,function(req,res){
	let checkin=req.body.checkin;
	let checkout=req.body.checkout;
	let room=req.body.room;
	req.session.room=room;
	req.session.checkin=checkin;
	req.session.checkout=checkout;
	res.redirect('/bnb/'+room);
});

app.get('/profile',function(req,res){
	console.log(req.session.name);
	if(req.session.name){
		account.findOne({name:req.session.name},function(err,data){
			booking.find({name:req.session.name},function(error,data1){
				if(data1){
						
						
				    	imageupload.find({name:req.session.name},function(error1,docs){
				    		
				    		if(docs.length==0){
				    			console.log('Image undefined');
				    			res.render('profile',{data:data,session:true,bookings:data1,image:false});
				    		}
				    		else if(docs[0].image!=undefined){
				    			console.log(docs[0].image)
				    			var image=docs[0].image;
				    		var imagesend=image.slice(0,13);
				    	var imagesend1=imagesend.trim();
						res.render('profile',{data:data,session:true,bookings:data1,image:imagesend1});
				    		}
				    		
				    	});
				    	
					
					//else{
				//		res.render('profile',{data:data,session:true,bookings:data1,image:false});
				//	}
				}
				else{
					res.render('profile',{data:data,session:true,bookings:false,image:false});
				}
			})
			
		})
		
	}else{
		res.redirect('/LogIn');
	}
	
});



//Important when updating with payment!!
app.post('/book',urlencodedParser,function(req,res){
	if(!req.session.name){
		res.redirect('/LogIn');
	}
	booking({name:req.session.name,room:req.session.room,checkin:req.session.checkin,checkout:req.session.checkout}).save(function(err,data){
		
		console.log('Booked!');
		res.redirect('/profile');
		/*stripe.customers.create({
		    email: req.body.stripeEmail,
		    source: req.body.stripeToken
		  })
		  .then(customer => stripe.charges.create({
		    amount,
		    description: 'JW Mariott Room',
		    currency: 'usd',
		    customer: customer.id
		  }))
		  .then(charge => res.redirect('/profile'));*/

		
	})

});

app.post('/upload', upload.single('photo'), (req, res) => {
    if(req.file) {
    	console.log(req.file.filename);
    	req.session.image=req.file.filename;
    	imageupload.find({name:req.session.name},function(err,data){
    		imageupload(data[0]).remove(function(error,doc){
    			console.log('Previous profile pic removed');
    		});
    	});
    	imageupload({name:req.session.name,image:req.file.filename}).save(function(err,data){
    		console.log('profile pic saved');
    	});
       	res.redirect('/profile');
    }
    else throw 'error';
});

app.get('/upload',function(req,res){
	res.render('uploaded');
})

app.post('/cancel',function(req,res){
	if(req.session.name){
		
		var canceldata={name:req.session.name,checkin:req.body.checkout,checkout:req.body.checkout};
		booking.find({name:req.session.name,room:req.body.room,checkin:req.body.checkin,checkout:req.body.checkout},function(err,data){
			if(err){
				console.log('ERROR');
			}
			else{
				console.log(data[0]);
				booking(data[0]).remove(function(error,doc){
					if(error){
						console.log('Not removed');
					}
					else{
						console.log('Removed');
						res.json(doc);
					}
				})
			}
		});
	
	}

});

app.post('/payment',function(req,res){
	var options = {
  amount: 50000,  // amount in the smallest currency unit
  currency: "INR",
  receipt: "order_rcptid_11",
  payment_capture: '1'
};
instance.orders.create(options, function(err, order) {
  console.log(order);
  
  
  res.json(order);
});
})


var deletechats=1000*60*60;
setTimeout(function(){
	Chat.find({}).remove(function(err,data){
		console.log("chats deleted");
	})
},deletechats)





