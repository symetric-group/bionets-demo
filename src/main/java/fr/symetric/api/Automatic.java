/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.jena.query.Query;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.QueryFactory;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author Marie Lefebvre
 */
@Path("automatic")
public class Automatic {
    
    private Logger logger = Logger.getLogger(Automatic.class);
    private String headerAccept = "Access-Control-Allow-Origin";
    
    /**
     *  Run batch command for automatic network assembly
     *  
     * @param genes
     * @param queryType
     * @return
     */
    @POST
    @Path("/batch")
    @Produces(MediaType.APPLICATION_JSON)
    public Response automaticNetwork(@FormParam("genes") String genes, @FormParam("type") String queryType ) {
        try {
            // initial list of biological entities
            JSONArray genesList = new JSONArray(genes);
            // initial model with direct interaction, first level of regulation
            Object[] initialResults = initialConstruct(genesList);
            System.out.println("Initial graph : DONE");
            Model initialModel = (Model)initialResults[0];
            // List of gene already done
            List geneDone = (List)initialResults[1];
            Model network = ModelFactory.createDefaultModel();
            // Final model
            network = regulationConstruct(initialModel, initialModel, geneDone);
            final StringWriter writer = new StringWriter(); 
            final StringWriter swriter = new StringWriter(); 
            network.write(writer, "RDF/JSON");
            network.write(swriter, "RDF/XML");
            HashMap<String, String> scopes = new HashMap<>();
            scopes.put("json", writer.toString());
            scopes.put("rdf", swriter.toString());
            
            System.out.println("Results will be send");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(scopes).build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while processing automatic network assembly").build();
        }
    }
    
        /**
     * Initial SPARQL query - First level of regulation (e.g. Transcription Factor)
     * @author Marie Lefebvre
     * @param genes list of biological entities
     * @return Object with JENA Model and List of genes
     * @throws java.io.IOException
     */
    public static Object[] initialConstruct(JSONArray genes) throws IOException {
        
        Model modelResult = ModelFactory.createDefaultModel();
        List<String> geneDone = new ArrayList<String>();
        try {
            for(int i=0; i < genes.length(); i++){
                StringBuilder result = new StringBuilder();
                String gene = genes.get(i).toString().toUpperCase();
                geneDone.add(gene);
                // SPARQL Query to get all transcription factors for a gene
                String queryString = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                            +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                            +"CONSTRUCT {\n"
                            +"?tempReac bp:displayName ?type ; bp:controlled ?controlledName ; bp:controller ?controllerName ; bp:dataSource ?source .\n"
                            +"} WHERE{ \n"
                            + "FILTER( (?controlledName = 'Transcription of "+gene+"'^^<http://www.w3.org/2001/XMLSchema#string>) "
                                + "and (?controllerName != '"+gene+"'^^<http://www.w3.org/2001/XMLSchema#string>) "
                                + "and (?source != 'mirtarbase'^^<http://www.w3.org/2001/XMLSchema#string>) ) .\n"
                            +"?tempReac a bp:TemplateReactionRegulation .\n"
                            +"?tempReac bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .\n"
                            +"?controlled bp:displayName ?controlledName .\n"
                            +"?controller bp:displayName ?controllerName .\n "
                            +"}";
                            //+"GROUP BY ?controlledName ?controllerName";
                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";

                URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                           .queryParam("query", "{query}")
                           .queryParam("format", "{format}")
                           .build(queryString, contentType);
                URLConnection con = requestURI.toURL().openConnection();
                con.addRequestProperty("Accept", contentType);
                InputStream in = con.getInputStream();

                // Read result
                BufferedReader reader = new BufferedReader(new InputStreamReader(in));

                String lineResult;
                while((lineResult = reader.readLine()) != null) {
                    result.append(lineResult);
                }
                // Prepare model
                ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                modelResult.read(bais, null, "RDF/JSON");
            } // End While
        }catch (Exception e){
            System.err.println(e.getMessage());
            System.exit(1);
        }
        return new Object[]{modelResult, geneDone};
    }
    
