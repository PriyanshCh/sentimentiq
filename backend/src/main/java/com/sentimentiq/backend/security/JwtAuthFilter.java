package com.sentimentiq.backend.security;

import com.sentimentiq.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final SecurityContextRepository securityContextRepository =
            new RequestAttributeSecurityContextRepository();
    private final SecurityContextHolderStrategy securityContextHolderStrategy =
            SecurityContextHolder.getContextHolderStrategy();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = null;

        // 1. Try Authorization header first
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // 2. Fall back to query param (needed for SSE/EventSource)
        if (token == null) {
            token = request.getParameter("token");
        }

        if (token != null) {
            if (jwtUtil.isTokenValid(token)) {
                String email = jwtUtil.extractEmail(token);
                var optUser = userRepository.findByEmail(email);
                if (optUser.isPresent()) {
                    var user = optUser.get();
                    UserDetails userDetails = User.builder()
                            .username(user.getEmail())
                            .password(user.getPassword())
                            .authorities(Collections.emptyList())
                            .build();

                    var authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    SecurityContext context = securityContextHolderStrategy.createEmptyContext();
                    context.setAuthentication(authToken);
                    securityContextHolderStrategy.setContext(context);
                    securityContextRepository.saveContext(context, request, response);
                    
                    logger.info("JWT Auth SUCCESS for user: " + email);
                } else {
                    logger.error("JWT Valid but USER NOT FOUND in database: " + email);
                }
            } else {
                logger.warn("JWT Token provided but INVALID (expired or bad signature) for path: " + request.getRequestURI());
            }
        } else {
            logger.debug("No JWT Token found in header or query param for path: " + request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}