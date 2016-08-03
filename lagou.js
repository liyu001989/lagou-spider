#! /usr/bin/env node

var superagent = require('superagent'),
    cheerio = require('cheerio'),
    mongoose = require('mongoose'),
    urlencode = require('urlencode'),
    async = require('async');

require('superagent-proxy')(superagent);
// 拉钩会封ip，所以需要代理，
var proxy = 'http://74.208.146.112:80';

var config = require('./config');
var jobListUrl = 'http://www.lagou.com/jobs/positionAjax.json';
var jobUrl = 'http://www.lagou.com/jobs/%d.html';

var parseContent = function(content)
{
    var jobs = content.content.positionResult.result;

    async.mapLimit(jobs, 5, function(item, callback) {

        var jobItemUrl = jobUrl.replace('%d', item.positionId);

        console.log(jobItemUrl);
        superagent.get(jobItemUrl)
            .end(function(err, sres) {
                if (err) {
                    return next(err);
                }

                var content = sres.text;
                var $ = cheerio.load(content);

                jobDescription = $('.job_bt').text();

                if (jobDescription.indexOf(config.filter) > -1) {
                    item.job_description = jobDescription;
                    console.log(item);
                }

                setTimeout(callback, 10000);
            });

    }, function(err, result) {
        if (err) console.log(err);
    });
}

var pageNo = 1;
var params = { city: config.city, kd: config.kd };

var jsonResult;
var nextPage = true;
// 控制一下请求，一页一页的处理
async.whilst(
    function () {
        // 运行到没有结果为止
        if (!nextPage) {
            console.log('DONE');
        }

        return nextPage;
    },
    function (callback) {
        superagent.get(jobListUrl)
            .query(params)
            .query({ pn: pageNo })
            .proxy(proxy)
            .end(function(err, sres) {
                if (!sres) {
                    return;
                }

                jsonResult = JSON.parse(sres.text);

                if (!jsonResult.success) {
                    console.log(jsonResult);
                    return;
                }

                // 发现没结果了，pageNo为0，以这个当标志位吧
                nextPage = jsonResult.content.pageNo != 0 ? true : false;

                parseContent(jsonResult);
                pageNo++;
                setTimeout(callback, 10000);
            });
    },
    function (err, n) {
    }
);

