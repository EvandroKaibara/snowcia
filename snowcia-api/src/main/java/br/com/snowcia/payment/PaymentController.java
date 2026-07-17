package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentResponse;
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
    public List<PaymentResponse> list() {
        return paymentService.list();
    }

    @GetMapping("/{id}")
    public PaymentResponse get(@PathVariable Long id) {
        return paymentService.get(id);
    }

    @PatchMapping("/{id}/confirm")
    public PaymentResponse confirm(@PathVariable Long id) {
        return paymentService.markAsPaid(id);
    }

    @PatchMapping("/{id}/cancel")
    public PaymentResponse cancel(@PathVariable Long id) {
        return paymentService.cancel(id);
    }
    @PatchMapping("/{id}/pending") public PaymentResponse pending(@PathVariable Long id) { return paymentService.markAsPending(id); }
}
