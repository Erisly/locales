var async = require('async');
var csv = require("fast-csv");
var request = require('request');
var config = require('./config.json');

var oldChangesJSON = [];

function main() {
    var changesJSON = [];
    var changesJSONProtected = [];
    request('https://translate.pikagirl.me/changes/csv', function (err, res, body) {
        if (err) {
            console.log(err);
            return;
        }

        if (res.statusCode == 200) {
            csv.fromString(body, {
                headers: true
            }).on("data", function (data) {
                changesJSON.push(data);
                changesJSONProtected.push(data);
            }).on("end", function () {
                request('https://translate.pikagirl.me/api/components/PikaGirl/bot/statistics/', function (err, res, statistics) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    if (res.statusCode != 200) {
                        console.log(statistics);
                        return;
                    }
                    try {
                        var statisticsJSON = JSON.parse(statistics);
                    } catch (Exception) {
                        console.log(Exception);
                        return;
                    }

                    if (oldChangesJSON.length == 0) {
                        oldChangesJSON = changesJSONProtected;
                        return;
                    }

                    async.each(oldChangesJSON, (oldChange, callback) => {
                        var filter = changesJSON.filter(c => c.timestamp == oldChange.timestamp);

                        if (filter.length != 0) {
                            async.each(filter, (filterChange, callback2) => {
                                changesJSON.splice(changesJSON.indexOf(filterChange), 1);
                                callback2();
                            }, function () {
                                callback();
                            });
                        }
                    }, function () {
                        changesJSON.sort(function (a, b) {
                            return new Date(a.timestamp) - new Date(b.timestamp);
                        });

                        var embedData = {
                            embeds: []
                        };

                        async.each(changesJSON, (change, callback) => {
                            var currentEmbed = {
                                title: change.action,
                                url: change.url,
                                color: 3373751,
                                timestamp: change.timestamp,
                                fields: []
                            };

                            if (change.user != '') {
                                currentEmbed.fields.push({
                                    name: 'User',
                                    value: change.user,
                                    inline: true
                                });
                            } else {
                                currentEmbed.fields.push({
                                    name: 'User',
                                    value: 'None',
                                    inline: true
                                });
                            }
                            if (change.target != '') {
                                currentEmbed.fields.push({
                                    name: 'Detail',
                                    value: change.target,
                                    inline: true
                                });
                            }
                            if (change.url.split('/bot/')[1] != '') {
                                var language = statisticsJSON.results.filter(s => s.code == change.url.split('/bot/')[1].split('/')[0])[0];
                                currentEmbed.fields.push({
                                    name: 'Language',
                                    value: '**' + language.name + '** (' + language.translated_percent + '% Translated)',
                                    inline: true
                                });
                            }

                            embedData.embeds.push(currentEmbed);
                            callback();
                        }, function () {
                            request.post({
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                url: config.webhook,
                                body: JSON.stringify(embedData)
                            }, function (err, res, body) {
                                if (err) console.log(err);
                                if (res.statusCode != 200) console.log(body);
                            });

                            oldChangesJSON = changesJSONProtected;
                        });
                    });
                });
            });
        } else console.log('Request responded with status code: ' + res.statusCode);
    });
}

setInterval(main, config.interval);
main();