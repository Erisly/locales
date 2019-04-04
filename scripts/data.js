var fs = require('fs');
var request = require('request');
var async = require('async');

console.log("Requesting statistic data");
request('https://translate.pikagirl.me/api/components/PikaGirl/bot/statistics/', (err, res, data) => {
    if (err) throw new Error(err);

    if (res.statusCode == 200) {
        console.log("Parsing statistic data");
        var requestJSON = JSON.parse(data);

        var finalJSON = {};

        async.each(requestJSON.results, (result, callback) => {
            fs.readFile('./locales/' + result.code + '.json', 'utf-8', (err, resultData) => {
                if (err) throw new Error(err);

                try {
                    var resultData = JSON.parse(resultData);
                } catch (err) {
                    throw new Error(err);
                }

                var percentage = 0;

                async.forEachOf(resultData, (value, key, callback2) => {
                    if (value != "") percentage++;
                    callback2();
                }, function (err) {
                    if (err) throw new Error(err);

                    percentage = (percentage / Object.keys(resultData).length * 100).toFixed(1) + "%";

                    finalJSON[result.code] = {
                        code: result.code,
                        name: result.name,
                        translated: percentage
                    }
    
                    callback();
                });
            });
        }, function (err) {
            if (err) throw new Error(err);

            console.log("Reading data.json");
            fs.readFile('./data.json', 'utf-8', (err, _data) => {
                if (err) throw new Error(err);
    
                console.log("Merging statistic data");
                var dataJSON = JSON.parse(_data);
    
                async.forEachOf(dataJSON, (value, key, callback) => {
                    if (finalJSON[key] != null) {
                        if (value.flag != null) finalJSON[key].flag = value.flag;
                        else finalJSON[key].flag = "❓";
                    }
    
                    callback();
                }, function (err) {
                    if (err) throw new Error(err);

                    console.log("Writing statistic data");
                    fs.writeFile('./data.json', JSON.stringify(finalJSON, null, "\t"), async err => {
                        if (err) throw new Error(err);
        
                        console.log("Wrote statistic data");
                    });
                });
            });    
        });
    } else throw new Error('Request responded with status code: ' + res.statusCode);
});