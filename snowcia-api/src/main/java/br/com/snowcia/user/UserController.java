package br.com.snowcia.user;

import java.util.List;
import br.com.snowcia.user.dto.PasswordChangeRequest;
import br.com.snowcia.user.dto.UserProfileRequest;
import br.com.snowcia.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users; private final PasswordEncoder passwordEncoder;
    public UserController(UserRepository users, PasswordEncoder passwordEncoder) { this.users = users; this.passwordEncoder = passwordEncoder; }
    @GetMapping("/me") public UserResponse me(@AuthenticationPrincipal AppUser user) { return UserResponse.from(user); }
    @PutMapping("/me") public UserResponse update(@AuthenticationPrincipal AppUser user, @Valid @RequestBody UserProfileRequest request) { user.updateProfile(request.name().trim(), request.phone().trim(), normalize(request.address())); return UserResponse.from(users.save(user)); }
    @PatchMapping("/me/password") public void password(@AuthenticationPrincipal AppUser user, @Valid @RequestBody PasswordChangeRequest request) { if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual inválida"); user.changePassword(passwordEncoder.encode(request.newPassword())); users.save(user); }
    @GetMapping("/clients") public List<UserResponse> clients(@AuthenticationPrincipal AppUser user) { if (!user.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ação restrita à administração"); return users.findAllByRole_NameOrderByNameAsc("CLIENT").stream().map(UserResponse::from).toList(); }
    @GetMapping("/reservation-administrators") public List<UserResponse> reservationAdministrators() { return users.findAllByEmailInOrderByNameAsc(List.of("jussara@snowcia.local", "isabella@snowcia.local")).stream().map(UserResponse::from).toList(); }
    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
