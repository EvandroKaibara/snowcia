package br.com.snowcia.config;

import br.com.snowcia.role.RoleRepository;
import br.com.snowcia.user.AppUser;
import br.com.snowcia.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("dev")
public class DevelopmentAdminBootstrap {

    @Bean
    CommandLineRunner bootstrapAdmin(UserRepository userRepository, RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.name}") String name,
            @Value("${app.bootstrap-admin.email}") String email,
            @Value("${app.bootstrap-admin.password}") String password) {
        return args -> {
            if (email.isBlank() || password.isBlank()) {
                return;
            }
            if (userRepository.findByEmail(email).isPresent()) {
                return;
            }
            var adminRole = roleRepository.findByName("ADMIN")
                    .orElseThrow(() -> new IllegalStateException("Perfil ADMIN não encontrado"));
        userRepository.save(new AppUser(name, email, null, passwordEncoder.encode(password), adminRole));
        };
    }
}
