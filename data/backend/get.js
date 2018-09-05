const request = require('request');
var fs = require('fs');

function BTC() {

	request('https://blockchain.info/de/ticker', (error, response, body) => {

		const data = JSON.parse(body);
		value = parseFloat(data.USD.last);


		if(value)
		{
			var json = {"ticker":{"price":value.toFixed(2)}};

			fs.writeFile("../../api/BTC-USD.xml", JSON.stringify(json), function(err) {}); 
		}
	});
}

function TRL() {

	request('https://tradeogre.com/api/v1/ticker/LTC-TRTL', (error, response, body) => {

		const data = JSON.parse(body);
		value = parseFloat(data.price);


		if(value)
		{
			var json = {"ticker":{"price":value.toFixed(8)}};

			fs.writeFile("../../api/LTC-TRTL.xml", JSON.stringify(json), function(err) {}); 
		}
	});
}
function SOLACE() {

	request('https://tradeogre.com/api/v1/ticker/LTC-SOLACE', (error, response, body) => {

		const data = JSON.parse(body);
		value = parseFloat(data.price);


		if(value)
		{
			var json = {"ticker":{"price":value.toFixed(8)}};

			fs.writeFile("../../api/LTC-SOLACE.xml", JSON.stringify(json), function(err) {}); 
		}
	});
}
function RYO() {

	request('https://tradeogre.com/api/v1/ticker/BTC-RYO', (error, response, body) => {

		const data = JSON.parse(body);
		value = parseFloat(data.price);


		if(value)
		{
			var json = {"ticker":{"price":value.toFixed(8)}};

			fs.writeFile("../../api/BTC-RYO.xml", JSON.stringify(json), function(err) {}); 
		}
	});
}
function LTC() {

	request('https://tradeogre.com/api/v1/ticker/BTC-LTC', (error, response, body) => {

		const data = JSON.parse(body);
		value = parseFloat(data.price);


		if(value)
		{
			var json = {"ticker":{"price":value.toFixed(8)}};

			fs.writeFile("../../api/BTC-LTC.xml", JSON.stringify(json), function(err) {}); 
		}
	});
}

function update(){
	BTC();
	TRL();
	SOLACE();
	LTC();
	RYO();
}

setInterval(()=>{
	update();
}, 60*1000);
update();

