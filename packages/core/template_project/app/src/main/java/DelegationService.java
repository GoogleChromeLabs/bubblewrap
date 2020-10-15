package <%= packageId %>;

<% for(const imp of delegationService.imports) { %>
import <%= imp %>;
<% } %>

public class DelegationService extends
        com.google.androidbrowserhelper.trusted.DelegationService {
    public DelegationService() {
        <% for(const code of delegationService.constructor) { %>
            <%= code %>
        <% } %>
    }
}

