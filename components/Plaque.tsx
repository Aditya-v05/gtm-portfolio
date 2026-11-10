// A company plaque: a pixel box holding one of the user's pixel statues and
// the company's name.
export default function Plaque({ name, statue }: { name: string; statue: number }) {
  return (
    <li className="plaque">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="plaque__statue" src={`/statues/statue-${statue}.png`} alt="" width={128} height={128} />
      <span className="plaque__name">{name}</span>
    </li>
  );
}
