package br.com.snowcia.pet;

import java.util.List;

import br.com.snowcia.pet.dto.PetRequest;
import br.com.snowcia.pet.dto.PetResponse;
import br.com.snowcia.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PetResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody PetRequest request) {
        return petService.create(user, request);
    }

    @GetMapping
    public List<PetResponse> list(@AuthenticationPrincipal AppUser user) {
        return petService.list(user);
    }

    @GetMapping("/{id}")
    public PetResponse get(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return petService.get(user, id);
    }

    @PutMapping("/{id}")
    public PetResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id,
            @Valid @RequestBody PetRequest request) {
        return petService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        petService.delete(user, id);
    }
}