    /**
     * Stoping criterion : list of transcription factors empty
     * 
     * if listModel is empty { return tempModel; STOP }
     * listController = SelectQuery(on listModel);
     * for each controller in listController {
     *      if (controller not in geneDone) {
     *          geneDone.add(controller)
     *          Model m = Construct(controller);
     *          resultTemp.add(m);
     *      }
     * }
     * tempModel.add(resultTemp);
     * modelFinal = regulationConstruct(resultTemp, tempModel, geneDone);
     * return modelFinal
     * 
     * -> update ? to navigate in the local Jena Model, use API "navigation" instead of SPARQL querying (e.g. m.listObjectOfProperty(p))
     * https://jena.apache.org/documentation/javadoc/jena/org/apache/jena/rdf/model/Model.html
     * 
     * @param listModel {Model} 
     * @param tempModel {Model}
     * @param genesDone {ArrayList}
     * @return {Model}
     * @throws java.io.IOException
     */
    public static Model regulationConstruct(Model listModel, Model tempModel, List genesDone) throws IOException {
        
        // No next regulators
        if(listModel.isEmpty()){
            return tempModel;
        }
        // SPARQL Query to get controller of a model (e.g. gene)
        String queryStringS = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
            "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "SELECT DISTINCT ?controller\n" +
            "WHERE{ ?x bp:controller ?controller }" ;
        Model resultTemp = ModelFactory.createDefaultModel();
        // Create query
        Query queryS = QueryFactory.create(queryStringS) ;
        QueryExecution qex = QueryExecutionFactory.create(queryS, listModel);
        // Execute select
        ResultSet TFs = qex.execSelect();
        try {
        // For each regulators
        for ( ; TFs.hasNext() ; ){
            QuerySolution soln = TFs.nextSolution() ;
            StringBuilder result = new StringBuilder();
            RDFNode TF = soln.get("controller") ;       // Get a result variable by name (e.g. gene)
            // Research not done yet
            if( !genesDone.contains(TF) ){
                genesDone.add(TF);
                // SPARQL Query to get all transcription factors for a gene
                String queryStringC = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                    +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                    +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n"
                    +"CONSTRUCT {\n"
                        +"?tempReac bp:displayName ?type ; bp:controlled ?controlledName ; bp:controller ?controllerName ; bp:dataSource ?source .\n"
                    +"}"
                    + "WHERE{\n"
                      + "FILTER( (?controlledName = 'Transcription of "+TF+"'^^xsd:string)"
                            + "&& (?source != 'mirtarbase'^^xsd:string) ) .\n"
                      +"?tempReac a bp:TemplateReactionRegulation .\n"
                      +"?tempReac bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .\n"
                      +"OPTIONAL { ?controlled bp:displayName ?controlledName . }\n"
                      +"?controller bp:displayName ?controllerName .\n "
                    +"}";
                String contentType = "application/json";
                // URI of the SPARQL Endpoint
                String accessUri = "http://rdf.pathwaycommons.org/sparql";

                URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                           .queryParam("query", "{query}")
                           .queryParam("format", "{format}")
                           .build(queryStringC, contentType);
                URLConnection con = requestURI.toURL().openConnection();
                con.addRequestProperty("Accept", contentType);
                InputStream in = con.getInputStream();

                // Read result
                BufferedReader reader = new BufferedReader(new InputStreamReader(in));

                String lineResult;
                while((lineResult = reader.readLine()) != null) {
                    result.append(lineResult);
                }
                // Prepare model
                ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                resultTemp.read(bais, null, "RDF/JSON");
            }
        } // End for loop
        }catch(Exception e){
            System.err.println(e.getMessage());
        }
        //qex.close(); // Close select query execution
        tempModel.add(resultTemp);
        Model finalModel= regulationConstruct(resultTemp, tempModel, genesDone);
        return finalModel;
    }
}


