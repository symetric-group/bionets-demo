/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import fr.symetric.server.models.SessionRepositoryDAO;
import fr.symetric.server.models.UserRepositoryDAO;
import fr.symetric.server.models.User;
import fr.symetric.server.models.Session;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import fr.symetric.server.models.DAOFactory;
import javax.ws.rs.ext.Provider;
import org.apache.log4j.Logger;
import org.mongodb.morphia.query.Query;

/**
 *
 * @author Alban Gaignard <alban.gaignard@cnrs.fr>
 */

/**
 * Filter all incoming requests, look for possible session information and use that
 * to create and load a SecurityContext to request. 
 * @author "Animesh Kumar <animesh@strumsoft.com>"
 * 
 */
@Provider    // register as jersey's provider
public class SecurityContextFilter implements ResourceFilter, ContainerRequestFilter {
 
    private static Logger logger = Logger.getLogger(SecurityContextFilter.class);
    
    private SessionRepositoryDAO sessionRepository = DAOFactory.getSessionDAO();  // DAO to access Session
    private UserRepositoryDAO userRepository = DAOFactory.getUserDAO();  // DAO to access User
 
     
    @Override
    public ContainerRequest filter(ContainerRequest request) {
        // Get session id from request header
        final String sessionId = request.getHeaderValue("session-id");
        if (sessionId != null && !sessionId.contentEquals("null")) {
            logger.info("Web service call for session : "+sessionId);
        }
 
        User user = null;
        Session session = null;
 
        if (sessionId != null && sessionId.length() > 0) {
            // Load session object from repository
            session = sessionRepository.get(sessionId);
             
            // Load associated user from session
            if (null != session) {
                Query q = userRepository.createQuery().field("email").equal(session.getUserId());
                user = userRepository.findOne(q);
            }
        }
 
        // Set security context
        request.setSecurityContext(new SymetricSecurityContext(session, user));
        return request;
    }
 
    @Override
    public ContainerRequestFilter getRequestFilter() {
        return this;
    }
 
    @Override
    public ContainerResponseFilter getResponseFilter() {
        return null;
    }

    
}