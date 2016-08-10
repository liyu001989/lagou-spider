#! /usr/bin/env node

var superagent = require('superagent'),
    cheerio = require('cheerio'),
    async = require('async')
    config = require('./config');

require('superagent-proxy')(superagent);
// 拉钩会封ip，所以需要代理，
var jobModel = require('./job');

var jobListUrl = 'http://www.lagou.com/jobs/positionAjax.json';

var parseContent = function(content)
{
    // 接口返回的所有jobs
    var jobs = content.content.positionResult.result;

        jobs.forEach(function(item) {
            jobModel.where({positionId: item.positionId}).count(function(err, count) {
                // 如果数据库里没有，则保存
                if (!count) {
                    job = new jobModel;
                    job.name = item.positionName;
                    job.companyName = item.companyShortName;
                    job.companyFullName = item.companyFullName;
                    job.createdAt = Date(item.formatCreateTime);
                    job.companyId = item.companyId;
                    job.positionId = item.positionId;
                    job.salary = item.salary;
                    job.companySize = item.companySize;
                    job.city = item.city;
                    job.save();
                }
            });
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
            process.exit();
        }

        return nextPage;
    },
    function (callback) {
        superagent.get(jobListUrl)
            .query(params)
            .query({ pn: pageNo })
            //.proxy(getProxy())
            .set('Connection', 'keep-alive')
            .end(function(err, sres) {
                if (err) {
                    return callback(err);
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
                setTimeout(callback, 15000);
                console.log('.');
            });
    },
    function (err, n) {
    }
);

