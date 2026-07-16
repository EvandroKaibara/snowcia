package br.com.snowcia.notification;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);
    private final String webhookUrl;

    public WhatsAppNotificationService(@Value("${snowcia.whatsapp.webhook-url:}") String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }

    public void send(String phone, String message) {
        if (phone == null || phone.isBlank()) {
            log.warn("Notificação WhatsApp não enviada: o cliente não possui telefone cadastrado");
            return;
        }
        if (webhookUrl.isBlank()) {
            log.info("WhatsApp pendente de configuração para {}: {}", phone, message);
            return;
        }
        try {
            RestClient.create().post().uri(webhookUrl)
                    .body(Map.of("to", phone, "message", message))
                    .retrieve().toBodilessEntity();
        } catch (RuntimeException exception) {
            log.error("Falha ao enviar notificação WhatsApp para {}", phone, exception);
        }
    }
}
