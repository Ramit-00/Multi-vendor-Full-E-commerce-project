import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import DealCard from "./DealCard";
import { useAppSelector } from "../../../../Redux Toolkit/Store";

export default function DealSlider() {
  const { homePage } = useAppSelector((store) => store);
  const rawDeals = homePage.homePageData?.deals || [];
  const seen = new Set<string>();
  const deals = rawDeals.filter((item: any) => {
    const key = String(item.category?.categoryId || item.category?._id || item.category?.name || item._id || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deals.length === 0) return null;

  const settings = {
    dots: false,
    infinite: true,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    speed: 2500,
    autoplaySpeed: 2500,
    cssEase: "linear",
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="py-2">
      <Slider {...settings}>
        {deals.map((item, index) => (
          <div key={index} className="px-2 pb-2">
            <DealCard deal={item} />
          </div>
        ))}
      </Slider>
    </div>
  );
}
