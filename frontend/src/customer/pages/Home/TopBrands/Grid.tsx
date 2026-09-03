import { useAppSelector } from "../../../../Redux Toolkit/Store";

const TopBrand = () => {
  const { homePage } = useAppSelector((store) => store);
  const gridItems = homePage.homePageData?.grid || [];

  if (gridItems.length < 6) return null;

  return (
    <div className="px-4 lg:px-12 py-6">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Curated Editorial
        </span>
        <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-2">
          Featured Brand Collaborations
        </h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
          Explore iconic seasonal styles directly from verified multi-brand designers
        </p>
      </div>

      <div className="grid gap-4 grid-rows-12 grid-cols-12 lg:h-[580px]">
        {/* Item 1 (Tall Left) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-12 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[220px]">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[0]?.image}
            alt="Editorial 1"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Item 2 */}
        <div className="col-span-6 sm:col-span-6 lg:col-span-2 row-span-6 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[160px]">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[1]?.image}
            alt="Editorial 2"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Item 3 */}
        <div className="col-span-6 sm:col-span-6 lg:col-span-4 row-span-6 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[160px]">
          <img
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[2]?.image}
            alt="Editorial 3"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Item 4 (Tall Right) */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 row-span-12 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[220px]">
          <img
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[3]?.image}
            alt="Editorial 4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Item 5 */}
        <div className="col-span-6 sm:col-span-6 lg:col-span-4 row-span-6 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[160px]">
          <img
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[4]?.image}
            alt="Editorial 5"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>

        {/* Item 6 */}
        <div className="col-span-6 sm:col-span-6 lg:col-span-2 row-span-6 relative rounded-2xl overflow-hidden group shadow-sm bg-slate-100 min-h-[160px]">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            src={gridItems[5]?.image}
            alt="Editorial 6"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default TopBrand;
