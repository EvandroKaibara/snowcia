package br.com.snowcia.offering;

import java.util.List;
import br.com.snowcia.offering.dto.ServiceOfferingRequest;
import br.com.snowcia.offering.dto.ServiceOfferingResponse;
import br.com.snowcia.user.AppUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ServiceOfferingService {
    private final ServiceOfferingRepository repository;
    public ServiceOfferingService(ServiceOfferingRepository repository) { this.repository = repository; }
    public List<ServiceOfferingResponse> list() { return repository.findAllByOrderByNameAsc().stream().map(ServiceOfferingResponse::from).toList(); }
    public ServiceOfferingResponse create(AppUser user, ServiceOfferingRequest request) { requireAdmin(user); return ServiceOfferingResponse.from(repository.save(newService(request))); }
    public ServiceOfferingResponse update(AppUser user, Long id, ServiceOfferingRequest request) { requireAdmin(user); var service = find(id); update(service, request); return ServiceOfferingResponse.from(repository.save(service)); }
    public ServiceOfferingResponse toggle(AppUser user, Long id) { requireAdmin(user); var service = find(id); service.update(service.getName(), service.getDescription(), service.getCategory(), service.getTarget(), service.getBillingType(), service.getDurationMinutes(), service.getDurationUnit(), !service.isActive(), service.isAllowDateSelection(), service.isAllowTimeSelection(), service.isAllowCustomerNotes(), service.isAllowCheckInOut(), service.getMaxPets(), service.getPriceConditions()); return ServiceOfferingResponse.from(repository.save(service)); }
    public void delete(AppUser user, Long id) { requireAdmin(user); repository.delete(find(id)); }
    private ServiceOffering newService(ServiceOfferingRequest r) { return new ServiceOffering(clean(r.name()), clean(r.description()), r.category(), r.target(), r.billingType(), r.durationMinutes(), r.durationUnit(), r.active(), r.allowDateSelection(), r.allowTimeSelection(), r.allowCustomerNotes(), r.allowCheckInOut(), r.maxPets(), prices(r)); }
    private void update(ServiceOffering service, ServiceOfferingRequest r) { service.update(clean(r.name()), clean(r.description()), r.category(), r.target(), r.billingType(), r.durationMinutes(), r.durationUnit(), r.active(), r.allowDateSelection(), r.allowTimeSelection(), r.allowCustomerNotes(), r.allowCheckInOut(), r.maxPets(), prices(r)); }
    private List<ServicePriceCondition> prices(ServiceOfferingRequest r) { return r.priceConditions().stream().map(p -> new ServicePriceCondition(clean(p.name()), p.price())).toList(); }
    private ServiceOffering find(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado")); }
    private void requireAdmin(AppUser user) { if (!user.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso exclusivo da administração"); }
    private String clean(String text) { return text == null || text.isBlank() ? null : text.trim(); }
}
