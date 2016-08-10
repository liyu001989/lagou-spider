var jobModel = require('./job');
var jobUrl = 'http://www.lagou.com/jobs/%d.html';

jobModel.find({description: /.*laravel.*/i}, function(err, jobs) {
    jobs.forEach(function(job) {
        var jobItemUrl = jobUrl.replace('%d', job.positionId);

        console.log('<====');
        console.log(jobItemUrl);
        console.log(job.companyName);
        console.log(job.salary);
        console.log('====>');
    });
});
