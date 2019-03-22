const parserBdScript = require('./jsonScriptToJsonDAO')

/**
 * transform a semantic json bd script into a json for DAO part 3
 * 
 * part 3 create all functions and sql script. 
 */

var toDAO = module.exports = {
    jsonScriptToJsonDao: function (jsonScript, callback) {
        parserBdScript.jsonScriptToJsonDao(jsonScript, res => {
            callback(writeRequest(res))
        })
        
    }
}

/**
 * 
 * @param {JSON} script - script from the part 2 
 * @return {JSON} - json with this form :
 *  {
 *      "tableName" : {
 *                      "nomFunction" : {
 *                                      query : "select ..."
 *                                      args : [arg1, arg2, ...]
 *                                      }
 *                      },
 *       "tableName" ...
 *  }
 * 
 *  query get '?' to be replaced by the arg with the same order
 */
function writeRequest(jsonScript) {
    let jsonRequest = JSON.parse('{}')
    for (var tableName in jsonScript) {

        jsonRequest[tableName] = JSON.parse('{}')

        writeCrud(tableName, jsonScript[tableName]['attr'], jsonRequest)
        
        writeNRelation(tableName, jsonScript[tableName]['boundTable'], jsonRequest)

        writeNNRelation(tableName, jsonScript[tableName]['boundTableNN'], jsonScript, jsonRequest)
    }

    return jsonRequest
}

function writeNNRelation(tableName, boundTableNN, jsonScript, jsonRequest)  {
    // TO-DO CRUD (only get is implemented)
    
   
    
    boundTableNN.forEach(function (boundTables) {
        let selectTableStar = "" // -> TableName.*
        let selectTable = "" // -> TableName
        let jointure = ""   // ->  jointure


        otherTables = boundTables['otherTables']
       
        for( var i = 0; i < otherTables.length; i++) {
            if (i == otherTables.length - 1) {
                selectTableStar += otherTables[i]['tableName'] +".*"
                selectTable += otherTables[i]['tableName'] 
                
            } else {
                selectTableStar += otherTables[i]['tableName'] +".*, "
                selectTable += otherTables[i]['tableName'] + ", "
            }

            jointure += boundTables['middleTable'] + '.' + otherTables[i]['attrBounded'] + " = " + otherTables[i]['tableName'] + '.' + otherTables[i]['attr'] + " AND ";
        }
        
        let getQuery = "SELECT " + selectTableStar + " FROM " + boundTables['middleTable'] + ", " + selectTable + " WHERE " +
        jointure + boundTables['middleTable'] + '.' + jsonScript[tableName]['attr'][0] + ' = ?;'
        
        let getArgs = "[" + jsonScript[tableName] + "]"
        
        let getRequest= createQueryJsonPlace(getQuery, getArgs)

        // TO-DO make a good name for a several N-N relation
        jsonRequest[tableName]['get' + otherTables[0]['tableName']] = getRequest 
    }); 
}

/**
 * write simple relation 1-* or *-1
 * @param {string} tableName - write all n relation for a table
 * @param {JSON} boundTables - cf prec doc for the format
 * @param {JSON} jsonRequest - the result
 */

function writeNRelation(tableName, boundTables, jsonRequest) {
    // TO-DO CRUD (only get is implemented)
    boundTables.forEach(table => {
        let getQuery = 'SELECT * from ' +  
        table["tableName"] + ' where ' + table["tableName"] + '.' + table['attr'] + '= ? '
        let getArgs = '[' + tableName.toLowerCase() + "." + table['attr'] + ']'

        let getRequest = createQueryJsonPlace(getQuery, getArgs)
        jsonRequest[tableName]['get' + table["tableName"]] = getRequest   
    });
}

/**
 * write 4 request : the crud for a table
 * @param {*} tableName 
 * @param {*} attrs - attributs of the table
 * @param {*} jsonRequest - the result place
 */
function writeCrud (tableName, attrs, jsonRequest) {
    let getQuery = 'SELECT * FROM ' + tableName + ' WHERE ' + attrs[0] + ' = ?'
    let getArgs = '[' + tableName.toLowerCase()  + '.' + attrs[0] + ']'
    let getRequest = createQueryJsonPlace(getQuery, getArgs)
    jsonRequest[tableName]['get' + tableName] = getRequest

    let deleteQuery = 'DELETE FROM ' + tableName + ' WHERE ' + attrs[0] + ' = ?'
    let deleteArgs = '[' + tableName.toLowerCase()  + '.' + attrs[0] + ']'
    let deleteRequest = createQueryJsonPlace(deleteQuery, deleteArgs)
    jsonRequest[tableName]['delete' + tableName] = deleteRequest

    let updateQuery = 'UPDATE ' + tableName + ' SET '
    // used two times (update and create, all attrs are required)
    let allArgs = '['
    for (let i = 0; i < attrs.length; i++) {
        if (i == attrs.length - 1) {
            updateQuery += attrs[i] + " = ?"
            allArgs += tableName.toLowerCase() + '.' + attrs[i] + ']'

        } else {
            updateQuery += attrs[i] + " = ?, "
            allArgs += tableName.toLowerCase() + '.' + attrs[i] + ', '
        }
    }
    let updateRequest = createQueryJsonPlace(updateQuery, allArgs)     
    jsonRequest[tableName]['update' + tableName] = updateRequest

    let createQuery = 'INSERT INTO ('
    let placeForArgs = '('
    for (let i = 0; i < attrs.length; i++) {
        
        if (i == attrs.length - 1) {
            createQuery += attrs[i] + ')'
            placeForArgs += '?)'
        } else {
            createQuery += attrs[i] + ', '
            placeForArgs += '?, '
        }
    }
    createQuery += " VALUES " + placeForArgs

    let createRequest = createQueryJsonPlace(createQuery, allArgs)
    jsonRequest[tableName]['create' + tableName] = createRequest
}


/**
 * 
 * @param {string} query 
 * @param {any][]} args - args needed to fill '?' present in the query 
 * return a json object with the place to store a request
 */
function createQueryJsonPlace(query, args) {
    return JSON.parse('{"query" : "' + query + '", "args": "' + args +'"}')
}