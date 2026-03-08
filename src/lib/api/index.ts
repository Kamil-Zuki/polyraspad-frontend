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
export { uploadImage } from "./media-client";
export type { UploadImageResponse } from "./media-client";

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
}

export const apiClient = new ApiClient();