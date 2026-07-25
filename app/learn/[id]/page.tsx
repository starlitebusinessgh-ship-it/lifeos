import { BookReader } from "@/components/learn/BookReader";

export default async function LearnReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookReader bookId={id} />;
}
