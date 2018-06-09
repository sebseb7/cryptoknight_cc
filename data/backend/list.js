//const net = require("net");
const fs = require('fs');
//const express = require('express');
//const app = require('express')();
//const http = require('http');
//const path = require('path');
const winston = require('winston');
const request = require('request');
//var pmx = require('pmx');

//var probe = pmx.probe();

//var metric_online = probe.metric({
//	name    : 'Viewer'
//});

//const server = http.createServer(app);
//const io = require('socket.io').listen(server);
//const bodyParser = require('body-parser');
//app.use(bodyParser.json()); // support json encoded bodies
//app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//app.get('/', function(req, res) {
//	res.sendFile(path.resolve(__dirname+'/index.html'));
//});

const logger = new (winston.Logger)({
	transports: [
		new winston.transports.Console({timestamp:(new Date()).toLocaleTimeString(),colorize:true,level:'info'}),
		new winston.transports.File({name:'a',json:false,filename:'logfile.txt',timestamp:(new Date()).toLocaleTimeString(),level:'debug'}),
	]
});

//process.on("uncaughtException", function(error) {
//	logger.error(error);
//});

var config = JSON.parse(fs.readFileSync('config.json'));

logger.info("start http interface on port %d ", config.httpport);
//server.listen(config.httpport,'::');
var io = require('socket.io')(config.httpport);

var coins = {};
var updates = [];

var coins_full = {};
var updates_full = [];

var coins_conn = {};
	
function getPoolData(pool){
	
	request(pool.api+'/stats', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var api;

			try {
				api = JSON.parse(body);
			  } catch (e) {
			
				logger.info("errr "+body+":"+pool.api);
				setTimeout(getPoolData, 1200+(200*Math.random()),pool);
				return;	
			}


			var pct = ((api.pool.blocks.length / 2) / (api.network.height - api.pool.blocks[api.pool.blocks.length - 1]) * 100).toFixed(1)*1.0;
			if(!pct) pct =0;
			var nethash = (api.network.difficulty/api.config.coinDifficultyTarget).toFixed(0)*1.0;
			var effort = (api.pool.roundHashes/api.network.difficulty *100).toFixed(1)*1.0;
			var profit =0;
			if(api.charts && api.charts.profit3 && api.charts.profit3[api.charts.profit3.length -1] && api.charts.profit3[api.charts.profit3.length -1][1])
				profit = api.charts.profit3[api.charts.profit3.length -1][1].toFixed(2)*1.0;

		//	pool.metric_eff.set(effort);


			if(! coins[pool.name]) coins[pool.name]={name:pool.name,url:pool.url,algo:pool.algo,logo:pool.logo,phr:0,nhr:0,cnt:0,lnb:0,lpb:0,pct:0,eff:0,prof:0};
			

			if( api.pool.hashrate != coins[pool.name].phr) updates.push([pool.name,'phr',api.pool.hashrate]);
			if( nethash != coins[pool.name].nhr) updates.push([pool.name,'nhr',nethash]);
			if( api.pool.miners != coins[pool.name].cnt) updates.push([pool.name,'cnt',api.pool.miners]);
			if( pct != coins[pool.name].pct) updates.push([pool.name,'pct',pct]);
			if( effort != coins[pool.name].eff) updates.push([pool.name,'eff',effort]);
			if( profit != coins[pool.name].prof) updates.push([pool.name,'prof',profit]);
			if( api.network.timestamp != coins[pool.name].lnb) updates.push([pool.name,'lnb',api.network.timestamp]);
			if( (api.pool.lastBlockFound/1000).toFixed(0) != coins[pool.name].lpb) updates.push([pool.name,'lpb',(api.pool.lastBlockFound/1000).toFixed(0)]);
			
			coins[pool.name].phr=api.pool.hashrate;
			coins[pool.name].nhr=nethash;
			coins[pool.name].cnt=api.pool.miners;
			coins[pool.name].pct=pct;
			coins[pool.name].eff=effort;
			coins[pool.name].prof=profit;
			coins[pool.name].lnb=api.network.timestamp;
			coins[pool.name].lpb=(api.pool.lastBlockFound/1000).toFixed(0);
			
		}
		setTimeout(getPoolData, 400+(400*Math.random()),pool);
	});
}

for (var pool of config.pools) 
{
/*	pool['metric_eff'] = probe.metric({
		name    : pool.name+' eff',
		alert : {
			mode  : 'threshold',
			value : 700,
			msg   : 'Detected over 700% Effort at '+pool.name,
			cmp   : "<" // optional
		}
	});*/
	
	getPoolData(pool);
	
	coins_conn[pool.name]=0;
	(function(pool_name){
		if(! coins_full[pool_name]) coins_full[pool_name]={watch:0};
		io.of('/coin_'+pool_name).on('connection', function(socket){
			
			coins_conn[pool_name]++;
				
			if( coins_conn[pool_name] != coins_full[pool_name].watch) updates_full.push([pool_name,'watch',coins_conn[pool_name]]);
			coins_full[pool_name].watch=coins_conn[pool_name];
			
			socket.on('disconnect', function(reason){
				coins_conn[pool_name]--;
				
				if( coins_conn[pool_name] != coins_full[pool_name].watch) updates_full.push([pool_name,'watch',coins_conn[pool_name]]);
				coins_full[pool_name].watch=coins_conn[pool_name];
			});
		});
	})(pool.name);
}

var connected=0;

setInterval(() => {
	if(updates.length)
	{
		io.of('/main').to('pooldata').emit('u',updates);
		updates=[];
	}
}, 400);

setInterval(() => {
	if(updates_full.length)
	{
		io.of('/main').to('pooldata_full').emit('u2',updates_full);
		updates_full=[];
	}
}, 450);

io.of('/main').on('connection', function(socket){
	
	connected++;
	socket.emit('f',coins,connected);
//	metric_online.set(connected);
	io.of('/main').to('pooldata').emit('c',connected);
	
	socket.on('stream', function(value){
		if(value)
			socket.join('pooldata')
		else
			socket.leave('pooldata');
	});
	socket.on('stream_full', function(value){
		if(value){

			socket.join('pooldata_full')
		
			var iupdates=[];
		
			for(var name of Object.keys(coins_full)){
				iupdates.push([name,'watch',coins_full[name].watch]);
			}
			socket.emit('u2',iupdates);

		}else
			socket.leave('pooldata_full');
	});

	socket.on('disconnect', function(reason){
		connected--;
//		metric_online.set(connected);
		io.of('/main').to('pooldata').emit('c',connected);
	});
});
/*
setTimeout(function(){
	logger.info("restart ");
	process.exit(0);
}, 60 * 60 * 1000);
*/
