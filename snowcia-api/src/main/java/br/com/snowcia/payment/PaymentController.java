package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentRequest;
import br.com.snowcia.payment.dto.PaymentResponse;
import br.com.snowcia.user.AppUser;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @org.springframework.web.bind.annotation.ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody PaymentRequest request) {
        return paymentService.create(user, request);
    }

    @GetMapping
    public List<PaymentResponse> list(@AuthenticationPrincipal AppUser user) {
        return paymentService.list(user);
    }

    @GetMapping("/{id}")
    public PaymentResponse get(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return paymentService.get(user, id);
    }

    @PatchMapping("/{id}/confirm")
    public PaymentResponse confirm(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return paymentService.markAsPaid(user, id);
    }

    @PatchMapping("/{id}/cancel")
    public PaymentResponse cancel(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return paymentService.cancel(user, id);
    }
}
