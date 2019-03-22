const parserBdScript = require('./mysqlToJsonScript')


/**
 * transform a semantic json bd script into a json for DAO part 2
 */

 // BUG -- nn reflective relation

var toDAO = module.exports = {
    /**
     * 
     * @param {string} path - path to mysqlSCript
     * @param {function} callback - send the second parser
     */
    jsonScriptToJsonDao: function (path, callback) {

        parserBdScript.bdScriptToJson(path, function (table) {
            let parser2 = toJsonDAO(table)
            callback(parser2)
        })
    }
}



/**
 * transform a semantic json bd script into a json for DAO
 * @param {JSON} jsonScript 
 */
function toJsonDAO(jsonScript) {
    // two steps : first, in 1 - 1 or 1 - n relation only on of two table know the relation
    // give to the other the relation

    return giveRelationToOtherTable(jsonScript)

}

function giveRelationToOtherTable(jsonScript) {


    for (var tableName in jsonScript) {

        // n-n relation are avoid (need a juncture)
        if (!isNNRelation(jsonScript, tableName)) {
            optiRelation(jsonScript, tableName)
        } else {
            optiNNRelation(jsonScript, tableName)
        }
    }
    return jsonScript
}

function optiRelation(jsonScript, tableName) {
    for (var i = 0; i < jsonScript[tableName]['boundTable'].length; i++) {
                
        // Create the new boundedTable for the other table
        // bounded attr are inverted
        let boundTableJson = jsonScript[tableName]['boundTable'][i]
        let newBoundTable = JSON.parse('{ "tableName" :\"' + tableName + '\", "attrBounded" :\"' +
            boundTableJson['attr'] + '\", "attr" : \"' + boundTableJson['attrBounded'] + "\"}")

        // put the new relation in the table
        let otherTableName = boundTableJson["tableName"]

        jsonScript[otherTableName]['boundTable'].push(newBoundTable)
    }
}

/**
 * in relation n - n there is a third party table. This function add a Json object to simplify the creation of
 * reuqest in n - n relation
 * n-n relation has a table between then to make the connection
 * Creation of Json of middle Table (table with onby foreign key does not appear in DAO)
 * Create a json with this form :
 * {middleTable : "NameMiddleTable",
 * otherTable : [tableName : "otherTableName", attrBounded : "attrOfTableInMiddleTable", attr: "attrInTheTable", ...]} 
 *
 * @param {JSON} jsonScript 
 * @param {string} tableName 
 */
function optiNNRelation(jsonScript, tableName) {
    // TO-DO add NN reflective relation

    // Create a new place for nn relation with the special json object (a table can have several nn relation)
    for (var t in jsonScript) {
        jsonScript[t]['boundTableNN'] = JSON.parse('[]');
    }

   
    // range all boundTable of tables with only foreign key
    for (var i = 0; i < jsonScript[tableName]['boundTable'].length; i++) {
        // the first boundtable to fill
        let nameToFill = jsonScript[tableName]['boundTable'][i]['tableName']

        // all table in the relation (in simple n-n relation, juste one table)
        let boundTableNN = JSON.parse('{"middleTable" : "' + tableName + '", "otherTables":[]}')

       
        // range another time to fill all table with all OTHERS
        for (var j = 0; j < jsonScript[tableName]['boundTable'].length; j++) {
            if (i != j) {
                let boundTableToGive = jsonScript[tableName]['boundTable'][j];
            
                // Create the new boundedTable for the other table :  bounded attr are inverted
                let boundTable = JSON.parse('{ "tableName" :"' + boundTableToGive['tableName'] + '", "attrBounded" :"' +
                    boundTableToGive['attr'] + '", "attr" : "' + boundTableToGive['attrBounded'] + '"}')

                // add in otherTables relation
                boundTableNN['otherTables'].push(boundTable)
            }
        }
        
        jsonScript[nameToFill]['boundTableNN'].push(boundTableNN)

    }

}

/**
 * return true is the table is a n - n relation between two table
 * (no personnal attribut and only foreign key)
 * @param {JSON} jsonScript 
 * @param {string} tableName 
 */
function isNNRelation(jsonScript, tableName) {
    // table table has only foreign key
    return Object.keys(jsonScript[tableName]['boundTable']).length ==
        Object.keys(jsonScript[tableName]['attr']).length

}

