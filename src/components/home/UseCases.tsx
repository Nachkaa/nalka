// FILE: src/components/home/UseCases.tsx
import Image from "next/image";

export function UseCases() {
  const cases = [
    {
      title: "Anniversaire",
      text: "Invitez, récoltez des idées et profitez.",
      img: "/images/usecases/birthday.webp",
    },
    {
      title: "Noël",
      text: "Une liste pour chaques participants, des réservations sans spoil.",
      img: "/images/usecases/christmas.webp",
    },
    {
      title: "Couple",
      text: "Préparez ensemble chaque détail.",
      img: "/images/usecases/couple.webp",
    },
  ];

  return (
    <section id="how" className="bg-cream px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center font-serif text-3xl md:text-4xl">
          Car un événement est un souvenir partagé.
        </h2>

        <div className="grid gap-10 text-center md:grid-cols-3">
          {cases.map((c) => (
            <div key={c.title} className="group flex flex-col items-center gap-4">
              <div className="relative h-48 w-48 overflow-hidden rounded-2xl shadow-md">
                <Image
                  src={c.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 192px, 192px"
                  className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  priority={c.title === "Anniversaire"}
                />
              </div>

              <h3 className="font-serif text-xl">{c.title}</h3>
              <p className="text-forest/80 max-w-[14rem]">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
