var jobModel = require('./job');
var async = require('async');
var cheerio = require('cheerio');
var superagent = require('superagent');

var jobUrl = 'http://www.lagou.com/jobs/%d.html';

jobModel.find({description: null}, function(err, jobs) {
    console.log(jobs.length);
    // 这样一个一个抓跟同步其实没区别了
    // 等等研究proxy吧
    async.mapLimit(jobs, 1, function(job, callback) {
        var jobItemUrl = jobUrl.replace('%d', job.positionId);
        console.log(jobItemUrl);
        superagent.get(jobItemUrl)
            .end(function(err, res) {
                if (err || !res.text) {
                    console.log('something error')
                    return callback(err);
                }

                var $ = cheerio.load(res.text);

                job.description = $('.job_bt').text().trim();
                job.save();
                console.log('.');

                // 我怕被封ip慢慢抓
                setTimeout(callback, 5000);
            });
    });  
});
