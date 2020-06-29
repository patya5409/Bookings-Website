
var bodyParser = require('body-parser');
var request=require('request');
var city='New York';
var lat=18.5196;
var lon=73.8553;
var api_key="5a248b544948090a7725201c9b6071c5";
var url=`api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}`;
//5a248b544948090a7725201c9b6071c5
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//var data=[{item:"Cook"},{item:"Sleep"}];
var mongoose=require('mongoose');
mongoose.connect('mongodb+srv://patya5409:prachiti123@cluster0-tgxks.mongodb.net/test?retryWrites=true&w=majority');
var TodoSchema=new mongoose.Schema({
	item:String
});
var Todo=mongoose.model('Todo',TodoSchema);

module.exports=function(app){
	app.get('/todo',function(req,res){
		Todo.find({},function(err,data){
			res.render('folder',{data:data});
		});
		
	});
	app.post('/todo',urlencodedParser,function(req,res){
		console.log(req.body.item);
		console.log(req.body.extra);
		Todo({item:req.body.item}).save(function(err,data){
			Todo({item:req.body.extra}).save(function(err,data){
				res.json(data);
			})
				
			
				
		
			
		});

	});
	app.delete('/todo/:item',function(req,res){
		
		
		Todo.find({item:req.params.item}).remove(function(err,data){
			res.json(data);
		});
		
		
	});
	app.get('/weather',function(req,res){
		
		

/*  method: 'GET',
  url: 'https://weatherbit-v1-mashape.p.rapidapi.com/current',
  qs: {lang: 'en', lon: lon, lat: lat},
  headers: {
    'x-rapidapi-host': 'weatherbit-v1-mashape.p.rapidapi.com',
    'x-rapidapi-key': '75b1f5f22dmsh970670b83c630fdp1947f7jsn7cb97a4ce8c9',
    useQueryString: true
  }
};

request(options, function (error, response, body) {
	if (error) throw new Error(error);

	console.log(body);
	res.render('weather');
});*/

var options = {
  method: 'GET',
  url: 'https://climacell-microweather-v1.p.rapidapi.com/weather/nowcast',
  qs: {
    fields: 'temp',
    unit_system: 'si',
    lat: lat,
    lon: lon
  },
  headers: {
    'x-rapidapi-host': 'climacell-microweather-v1.p.rapidapi.com',
    'x-rapidapi-key': '75b1f5f22dmsh970670b83c630fdp1947f7jsn7cb97a4ce8c9',
    useQueryString: true
  }
};

request(options, function (error, response, body) {
	if (error) throw new Error(error);
	var temp=body[0].temp.value;
	console.log(temp);
	res.render('weather');
});
	});

};