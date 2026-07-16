package br.com.snowcia.reservation;

import java.util.List;

import br.com.snowcia.reservation.dto.ReservationRequest;
import br.com.snowcia.reservation.dto.ReservationResponse;
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
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody ReservationRequest request) {
        return reservationService.create(user, request);
    }

    @GetMapping
    public List<ReservationResponse> list(@AuthenticationPrincipal AppUser user) {
        return reservationService.list(user);
    }

    @GetMapping("/{id}")
    public ReservationResponse get(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return reservationService.get(user, id);
    }

    @PutMapping("/{id}")
    public ReservationResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id,
            @Valid @RequestBody ReservationRequest request) {
        return reservationService.update(user, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        reservationService.delete(user, id);
    }
}
