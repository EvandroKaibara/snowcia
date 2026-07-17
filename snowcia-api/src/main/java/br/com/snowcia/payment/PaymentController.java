package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentResponse;
import br.com.snowcia.user.AppUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
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
    @PatchMapping("/{id}/pending") public PaymentResponse pending(@AuthenticationPrincipal AppUser user, @PathVariable Long id) { return paymentService.markAsPending(user, id); }
}
