package <%= packageId %>;

<% for(const imp of delegationService.imports) { %>
import <%= imp %>;
<% } %>

public class DelegationService extends
        com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();

        <% for(const code of delegationService.onCreate) { %>
            <%= code %>
        <% } %>
    }
}

