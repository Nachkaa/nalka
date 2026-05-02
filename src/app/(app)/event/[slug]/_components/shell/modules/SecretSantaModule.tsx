import { SecretSantaScreen } from "@/features/secret-santa/components/SecretSantaScreen";
import type { SecretSantaModuleProps } from "@/features/secret-santa/types";

export type { SecretSantaModuleProps } from "@/features/secret-santa/types";

export function SecretSantaModule(props: SecretSantaModuleProps) {
  return <SecretSantaScreen {...props} meEndpoint={`/api/secret-santa/${props.eventId}/me`} />;
}
