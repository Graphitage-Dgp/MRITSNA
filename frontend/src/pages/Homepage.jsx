import BespokeRegistry from "../components/home/BespokeRegistry";
import CategoryIndex from "../components/home/CategoryIndex";
import Curation from "../components/home/Curation";
import Hero from "../components/home/Hero";
import NewArrivals from "../components/home/NewArrivals";
import Origins from "../components/home/Origins";

const Homepage = () => {
  return (
    <div className="w-full" id="homepage">
      <Hero />
      <NewArrivals />
      <Origins />
      <Curation />
      <CategoryIndex />
      <BespokeRegistry />
    </div>
  );
};

export default Homepage;
