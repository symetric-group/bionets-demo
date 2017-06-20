/** 
 * Systemic API code
 *
 * @author : Marie Lefebvre
 */

/**
 * Initial API to get initial regulatory graphe
 * @param {array} genesList
 * @param {string} queryType 
 * @param {Cytoscape object} cy
 */
function sparqlSysBio(genesList, queryType, cy) {
    var endpointURL = rootURL + '/systemic/network';
    genesList = genesList.split(",");
    var genesJSON = JSON.stringify(genesList);
    console.log(genesJSON, queryType);
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON + '&type=' + queryType,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // Get valid JSON format
            items = JSON.parse(JSON.stringify(data));  
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList, true);
            /**
             * Hide / show display
             */        
            document.getElementById("sendingQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            document.getElementById("graphe-legend").style.display = 'block';
            document.getElementById("next-level-regulation").style.display = 'block';
            // Update checkbox content
            checkboxContent(toUniq, "regulation");
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-regulation").style.display = 'none';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-regulation-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            }); 
            document.getElementById('btn-download').addEventListener("click", function exportGraph() {
                // var graphJson = cy.json();
                var CSV = [["source","target","\n"]];
                cy.edges().forEach(function( ele ){
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],"\n"]);
                });
                var a = document.getElementById('a');
                // var blob = new Blob([JSON.stringify(graphJson)], {'type':'application/json'});
                var blob = new Blob(CSV, {'type':'text/csv'});
                a.href = window.URL.createObjectURL(blob);
                a.download = 'graph.csv';
                a.click();
            }); 
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

/**
 * API to add regulation 
 * @param {array} genesList
 * @param {Cytoscape object} cy
 * 
 */
