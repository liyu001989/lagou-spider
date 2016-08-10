var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');

require('superagent-proxy')(superagent);

var defaultUrl = 'http://www.xicidaili.com/nn/';

var ips = [];
async.map([1], function(pageNo, callback) {
    var url = defaultUrl + pageNo;
    superagent.get(url)
        .end(function(err, sres) {
            if (err) {
                return callback(err);
            }

            try {
                var $ = cheerio.load(sres.text);

                $('tr').each(function(index, item) {
                    // 过滤掉表头
                    if (index == 0)  {
                        return;
                    }

                    var ip = $(item).children('td').eq(1).text();
                    var port = $(item).children('td').eq(2).text();

                    ip = 'http://' + ip + ':' + port;

                    ips.push(ip);
                });

                callback(null, ips);

            } catch(err) {
                callback(new Error('something wrong'));
            }
        });
}, function (err, results) {
    filterIps(ips);
});

var usableIps = [];
// 得到所有可用的ip
function filterIps(ips) {
    async.mapLimit(ips, 100, function(ip, filterCallback) {
        // 访问百度，超时30秒，返回200则为可用
        superagent.get('http://www.baidu.com')
            .proxy(ip)
            .end(function(err, sres) {
                if (err || sres.statusCode != 200) {
                    return filterCallback(err);
                }

                console.log(ip);
                usableIps.push(ip);
                return filterCallback(null, ip);
                done();

            });
    }, function (err, results) {
        console.log(usableIps);
    });
}
