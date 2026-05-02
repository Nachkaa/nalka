import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string; itemId: string }>;
};

export default async function EditGiftPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/event/${slug}/gifts`);
}
