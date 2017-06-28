/** 
 * Systemic view code
 *
 * @author : Marie Lefebvre
 */

var DemoSysbioView = Backbone.View.extend({
    el: "#mainContainer", //Container div inside which we would be dynamically loading the templates
    initialize: function () {
        _.bindAll(this, "render");
        console.log('DemoSysBio View Initialized');
    },
    render: function () {
        var that = this;
        
        //Fetching the template contents
        $.get('templates/demo-systemic-home.html', function (data) {
            template = _.template(data, {});//Option to pass any dynamic values to template
            that.$el.html(template());//adding the template content to the main template.
            
        }, 'html');
        return this;
    },
    events: {
        "click #btnSearchRegulatoryNetwork": "querySearchNetwork",
//        "click #btnRegulatoryNetwork": "renderRegulatoryNetwork",
//        "click #btnAutomaticNetwork": "renderAutomaticNetwork",
        "click #query-type": "queryType",
        "click #btnRunBatch": "runBatch"
    },
//    renderRegulatoryNetwork: function () {
//        var that = this;
//        //Fetching the template contents
//        $.get('templates/demo-systemic-regulatory.html', function (data) {
//            template = _.template(data, {});//Option to pass any dynamic values to template
//            that.$el.html(template());//adding the template content to the main template.
//            
//        }, 'html');
//        return this;
//    },
//    renderAutomaticNetwork: function () {
//        var that = this;
//        //Fetching the template contents
//        $.get('templates/demo-systemic-automatic.html', function (data) {
//            template = _.template(data, {});//Option to pass any dynamic values to template
//            that.$el.html(template());//adding the template content to the main template.
//            
//        }, 'html');
//        return this;
//    },
    querySearchNetwork: function () {
        console.log("querySearchNetworkEvt");
        var queryType = $('input[name=query-type]:checked').val();
        // Initialize graphe visualization
        var cy = initialCy();
        var genesList = $('#inputGeneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            /** 
             * Hide / display messages
             */
            document.getElementById("emptyQuery").style.display = 'none';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
            document.getElementById("sendingQuery").style.display = 'block';
            document.getElementById("next-level-regulation").style.display = 'none';
            /**
             * Initialize checkbox content
             */
            var container = document.getElementById("input-next-regulation");
            while (container.hasChildNodes()){
                container.removeChild(container.firstChild);
            }
            // Make SPARQL initial query to PathwayCommons endpoint
            sparqlSysBio(genesList, queryType, cy);
            // Listen to event
            $( "#btnRunNextRegulation" ).click(function() {
                // Get gene list
                var regulatorList = updateList("regulation");
                if (regulatorList.length > 0){
                    // Make SPARQL queries to PathwayCommons endpoint
                    nextLevelRegulation(regulatorList, cy);
                }
            });
        }else{
            document.getElementById("emptyQuery").style.display = 'block';
            document.getElementById("errorQuery").style.display = 'none';
            document.getElementById("noResult").style.display = 'none';
        }
    },       
    /**
    * Listen to input type
    */
    queryType: function() {

        // When 'id' checked, return 'name'
        if ($('input[name=query-type]:checked').val() !== 'id'){
            $('#inputGeneList').val('ENSG00000158669,HGNC:4135,ENSG00000116133,ENSG00000084774');
        }else {
            $('#inputGeneList').val('AGPAT6,GALT,DHCR24,FTFD1,CAD');
        }
        // When 'id' checked, return 'name'
        if ($('input[name=input-type]:checked').val() !== 'id'){
            $('#geneList').prop('placeholder', "ENSG00000158669,HGNC:4135,ENSG00000116133,ENSG00000084774");
        }else {
            $('#geneList').prop('placeholder', "SLC25A21,TREX2,ATP1B3,DGUOK,ACOT1,CERS5,RIPK4,STK38,G6PC,CDK6,SOAT2,RFNG,FGFR1,FAAH2,DPYD,XYLT1,CDK10,IDH3A,LDHB,ALG6,MGAT2,PNPO,MINK1,ADCY2,KAT6A,TNKS,PTPRB,SMG1,PPM1J,SENP2,ALG1,NOS1,AAK1,GYS1,RPA2");
        }
    },       
    /**
    * API to run batch command
    */
    runBatch: function() {
        var genesList = $('#geneList').val().replace(/\s/g, '');
        if (genesList !== "") {
            var queryType = $('input[name=input-type]:checked').val();
            batchJob(genesList, queryType);
        }
    }
});

var myDemoSysbioView = new DemoSysbioView();

function initialCy() {
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'width' : 12,
                    'height' : 12,
                    'label': 'data(id)'
                }
            },
            {
                selector: '$node > node', // parent - meta node
                css: {
                    'padding-top': '10px',
                    'padding-left': '10px',
                    'padding-bottom': '10px',
                    'padding-right': '10px',
                    'text-valign': 'top',
                    'text-halign': 'center',
                    'background-color': '#bbb',
                    'background-opacity': 0.3
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#ccc',
                    'mid-target-arrow-color': '#ccc',
                    'mid-target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],
        layout: {
            name: 'cola',
            nodeSpacing: 5,
            avoidOverlap: true,
            maxSimulationTime: 4000,
            flow: { axis: 'y'},
            unconstrIter: 10,
            handleDisconnected: true
        }
    });
    return cy;
}