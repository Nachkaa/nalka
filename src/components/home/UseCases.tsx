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
    <section
      id="how"
      className="bg-cream py-28 px-6"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-serif text-3xl md:text-4xl mb-12">
          Car un événement est un souvenir partagé.
        </h2>

        <div className="grid md:grid-cols-3 gap-10 text-center">
          {cases.map((c) => (
            <div
              key={c.title}
              className="flex flex-col items-center gap-4 group"
            >
              <img
                src={c.img}
                alt=""
                className="h-48 w-48 rounded-2xl object-cover shadow-md group-hover:scale-[1.03] transition duration-300"
              />

              <h3 className="font-serif text-xl">{c.title}</h3>
              <p className="text-forest/80 max-w-[14rem]">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
