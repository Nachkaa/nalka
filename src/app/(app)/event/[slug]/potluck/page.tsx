import { renderEventModuleRoute } from "../_components/render-event-module-route";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventPotluckPage({ params }: PageProps) {
  const { slug } = await params;
  return renderEventModuleRoute({
    slug,
    tab: "potluck",
  });
}
