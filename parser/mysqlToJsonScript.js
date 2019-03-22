const express = require('express')
const fs = require('fs')
const flow = require('flow')

/**
 * transform a mysql script into a json with the same semantics easier to manupulate
 * 
 * contraint : 
 * each table need a id in a first colum
 * @param {string} scriptPath 
 */



/**
 * transform a semantic json bd script into a json for DAO part 1
 */



module.exports = {
    bdScriptToJson : function (scriptPath, callback) {
        flow.exec(
            function() {
                readFile(scriptPath, this)
            }, 
    
            function (script) {
                callback(scriptTablesToJson(script));
            }
        );
    }
 }


/**
 * return a json format of tables
 * { "tableName" : 
 *      {    
 *          boundTable : [{tableName : "tableName", attrBounded : "attr", attr : "attr"}, ...],
 *          attr : ["attrName", ...] 
 *      }
 *  "tableName" :
 *      {    
 *          boundTable : [{tableName : "tableName", attrBounded : "attr", attr : "attr"}, ...],
 *          attr : ["attrName", ...] 
 *      }
 * }
 * 
 * boundTable : an other table linked with a foreign key. 
 * tableName : name of the linked table
 * attrBounded : attr in the other table linked
 * attr : attribut in the table linked with the bounded table
 * @param {string[]} scriptTables list of create table mysql script
 */
function scriptTablesToJson(script) {
    let tableJson = JSON.parse("{}")
    let scriptCreateTables = getCreateTable(script);
    
    scriptCreateTables.forEach(function (scriptTable) {
        
        // name and args are around quote 
        let indexQuote = searchIndexPatterns(scriptTable, "\`")
        
        // first take the name of a table and create the json object
        let tableName = scriptTable.substring(indexQuote[0] + 1, indexQuote[1])
        tableJson[tableName] = JSON.parse('{ "boundTable" : [], "attr" : []}');

        /* Exemple of a sql line : 
        * ADD CONSTRAINT `fKeySecret` FOREIGN KEY (`idSecret`) REFERENCES `Secret` (`idSecret`),
                            1                           2                       3       4
            keep 2 (attr), 3 (tableName) and 4 (attrBounded)
        */
        for (let i = 2; i < indexQuote.length; i+=2) {
            
            // add attribut of the table
            let arg = scriptTable.substring(indexQuote[i] + 1, indexQuote[i+1])
            tableJson[tableName]['attr'].push(arg);
            
        }
    });


    let boundedTable = getConstraintForeignKeyScript(script);

    boundedTable.forEach(function(scriptTable) {
        // table name and attr are between quote
        let indexQuote = searchIndexPatterns(scriptTable, "\`")

        // Get name of the table
        let tableName = scriptTable.substring(indexQuote[0] + 1, indexQuote[1])
          
        /* Exemple of a sql line : 
        * ADD CONSTRAINT `fKeySecret` FOREIGN KEY (`idSecret`) REFERENCES `Secret` (`idSecret`),
                            0                           1                       2       3
            keep 2 (attr), 3 (tableName) and 4 (attrBounded)
        */
       let cursorKey = -1;
       let boundTable = JSON.parse('{"tableName" : "", "attrBounded" : "", "attr" : ""}')
        for (let i = 2; i < indexQuote.length; i+=2) {
            cursorKey++
            // add attribut of the table
            let arg = scriptTable.substring(indexQuote[i] + 1 , indexQuote[i+1] )
            // if new bounded table
            if (cursorKey == 0) {
                boundTable = JSON.parse('{"tableName" : "", "attrBounded" : "", "attr" : ""}')
            }
            
            if (cursorKey == 1) {
                boundTable['attr'] = arg
            }

            if (cursorKey == 2) {
                boundTable['tableName'] = arg
            }

            // end of the ligne
            if (cursorKey == 3) {
                boundTable['attrBounded'] = arg
                
                // set the cursor for the next ligne
                cursorKey = -1
               
                tableJson[tableName]['boundTable'].push(boundTable)
               
            }
            
        }

    })
    
    return tableJson
}


/**
 * return script with constraint foreign key
 * @param {string} script 
 */
function getConstraintForeignKeyScript(script) {
    let tabIndex = searchIndexPatterns(script, "ALTER TABLE");
    return getConstraints(script, tabIndex)
}

function getConstraints(script, tabIndex) {
    let constraint;
    let constraints = [];
    tabIndex.forEach(function(deb) {
        let end = script.indexOf(";", deb);
        constraint = script.substring(deb, end)
        
        
        // check if the alter table is about constraint
        if (constraint.includes("FOREIGN KEY")) {
            constraints.push(constraint);
        }
    })

    return constraints;
}

/**
 * return all 
 * @param {*} script 
 */
function getT(script) {

}


/**
 * search and return all create table script
 * @param {string} script 
 */
function getCreateTable(script) {
    let tabIndex = searchIndexPatterns(script, "CREATE TABLE");   
    return getTables(script, tabIndex);
}

/**
 * search and return mysql table
 * @param {string} script 
 * @param {number[]} tabIndex begining of table
 */
function getTables(script, tabIndex) {
    let tables = [];
    tabIndex.forEach(function (index) {
        tables.push(getTable(script, index));
    });
    
    return tables;
}

/**
 * return the entire mysql table
 * @param {string} script all mysql script
 * @param {number} index of the beginning of a table
 * 
 * @returns {string} the mysql table
 */
function getTable(script, index) {
    let indexEndTable = script.indexOf("ENGINE", index + 1) - 1;
    return script.substring(index, indexEndTable)
}

/**
 * 
 * @param {*} path 
 * @param {*} callback 
 */
function readFile(path, callback) {
     fs.readFile(path, 'UTF8', (err, data) => {
        if (err) throw err;
        callback(data);
    })
}

// get all index of searched pattern in the script
function searchIndexPatterns(script, pattern) {
    let index = -1
    let tabIndex = []
    do {
        index = script.indexOf(pattern, index + 1);
        if (index != -1) {
            tabIndex.push(index)
        }
            
    } while (index != -1);

    return tabIndex
}
