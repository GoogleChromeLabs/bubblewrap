package <%= packageId %>;

import com.google.androidbrowserhelper.trusted.DelegationService;
<% if (enableLocation) { %>
import com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler;
<% }%>

public class TwaDelegationService extends DelegationService {
    public TwaDelegationService() {
        <% if (enableLocation) { %>
        registerExtraCommandHandler(new LocationDelegationExtraCommandHandler());
        <% }%>
    }
}

