package br.com.snowcia.auth;

import br.com.snowcia.auth.dto.AuthResponse;
import br.com.snowcia.auth.dto.LoginRequest;
import br.com.snowcia.auth.dto.RegisterRequest;
import br.com.snowcia.role.RoleRepository;
import br.com.snowcia.user.AppUser;
import br.com.snowcia.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        var clientRole = roleRepository.findByName("CLIENT")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Papel CLIENT não encontrado"));
        var user = new AppUser(request.name().trim(), email, passwordEncoder.encode(request.password()), clientRole);
        userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(user), "Bearer", user.getRoleName());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.email().trim().toLowerCase(), request.password()));
        var user = (AppUser) authentication.getPrincipal();
        return new AuthResponse(jwtService.generateToken(user), "Bearer", user.getRoleName());
    }
}
