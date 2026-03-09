import { SecretSantaSection } from "./secret-santa/SecretSantaSection";

export type SecretSantaModuleProps = {
  eventId: string;
  slug: string;
  isAdmin: boolean;
  membersCount: number;
  budgetCapCents: number | null;
  isSecondHandOk: boolean;
  isHandmadeOk: boolean;
};

export function SecretSantaModule(props: SecretSantaModuleProps) {
  return (
    <SecretSantaSection
      eventId={props.eventId}
      slug={props.slug}
      isAdmin={props.isAdmin}
      membersCount={props.membersCount}
      budgetCapCents={props.budgetCapCents}
      isSecondHandOk={props.isSecondHandOk}
      isHandmadeOk={props.isHandmadeOk}
    />
  );
}
