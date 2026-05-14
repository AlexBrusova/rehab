package com.rehabcenter.config

import com.rehabcenter.security.JwtAuthenticationFilter
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.core.env.Profiles
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableConfigurationProperties(JwtProperties::class)
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val environment: Environment,
) {

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val cfg = CorsConfiguration().apply {
            addAllowedOriginPattern("*")
            addAllowedHeader("*")
            addAllowedMethod("*")
        }
        return UrlBasedCorsConfigurationSource().also {
            it.registerCorsConfiguration("/**", cfg)
        }
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .cors { }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/health",
                    "/api/auth/login",
                    "/actuator/health",
                    "/actuator/health/**",
                    "/actuator/info",
                ).permitAll()
                if (environment.acceptsProfiles(Profiles.of("docker"))) {
                    it.requestMatchers("/actuator/prometheus").permitAll()
                }
                it.anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
        return http.build()
    }
}
