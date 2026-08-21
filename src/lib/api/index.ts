export { BaseApiClient } from "./base-api-client";
export { AuthClient } from "./auth-client";
export { ProjectClient } from "./project-client";
export { DeckClient } from "./deck-client";
export { CardClient } from "./card-client";
export { UserSettingsClient } from "./user-settings-client";
export { AnalyticsClient } from "./analytics-client";
export { StudyClient } from "./study-client";
export { AutomationClient } from "./automation-client";
export { MarketplaceClient } from "./marketplace-client";
export { TextClient } from "./text-client";
export { TermClient } from "./term-client";
export { SubscriptionsClient } from "./subscriptions-client";
export { BillingClient } from "./billing-client";
export { IntegrationClient } from "./integration-client";
export { AgentClient } from "./agent-client";
export { LessonsClient } from "./lessons-client";
export { uploadImage, generateAudio } from "./media-client";
export type { UploadImageResponse } from "./media-client";
export { startImport } from "./import-client";
export type {
  ImportConfig,
  ImportColumnMapping,
  ImportJobResponse,
} from "./import-client";

// Combined client for backward compatibility
import { AuthClient } from "./auth-client";
import { ProjectClient } from "./project-client";
import { DeckClient } from "./deck-client";
import { CardClient } from "./card-client";
import { UserSettingsClient } from "./user-settings-client";
import { AnalyticsClient } from "./analytics-client";
import { StudyClient } from "./study-client";
import { AutomationClient } from "./automation-client";
import { MarketplaceClient } from "./marketplace-client";
import { TextClient } from "./text-client";
import { TermClient } from "./term-client";
import { SubscriptionsClient } from "./subscriptions-client";
import { BillingClient } from "./billing-client";
import { IntegrationClient } from "./integration-client";
import { AgentClient } from "./agent-client";
import { LessonsClient } from "./lessons-client";
import { AutopilotClient } from "./autopilot-client";
import { AdminClient } from "./admin-client";

class ApiClient {
  auth = new AuthClient();
  projects = new ProjectClient();
  decks = new DeckClient();
  cards = new CardClient();
  userSettings = new UserSettingsClient();
  analytics = new AnalyticsClient();
  study = new StudyClient();
  automation = new AutomationClient();
  marketplace = new MarketplaceClient();
  text = new TextClient();
  terms = new TermClient();
  subscriptions = new SubscriptionsClient();
  billing = new BillingClient();
  integrations = new IntegrationClient();
  agent = new AgentClient();
  lessons = new LessonsClient();
  autopilot = new AutopilotClient();
  admin = new AdminClient();
}

export const apiClient = new ApiClient();
