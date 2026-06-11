package com.requerimentosback.admin.service;

import com.requerimentosback.admin.model.dtos.LoginDTO;
import com.requerimentosback.admin.service.jwt.JwtRequestFilter;
import com.requerimentosback.admin.service.jwt.JwtTokenUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.naming.AuthenticationException;
import java.util.stream.Collectors;

import static com.requerimentosback.admin.service.jwt.JwtRequestFilter.JWT_AUTH_COOKIE_NAME;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenUtil jwtTokenUtil;
    private final JwtRequestFilter jwtRequestFilter;


    public void login(LoginDTO login, HttpServletResponse response) throws AuthenticationException {
        if (login == null || login.username() == null) {
            return;
        }
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(login.username().trim(), login.password().trim()));

        final var userDetails = (UserDetails) authentication.getPrincipal();

        String roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        try {
            var acessToken = jwtTokenUtil.generateToken(userDetails.getUsername(), roles);

            jwtRequestFilter.setCookie(response, JWT_AUTH_COOKIE_NAME, acessToken);
        }catch (Exception e){
            throw new AuthenticationException(e.getMessage());
        }
    }

}
