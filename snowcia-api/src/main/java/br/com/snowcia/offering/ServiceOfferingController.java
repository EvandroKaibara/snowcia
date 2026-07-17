package br.com.snowcia.offering;

import java.util.List;
import br.com.snowcia.offering.dto.ServiceOfferingRequest;
import br.com.snowcia.offering.dto.ServiceOfferingResponse;
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
@RequestMapping("/api/services")
public class ServiceOfferingController {
    private final ServiceOfferingService service;
    public ServiceOfferingController(ServiceOfferingService service) { this.service = service; }
    @GetMapping public List<ServiceOfferingResponse> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ServiceOfferingResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody ServiceOfferingRequest request) { return service.create(user, request); }
    @PutMapping("/{id}") public ServiceOfferingResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody ServiceOfferingRequest request) { return service.update(user, id, request); }
    @PutMapping("/{id}/toggle") public ServiceOfferingResponse toggle(@AuthenticationPrincipal AppUser user, @PathVariable Long id) { return service.toggle(user, id); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) { service.delete(user, id); }
}
