import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function AddGiftPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/event/${slug}/gifts`);
}
