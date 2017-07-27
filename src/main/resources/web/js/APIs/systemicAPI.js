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
    document.getElementById("noResult").style.display = 'none';
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
 * API Run batch algo
 * @param {array} genesList
 * @param {string} queryType
 * 
 */
function upstreamJob(genesList, queryType) {
    var endpointURL = rootURL + '/automatic/upstream';
    // display info
    document.getElementById("auto-sendingQuery").style.display = 'block';
    document.getElementById("auto-noResult").style.display = 'none';
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
        success: function (results, textStatus, jqXHR) {
            document.getElementById("auto-sendingQuery").style.display = 'none';
            var features = JSON.stringify(results["json"]);
            if ( isEmpty(features) === true ){
                document.getElementById("auto-noResult").style.display = 'block';
            }else{
                document.getElementById('panel-download-success').style.display = 'block';
                document.getElementById('btn-download-csv').addEventListener("click", function exportAsCSV() {
                    var arrData = JSON.parse(results["json"]);
                    var csv = "origin,target,type,source";
                    for (var object in arrData) {
                        var row = "";
                        //2nd loop will extract each column and convert it in string comma-seprated
                        for (var index in arrData[object]) {
                            
                            row += '"' + arrData[object][index][0]["value"] + '",';
                        }
                        row.slice(0, row.length - 1);
                        //add a line break after each row
                        csv += row + '\r\n';
                    }
                    //Initialize file format you want csv or xls
                    var uri = 'data:text/csv;charset=utf-8,' + escape(csv);
                    var link = document.getElementById("d");
                    link.href = uri;
                    link.download = "graph.csv";
                    link.click();
                });
                document.getElementById('btn-download-json').addEventListener("click", function exportAsJSON() {
                    var JSON = features.replace('\\','').replace('\n','');
                    var c = document.getElementById('c');
                    var blob = new Blob([JSON], {'type':'application/json'});
                    c.href = window.URL.createObjectURL(blob);
                    c.download = 'graph.json';
                    c.click();
                });
                document.getElementById('btn-download-rdf').addEventListener("click", function exportAsRDF() {
                    var b = document.getElementById('b');
                    var blob = new Blob([results["rdf"]], {'type':'xml/rdf'});
                    b.href = window.URL.createObjectURL(blob);
                    b.download = 'graph.rdf';
                    b.click();
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("auto-errorQuery").style.display = 'block';
            document.getElementById("auto-sendingQuery").style.display = 'none';
            infoError(" Failure: " + errorThrown);
            console.log(jqXHR.responseText);
        }
    });
};

/**
 * API Run batch algo
 * @param {array} genesList
 * @param {string} queryType
 * 
 */
function downstreamJob(genesList, queryType) {
    var endpointURL = rootURL + '/automatic/downstream';
    // display info
    document.getElementById("auto-sendingQuery").style.display = 'block';
    document.getElementById("auto-noResult").style.display = 'none';
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
        success: function (results, textStatus, jqXHR) {
            document.getElementById("auto-sendingQuery").style.display = 'none';
            var features = JSON.stringify(results["json"]);
            if ( isEmpty(features) === true ){
                document.getElementById("auto-noResult").style.display = 'block';
            }else{
                document.getElementById('panel-download-success').style.display = 'block';
                document.getElementById('btn-download-csv').addEventListener("click", function exportAsCSV() {
                    var arrData = results["json"];
                    var csv = "origin,target,type,source";
                    for (var object in arrData) {
                        var row = "";
                        //2nd loop will extract each column and convert it in string comma-seprated
                        for (var index in arrData[object]) {
                            console.log(arrData[object][index][0]);
                            row += '"' + arrData[object][index][0]["value"] + '",';
                        }
                        row.slice(0, row.length - 1);
                        //add a line break after each row
                        csv += row + '\r\n';
                    }
                    //Initialize file format you want csv or xls
                    var uri = 'data:text/csv;charset=utf-8,' + escape(csv);
                    var link = document.getElementById("d-down");
                    link.href = uri;
                    link.download = "graph.csv";
                    link.click();
                });
                document.getElementById('btn-download-json').addEventListener("click", function exportAsJSON() {
                    var JSON = features.replace('\\','').replace('\n','');
                    var c = document.getElementById('c-down');
                    var blob = new Blob([JSON], {'type':'application/json'});
                    c.href = window.URL.createObjectURL(blob);
                    c.download = 'graph.json';
                    c.click();
                });
                document.getElementById('btn-download-rdf').addEventListener("click", function exportAsRDF() {
                    var b = document.getElementById('b-down');
                    var blob = new Blob([results["rdf"]], {'type':'xml/rdf'});
                    b.href = window.URL.createObjectURL(blob);
                    b.download = 'graph.rdf';
                    b.click();
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            document.getElementById("auto-errorQuery").style.display = 'block';
            document.getElementById("auto-sendingQuery").style.display = 'none';
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
