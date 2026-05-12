import Home from "../Home";
import Services from "../../Services/Services";
import Resume from "../../Resume/Resume";
import Work from "../../Work/Work";
import Contact from "../../Contact/Contact";

const MainHome = () => {
  return (
    <div>
      <Home></Home>
      <Services></Services>
      <Resume></Resume>

      <Work></Work>

      <div className="pb-12">
        <Contact></Contact>
      </div>
    </div>
  );
};

export default MainHome;
