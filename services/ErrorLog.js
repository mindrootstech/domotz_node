// include node fs module
var fs = require('fs');

//Use
// ErrorLog.createlog(user)
//ErrorLog.createerrorlog(err)
class ErrorLog {
    static createerrorlog(err) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Add 1 to get the current month (January is 0)
        const date = currentDate.getDate();
        const fileName = `Error-Log-${year}-${month}-${date}`
        const stack = err.stack.split('\n');
        const firstStackLine = stack[1];
        const functionName = firstStackLine.trim().split(' ')[1];
        const data = `--------------------------Start Error-------------------------------------- \n\n\nlinenumber : ${firstStackLine} \nFunction : ${functionName} \nmessage: ${err.message} \nDate: ${fileName} \n\n\n --------------------------End Error--------------------------------------\n\n`
        fs.appendFile('logs/' + fileName + '.log', data, function (err) {
            if (err) throw err; 0
            console.log('Error file is created successfully.');
        });
    }
    static createlog(data) {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // Add 1 to get the current month (January is 0)
        const date = currentDate.getDate();
        const fileName = `Data-Log-${year}-${month}-${date}`
        const writeFileData = JSON.stringify(data)
        fs.appendFile('logs/' + fileName + '.log', writeFileData+'\n\n', function (err) {
            if (err) throw err; 0
            console.log('Error file is created successfully.');
        });
    }
}

export default ErrorLog;