var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost','lagou');
db.on('error',console.error.bind(console,'连接错误:'));

var jobSchema = new mongoose.Schema({
    name:String, // 职位名称
    companyName:String, //公司名称
    companyFullName:String, //公司全名
    createdAt:Date, // 创建时间
    companyId:Number, // 公司id
    positionId:Number, // job id
    salary:String, // 工资
    companySize:String, //公司规模
    desciprion:String,
    city:String
});

var jobModel = db.model('job',jobSchema);

module.exports = jobModel;
