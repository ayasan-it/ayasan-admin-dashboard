import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { LangProvider } from "@/i18n";
import Layout from "@/components/Layout";
import Dashboard          from "@/pages/Dashboard";
import BookingsDaily      from "@/pages/BookingsDaily";
import BookingsSubscription from "@/pages/BookingsSubscription";
import Workers            from "@/pages/Workers";
import Analytics          from "@/pages/Analytics";
import Reviews            from "@/pages/Reviews";
import Feedback           from "@/pages/Feedback";
import Marketing          from "@/pages/Marketing";
import Promotions         from "@/pages/Promotions";
import Points             from "@/pages/Points";
import GiftCatalog           from "@/pages/GiftCatalog";
import RedemptionRequests       from "@/pages/RedemptionRequests";
import SubscriptionCancellations from "@/pages/SubscriptionCancellations";
import Settings              from "@/pages/Settings";
import AreaPricing           from "@/pages/AreaPricing";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/"                        component={Dashboard}  />
        <Route path="/bookings"                ><Redirect to="/bookings/daily" /></Route>
        <Route path="/bookings/daily"          component={BookingsDaily}        />
        <Route path="/bookings/subscription"   component={BookingsSubscription} />
        <Route path="/workers"                 component={Workers}    />
        <Route path="/analytics"               component={Analytics}  />
        <Route path="/reviews"                 component={Reviews}    />
        <Route path="/feedback"                component={Feedback}   />
        <Route path="/area-pricing"            component={AreaPricing} />
        <Route path="/marketing"               component={Marketing}  />
        <Route path="/promotions"              component={Promotions} />
        <Route path="/points"                  component={Points}     />
        <Route path="/gifts"                   component={GiftCatalog} />
        <Route path="/gift-requests"             component={RedemptionRequests} />
        <Route path="/subscription-cancellations" component={SubscriptionCancellations} />
        <Route path="/settings/:tab?"          component={Settings}   />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <LangProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </LangProvider>
  );
}
