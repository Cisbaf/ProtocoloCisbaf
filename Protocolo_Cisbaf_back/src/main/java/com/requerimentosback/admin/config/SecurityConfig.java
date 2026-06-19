package com.requerimentosback.admin.config;

import com.requerimentosback.admin.service.jwt.JwtRequestFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http){
        http.cors(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth


                        // ==========================

                        // ADMIN CONTROLLER

                        // ==========================

                        .requestMatchers(HttpMethod.GET, "/admin/{username}").authenticated()

                        .requestMatchers(HttpMethod.POST, "/admin/register").permitAll()

                        .requestMatchers(HttpMethod.POST, "/admin/login").permitAll()

                        .requestMatchers(HttpMethod.DELETE, "/admin/{id}").authenticated()


                        // ==========================

                        // FORMULARIO CONTROLLER

                        // ==========================

                        .requestMatchers(HttpMethod.GET, "/form").authenticated()
                        .requestMatchers(HttpMethod.GET, "/form/admin").authenticated()


                        .requestMatchers(HttpMethod.GET, "/form/{id}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/form/cep/{cep}").permitAll()

                        .requestMatchers(HttpMethod.GET, "/form/graficos", "/form/graficos/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/form/arquivos/download/**").authenticated()

                        .requestMatchers(HttpMethod.GET, "/form/{id}/mensagens").permitAll()
                        .requestMatchers(HttpMethod.POST, "/form/{id}/mensagens").permitAll()


                        .requestMatchers(HttpMethod.POST, "/form").permitAll()

                        .requestMatchers(HttpMethod.PUT, "/form/{id}").permitAll()

                        .requestMatchers(HttpMethod.DELETE, "/form/{id}").authenticated()

                        // ==========================

                        // USUARIOS CONTROLLER

                        // ==========================

                        .requestMatchers(HttpMethod.GET, "/user").authenticated()

                        .requestMatchers(HttpMethod.GET, "/user/{cpf}").permitAll()

                        .requestMatchers(HttpMethod.POST, "/user").permitAll()

                        .requestMatchers(HttpMethod.PUT, "/user/{cpf}").authenticated()

                        .requestMatchers(HttpMethod.DELETE, "/user/{cpf}").authenticated()

                        // ==========================

                        // SWAGGER UI

                        // ==========================

                        .requestMatchers(
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                )
                .addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
