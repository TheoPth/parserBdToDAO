const requestParser = require('./jsonScriptToJsonRequest')
const fs = require('fs')
requestParser.jsonScriptToJsonDao("../parseTest.sql", function (jsonRequest) {
    createDAOs(jsonRequest)
    console.log ("Your DAO are ready.")
})

/**
 * create DAOs with request in different file in the same directory
 * @param {*} scriptRequest json with this form :
 * {
 *  "tableName" : {
 *          "functionName" : {
 *              query : "select or uptade ... = ? and ... = ?",
 *              args : "[arg1, arg2, ...]"
 *          }
 *      }
 * }
 * 
 */
function createDAOs (scriptRequest) {
    for(let table in scriptRequest) {
        
        let nodeFunctions = "let " + table.toLowerCase() + "DaoModule = {\n"
        for (let func in scriptRequest[table]) {
            nodeFunctions += createFunction(scriptRequest[table][func], func, table) 
        }
        nodeFunctions = nodeFunctions.substring(0, nodeFunctions.length-2) // virgule
        nodeFunctions += "\n}\n"
        nodeFunctions += "module.exports = " + table.toLowerCase() + "DaoModule"
        
        fs.writeFile('../DAO/' + table + ".js", nodeFunctions, (err) => {   
            if (err) throw err;
        });
    }
}

function createFunction (queryArgs, nameFunction, nameTable) {
    let func = 
    "\t" + nameFunction + ": function (req, " + nameTable.toLowerCase() + ", callback) {\n" +
        "\t\treq.getConnection(function(err, connection){\n" +
            "\t\t\tlet query = '" + queryArgs['query'] + "'\n" +
            "\t\t\tconnection.query(query, "+ JSON.stringify(queryArgs['args']).substring(1, JSON.stringify(queryArgs['args']).length -1) +", function(err, rows, fields) {\n" +
                "\t\t\t\tif (err) {\n"+
                    "\t\t\t\t\tconsole.log (err);\n"+
                    "\t\t\t\t\tconsole.log ('Error in function : "+ nameFunction +"');\n"+
                "\t\t\t\t}\n" +
                "\t\t\t\tcallback(rows);\n" +
            "\t\t\t});\n" +
        "\t\t});\n" +
    "\t},\n";

    return func
}