function nextLevelRegulation(genesList, cy) {
    endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    console.log("send", genesList);
    // Show 'query on run' message
    document.getElementById("sendingQuery").style.display = 'block';
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // Hide message
            document.getElementById("sendingQuery").style.display = 'none';
            // Get valid JSON format
            var items = JSON.parse(JSON.stringify(data));
            // Load new genes to graphe
            var toUniq = graphContent(cy,items); 
            // Apply layout
            graphLayout(cy, genesList);
            // Add item to checkbox
            checkboxContent(toUniq, "regulation");
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-regulation").style.display = 'none';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                // When toggle click, check all
                $('input:checkbox.next-regulation-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

/**
 * Initial API to get initial signaling graphe
 * @param {array} genesList
 * @param {Cytoscape object} cy
 */
function sparqlSignaling(genesList, cy) {
    var endpointURL = rootURL + '/systemic/network';
    genesList = genesList.split(",");
    var genesJSON = JSON.stringify(genesList);
    
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // Get valid JSON format
            items = JSON.parse(JSON.stringify(data));            
            // Set content of graph and get list of uniq regulators
            var toUniq = graphContent(cy, items) ;
            // Apply layout on loaded data
            graphLayout(cy, genesList, true);
            // Hide running query message        
            document.getElementById("sendingQuery").style.display = 'none';
            // Show legend
            document.getElementById("btn-collapse").style.display = 'block';
            checkboxContent(toUniq, "signaling");
            // Listen to dbclick on graph to fit on network
            document.getElementById('cy').addEventListener("dblclick", function resetGraph() {
                cy.fit();
            });
            document.getElementById("next-level-signaling").style.display = 'block';
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
                document.getElementById("next-level-signaling").style.display = 'none';
            }
            // Listen to checkbox option 'All'
            document.getElementById('toggle').addEventListener("click", function checklist() {
                var checker = $('.toggle').is(':checked');
                $('input:checkbox.next-signaling-checkbox').each(function() {
                    $(this).prop('checked',checker);
                });
            }); 
            document.getElementById('btn-download').addEventListener("click", function exportGraph() {
                // var graphJson = cy.json();
                var CSV = [["source","target","\n"]];
                cy.edges().forEach(function( ele ){
                    CSV.push([ele["_private"]["data"]["source"], ele["_private"]["data"]["target"],"\n"]);
                });
                var a = document.getElementById('a');
                // var blob = new Blob([JSON.stringify(graphJson)], {'type':'application/json'});
                var blob = new Blob(CSV, {'type':'text/csv'});
                a.href = window.URL.createObjectURL(blob);
                a.download = 'graph.csv';
                a.click();
            }); 
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL query failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
}

/**
 * API to add signalization 
 * @param {array} genesList
 * @param {Cytoscape object} cy
 * 
 */
function nextLevelSignaling(genesList, cy) {
    var endpointURL = rootURL + '/systemic/network';
    var genesJSON = JSON.stringify(genesList);
    // Show 'query on run' message
    document.getElementById("sendingQuery").style.display = 'block';
    // Request on regulation part
    $.ajax({
        type: 'GET',
        headers: {
            Accept: "application/json"
        },
        url: endpointURL,
        data: 'genes=' + genesJSON,
        dataType: "json",
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            // Get valid JSON format
            var itemsR = JSON.parse(JSON.stringify(data));
            endpointURL = rootURL + '/systemic/network-signaling';
            // Request on signaling part
            $.ajax({
                type: 'GET',
                headers: {
                    Accept: "application/json"
                },
                url: endpointURL,
                data: 'genes=' + genesJSON,
                dataType: "json",
                crossDomain: true,
                success: function (data, textStatus, jqXHR) {
                    // Get valid JSON format
                    var itemsS = JSON.parse(JSON.stringify(data));
                    // Load new genes to graphe
                    var toUniq_regulation = graphContent(cy,itemsR); 
                    // Load new genes to graphe
                    var toUniq_signaling = graphContentSignaling(cy,itemsS);
                    // Apply layout
                    graphLayout(cy, genesList);
                    // Hide message
                    document.getElementById("sendingQuery").style.display = 'none';
                    // Add item to checkbox
                    checkboxContent(toUniq_regulation, "signaling");
                    // Add item to checkbox
                    checkboxContent(toUniq_signaling, "signaling");
                    // Event : check all checkbox
                    document.getElementById('toggle').addEventListener("click", function checklist() {
                        var checker = $('.toggle').is(':checked');
                        // When toggle click, check all
                        $('input:checkbox.next-signaling-checkbox').each(function() {
                            $(this).prop('checked',checker);
                        });
                    });
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    document.getElementById("errorQuery").style.display = 'block';
                    document.getElementById("sendingQuery").style.display = 'none';
                    infoError("SPARQL querying failure: " + errorThrown);
                    console.log(jqXHR.responseText);
                }
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError("SPARQL querying failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

/**
 * API Run batch algo
 * @param {array} genesList
 * 
 */
function batchJob(genesList, queryType) {
    var endpointURL = rootURL + '/automatic/batch';
    // display info
    document.getElementById("sendingQuery").style.display = 'block';
    document.getElementById("noResult").style.display = 'none';
    // gene list format
    genesList = genesList.split(",");
    var genesJSON = JSON.stringify(genesList);
    // Request on automatic assembly
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        url: endpointURL,
        data: 'genes=' + genesJSON + '&type=' + queryType,
        crossDomain: true,
        success: function (data, textStatus, jqXHR) {
            document.getElementById("sendingQuery").style.display = 'none';
            var items = JSON.stringify(data);
            if ( isEmpty(items) === true ){
                document.getElementById("noResult").style.display = 'block';
            }else{
                document.getElementById('btn-download-csv').addEventListener("click", function exportAsCSV() {
                    var arrData = JSON.parse(JSON.stringify(data));
                    var csv = "origin,target,type,source";
                    for (var object in arrData) {
                        var row = "";
                        //2nd loop will extract each column and convert it in string comma-seprated
                        for (var index in arrData[object]) {
                            row += '"' + arrData[object][index][0]["value"] + '",';
                           // console.log(arrData[object][index][0]["value"]);
                        }
                        row.slice(0, row.length - 1);
                        //add a line break after each row
                        csv += row + '\r\n';
                    }
//                    var csv = convert(items);
//                    //Initialize file format you want csv or xls
                    var uri = 'data:text/csv;charset=utf-8,' + escape(csv);
//
//                    //this trick will generate a temp <a /> tag
                    var link = document.getElementById("a");
                    link.href = uri;
//
//                    //set the visibility hidden so it will not effect on your web-layout
////                    link.style = "visibility:hidden";
                    link.download = "graph.csv";
//
//                    //this part will append the anchor tag and remove it after automatic click
////                    document.body.appendChild(link);
                    link.click();
                });
                document.getElementById('btn-download-json').addEventListener("click", function exportAsJSON() {
                    console.log("export as json");
                    var JSON = items;
                    var c = document.getElementById('c');
                    var blob = new Blob([JSON], {'type':'application/json'});
                    c.href = window.URL.createObjectURL(blob);
                    c.download = 'graph.json';
                    c.click();
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("errorQuery").style.display = 'block';
            document.getElementById("sendingQuery").style.display = 'none';
            infoError(" Failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

function convert(data) {
    var CSV = '';
    var arrData = typeof data != 'object' ? JSON.parse(data) : data;
    //1st loop is to extract each row
    for (var i = 0; i < Object.keys(arrData).length; i++) {
        var row = "";
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }
        row.slice(0, row.length - 1);
        //add a line break after each row
        CSV += row + '\r\n';
    }
    if (CSV == '') {
        alert('No data available');
        return;
    }else {
        return CSV;
    }

};
