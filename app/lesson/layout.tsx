type Props = {
  children: React.ReactNode;
};

const LessonLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col h-screen bg-stone-50">
      {children}
    </div>
  );
};

export default LessonLayout;
