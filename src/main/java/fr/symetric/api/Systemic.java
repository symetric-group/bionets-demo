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
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;


/**
 *
 * @author Marie Lefebvre
 */
@Path("systemic")
public class Systemic {
    
    private Logger logger = Logger.getLogger(Systemic.class);
    private String headerAccept = "Access-Control-Allow-Origin";
    
    /**
     *  Transcription of Gene names or IDs
     *  See use of BioPAX for PathwayCommons
     * @param genes
     * @param queryType
     * @return
     * @throws JSONException
     */
    @GET
    @Path("/network")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchNetwork(@QueryParam("genes") String genes, 
            @QueryParam("type") String queryType) throws JSONException, MalformedURLException, IOException {
        
        JSONArray genesList = new JSONArray(genes);
        Model transcriptorModel = ModelFactory.createDefaultModel();
        Model finalModel = ModelFactory.createDefaultModel();
        List<String> idToNameList = new ArrayList<String>();
        
        // Use of IDs 
        if ("id".equals(queryType)) {
            JSONArray idList = genesList;
            genesList = IdToNameQuery(idList);
        }
        try {
            for(int i=0; i < genesList.length(); i++){
                if (genesList.get(i) != "" && genesList.get(i) != " ") {
                    StringBuilder result = new StringBuilder();

                    // Construct new graphe
                    // Filter on Trancription Factor and wihtout miRNA
                    String filterQuery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n"
                        +"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"
                        +"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n"
                        +"CONSTRUCT {\n"
                        +"?tempReac rdf:type ?kind ; bp:controlled ?controlledName ; bp:controller ?controllerName ; "
                            + "bp:dataSource ?source ; bp:controlType ?type ; rdf:participantType ?controllerType  .\n"
                        +"} WHERE{ \n"
                        + "FILTER( (?controlledName = 'Transcription of "+genesList.get(i).toString().toUpperCase()+"'^^xsd:string) "
                            + "and (?controllerName != '"+genesList.get(i).toString().toUpperCase()+"'^^xsd:string) "
                            + "and (?source != 'mirtarbase'^^xsd:string) ) .\n"
                        +"?tempReac a bp:TemplateReactionRegulation .\n"
                        +"?tempReac rdf:type ?kind ; bp:displayName ?reacName ; bp:controlled ?controlled ; bp:controller ?controller ; bp:controlType ?type ; bp:dataSource ?source .\n"
                        +"?controlled bp:displayName ?controlledName .\n"
                        +"?controller bp:displayName ?controllerName ; rdf:type ?controllerType .\n "
                        +"}"
                        +"GROUP BY ?controlledName ?controllerName";
                    System.out.println("Query created");

                    // Parsing json is more simple than XML
                    String contentType = "application/json";
                    // URI of the SPARQL Endpoint
                    String accessUri = "http://rdf.pathwaycommons.org/sparql";
                    URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                               .queryParam("query", "{query}")
                               .queryParam("format", "{format}")
                               .build(filterQuery, contentType);
                    URLConnection con = requestURI.toURL().openConnection();
                    con.addRequestProperty("Accept", contentType);
                    InputStream in = con.getInputStream();

                    // Read result
                    BufferedReader reader = new BufferedReader(new InputStreamReader(in));

                    String line;
                    while((line = reader.readLine()) != null) {
                        result.append(line);
                    }
                    // Prepare model
                    ByteArrayInputStream bais = new ByteArrayInputStream(result.toString().getBytes());
                    transcriptorModel.read(bais, null, "RDF/JSON");

                }
            } // End For Loop
            
            //System.out.println("Send second Query");
            //Model mtemp = selectQuery(transcriptorModel);
            finalModel.add(transcriptorModel);
            //finalModel.add(mtemp);
            //RDFDataMgr.write(System.out, mtemp, Lang.RDFJSON) ;
            final StringWriter writer = new StringWriter(); 
            finalModel.write(writer, "RDF/JSON");
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity(writer.toString()).build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while querying PathwayCommons endpoint").build();
        }
    }

    /**
     * Use IDs for initial graph
     * @author Marie Lefebvre
     * @param genesList
     * @return model
     * @throws org.codehaus.jettison.json.JSONException
     */
    public static JSONArray IdToNameQuery(JSONArray genesList) throws JSONException, IOException {
        List<String> idToNameList = new ArrayList<String>();
        JSONArray idList = genesList;
        for(int i=0; i < idList.length(); i++){
            // Retrieve corresponding name with given ID
            String idQuery = "PREFIX bp: <http://www.biopax.org/release/biopax-level3.owl#>\n" +
                "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> \n" +
                "SELECT DISTINCT ?name\n" +
                "WHERE{\n" +
                "  ?a bp:id ?b .\n" +
                "  FILTER ( ?b = '"+idList.get(i).toString().toUpperCase()+"'^^xsd:string )\n" +
                "  ?c ?d ?a .\n" +
                "  ?e ?f ?c .\n" +
                "  ?e bp:displayName ?name .\n" +
                "}\n";
            System.out.println("Query ID created");
            StringBuilder result = new StringBuilder();
            // Parsing json is more simple than XML
            String contentType = "application/json";
            // URI of the SPARQL Endpoint
            String accessUri = "http://rdf.pathwaycommons.org/sparql";

            URI requestURI = javax.ws.rs.core.UriBuilder.fromUri(accessUri)
                       .queryParam("query", "{query}")
                       .queryParam("format", "{format}")
                       .build(idQuery, contentType);
            URLConnection con = requestURI.toURL().openConnection();
            con.addRequestProperty("Accept", contentType);
            InputStream in = con.getInputStream();

            // Read result
            BufferedReader reader = new BufferedReader(new InputStreamReader(in));

            String line;
            while((line = reader.readLine()) != null) {
                result.append(line);
            }
            JSONObject jsonObj = new JSONObject(result.toString());
            JSONArray jsonAr = jsonObj.getJSONObject("results").getJSONArray("bindings");
            for (int j = 0 ; j < jsonAr.length(); j++) {
                JSONObject obj = jsonAr.getJSONObject(j).getJSONObject("name");
                idToNameList.add(obj.getString("value"));
            }
        }
        return new JSONArray(idToNameList);
    }
}


