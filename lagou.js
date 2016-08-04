#! /usr/bin/env node

var superagent = require('superagent'),
    cheerio = require('cheerio'),
    mongoose = require('mongoose'),
    urlencode = require('urlencode'),
    async = require('async');

require('superagent-proxy')(superagent);
// 拉钩会封ip，所以需要代理，
var ips = require('./proxy').ips;

var config = require('./config');
var jobListUrl = 'http://www.lagou.com/jobs/positionAjax.json';
var jobUrl = 'http://www.lagou.com/jobs/%d.html';

function getProxy()
{
    return ips[Math.floor(Math.random()*ips.length)];
}

var parseContent = function(content)
{
    // 接口返回的所有jobs
    var jobs = content.content.positionResult.result;

    // 5个并发去拿job详情
    async.mapLimit(jobs, 5, function(item, callback) {

        var jobItemUrl = jobUrl.replace('%d', item.positionId);
        console.log(jobItemUrl);

        superagent.get(jobItemUrl)
            .proxy(getProxy())
            .end(function(err, sres) {
                if (err) {
                    console.log(sres);
                    return;
                }

                var content = sres.text;
                var $ = cheerio.load(content);

                jobDescription = $('.job_bt').text();

                //console.log(jobDescription);
                //正则去匹配工作描述
                var re = new RegExp(config.filter,"gi");

                if (re.test(jobDescription)) {
                    console.log('====>');
                    console.log(item.companyFullName);
                    console.log(item.salary);
                    console.log(jobItemUrl);
                    console.log('<====');
                }

                setTimeout(callback, 15000);
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
            .proxy(getProxy())
            .end(function(err, sres) {

                jsonResult = JSON.parse(sres.text);

                if (!jsonResult.success) {
                    console.log(jsonResult);
                    return;
                }

                // 发现没结果了，pageNo为0，以这个当标志位吧
                nextPage = jsonResult.content.pageNo != 0 ? true : false;

                parseContent(jsonResult);
                pageNo++;
                setTimeout(callback, 15000);
                console.log('.');
            });
    },
    function (err, n) {
    }
);

