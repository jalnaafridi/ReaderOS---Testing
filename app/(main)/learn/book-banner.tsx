type Props = {
  title: string;
  designingQuestion: string;
};

export const BookBanner = ({ title, designingQuestion }: Props) => {
  return (
    <div className="w-full rounded-xl bg-violet-600 p-5 text-white mb-8">
      <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
        Now Reading
      </p>
      <h2 className="text-2xl font-bold font-serif mb-2">{title}</h2>
      <p className="text-sm opacity-85 italic">
        &ldquo;{designingQuestion}&rdquo;
      </p>
    </div>
  );
};
