package com.requerimentosback.admin.service.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    public static final String JWT_AUTH_COOKIE_NAME = "loginToken";
    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;

    @Value("${jwt.expiration}")
    private int expiration;
    @Value("${jwt.httponly}")
    private boolean httponly;
    @Value("${jwt.secure}")
    private boolean secure;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {

        String jwt = null;
        String username = null;

        var authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }
        if (jwt == null) {
            jwt = getCookie(request);
        }
        if (jwt != null) {
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwt);
            } catch (Exception e) {
                logger.error(e.getMessage());
            }
        }
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try{
                var user = userDetailsService.loadUserByUsername(username);
                if (jwtTokenUtil.validateToken(jwt)) {
                    var authenticationToken = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }catch (Exception e){
                SecurityContextHolder.clearContext();
                logger.error("Erro ao carregar usuários: " + e.getMessage());
            }
        }
        filterChain.doFilter(request, response);
    }

    private String getCookie(@NonNull HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (JWT_AUTH_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    public void setCookie(@NonNull HttpServletResponse response, String TokenName, String value) {
        Cookie cookie = new Cookie(TokenName, value);
        cookie.setMaxAge(this.expiration);
        cookie.setSecure(secure);
        cookie.setHttpOnly(httponly);
        cookie.setPath("/");
        cookie.setAttribute("SameSite", "Lax");

        response.addCookie(cookie);
    }

    public void removeCookie(@NonNull HttpServletResponse response, String TokenName) {
        Cookie cookie = new Cookie(TokenName, null);
        cookie.setMaxAge(0);
        cookie.setHttpOnly(httponly);
        cookie.setPath("/");

        response.addCookie(cookie);
    }
}
