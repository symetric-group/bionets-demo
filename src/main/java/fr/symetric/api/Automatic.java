/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.api;

import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.log4j.Logger;


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
            System.out.println(genes);
            System.out.println(queryType);
            return Response.status(200).header("Access-Control-Allow-Origin", "*").entity("{}").build(); 
        } catch (Exception ex) {
            logger.error(ex);
            return Response.status(500).header(headerAccept, "*").entity("Error while processing automatic network assembly").build();
        }
    }
}


